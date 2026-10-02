import json
import re

from backend.schemas.resume import (
    ATSAnalysisResponse,
    ResumeAnalysisResponse,
)

from backend.services.ats_service import (
    calculate_action_verbs_score,
    calculate_ats_score,
    calculate_experience_relevance,
    calculate_keyword_match,
    calculate_quantifiable_metrics_score,
    calculate_section_completeness,
    calculate_skill_match,
    detect_contact_info,
    infer_candidate_domain,
    validate_resume_document,
)

from .prompts import (
    RESUME_ANALYSIS_SYSTEM_PROMPT,
    build_resume_analysis_prompt,
)


class ResumeAgent:
    """Agent responsible for analyzing resumes across any professional domain."""

    def __init__(self, llm_client=None):
        if llm_client is None:
            try:
                from backend.services.llm_service import LLMService
                self.llm_client = LLMService()
            except Exception:
                self.llm_client = None
        else:
            self.llm_client = llm_client

    def analyze(
        self,
        resume_text: str,
        profile: dict | None = None,
        target_role: str | None = None,
        target_job: str | None = None,
        job_keywords: list[str] | None = None,
        required_skills: list[str] | None = None,
        experience_keywords: list[str] | None = None,
        required_sections: list[str] | None = None,
    ) -> ResumeAnalysisResponse:
        """Analyze a resume using LLM or dynamic real-time ATS domain evaluation."""

        if not resume_text or not resume_text.strip():
            raise ValueError("Resume text cannot be empty.")

        # 1. Contact, verb, and metrics detection
        contact_info = detect_contact_info(resume_text)
        verb_score, action_verbs = calculate_action_verbs_score(resume_text)
        metric_score, metrics_found = calculate_quantifiable_metrics_score(resume_text)
        section_comp = calculate_section_completeness(resume_text, required_sections)

        # 2. Extract detected skills dynamically across all industries
        from backend.services.skill_service import SKILL_ALIASES
        lower_text = resume_text.lower()
        detected_skills = set()
        for alias, canonical in SKILL_ALIASES.items():
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, lower_text):
                detected_skills.add(canonical)

        skill_list = sorted(list(detected_skills))
        inferred_domain = infer_candidate_domain(resume_text, skill_list)

        # 3. Dynamic RAG grounding & LLM-based analysis against target role & market standards
        rag_context = ""
        try:
            from backend.rag.retriever import CareerRAGRetriever
            retriever = CareerRAGRetriever()
            rag_query = f"{target_role or inferred_domain} key skills interview preparation requirements"
            rag_context = retriever.get_context_for_prompt(query=rag_query, top_k=2, role=target_role or inferred_domain)
        except Exception:
            rag_context = ""

        prompt = build_resume_analysis_prompt(
            resume_text=resume_text,
            profile=profile,
            target_role=target_role or inferred_domain,
            target_job=target_job,
            rag_context=rag_context,
        )

        response = None
        if self.llm_client is not None:
            try:
                raw_response = self.llm_client.generate_json(
                    system_prompt=RESUME_ANALYSIS_SYSTEM_PROMPT,
                    prompt=prompt,
                )
                if isinstance(raw_response, str):
                    raw_clean = raw_response.strip()
                    raw_clean = re.sub(r"^```(?:json)?\s*", "", raw_clean, flags=re.IGNORECASE)
                    raw_clean = re.sub(r"\s*```$", "", raw_clean)
                    response = json.loads(raw_clean)
                elif isinstance(raw_response, dict):
                    response = raw_response
            except Exception:
                response = None


        if response is not None and isinstance(response, dict):
            if "is_valid_resume" not in response:
                response["is_valid_resume"] = True
            if "inferred_domain" not in response:
                response["inferred_domain"] = inferred_domain
            response["contact_info"] = contact_info
            response["diagnostics"] = {
                "action_verbs_found": action_verbs,
                "action_verb_score": verb_score,
                "quantifiable_metrics": metrics_found,
                "quantifiable_metric_score": metric_score,
                "contact_completeness": contact_info.get("contact_score", 80.0),
            }
            # Ensure sub-scores exist
            extracted_skills = response.get("resume_skills") or skill_list
            response["resume_skills"] = extracted_skills
            if "keyword_match" not in response:
                response["keyword_match"] = round(min(100.0, max(20.0, float(response.get("ats_score", 70.0)))), 1)
            if "skill_match" not in response:
                response["skill_match"] = round(min(100.0, max(20.0, float(response.get("ats_score", 70.0)))), 1)
            if "experience_relevance" not in response:
                response["experience_relevance"] = round(max(50.0, float(verb_score)), 1)
            if "section_completeness" not in response:
                response["section_completeness"] = section_comp
            if "missing_keywords" not in response:
                response["missing_keywords"] = response.get("keyword_gaps", [])

            analysis = ResumeAnalysisResponse(**response)
        else:
            # Check document validity in fallback mode
            doc_val = validate_resume_document(resume_text)
            if not doc_val["is_valid"] and len(resume_text.strip()) > 150:
                return ResumeAnalysisResponse(
                    resume_score=15.0,
                    ats_score=10.0,
                    is_valid_resume=False,
                    inferred_domain="Unrecognized Document",
                    contact_info=contact_info,
                    diagnostics={
                        "validation_reason": doc_val["reason"],
                        "action_verbs_found": action_verbs,
                        "quantifiable_metrics": metrics_found,
                        "contact_completeness": contact_info["contact_score"],
                    },
                    resume_skills=skill_list,
                    resume_strengths=[],
                    resume_weaknesses=[
                        "Document lacks standard structural resume headers (Experience, Education, Skills, or Summary)",
                        "Cannot verify professional career history or candidate qualifications",
                    ],
                    missing_sections=["Experience", "Education", "Skills", "Summary"],
                    keyword_gaps=["Professional Experience", "Academic Background", "Key Skills"],
                    recommendations=[
                        "Please upload a standard professional resume or CV in PDF/DOCX format.",
                        "Ensure the document includes your contact info, work experience, education, and relevant skill sections.",
                    ],
                    keyword_match=0.0,
                    skill_match=0.0,
                    experience_relevance=0.0,
                    section_completeness=0.0,
                    missing_keywords=["Work History", "Education", "Skills"],
                )

            # Universal industry expectations mapped across all career professions
            role_expectations_map = {
                # Tech & Software
                "software engineer": ["Python", "JavaScript", "SQL", "Git", "REST APIs", "Docker", "Data Structures & Algorithms"],
                "frontend developer": ["React", "JavaScript", "HTML", "CSS", "TypeScript", "REST APIs", "Git"],
                "backend developer": ["Python", "FastAPI", "SQL", "Docker", "PostgreSQL", "REST APIs", "System Design"],
                "full stack developer": ["React", "Node.js", "Python", "SQL", "REST APIs", "Git", "Docker"],
                "devops engineer": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Git", "Terraform"],
                # Data & Analytics
                "data analyst": ["SQL", "Python", "Excel", "Statistics", "Power BI", "Tableau", "Data Analysis"],
                "data scientist": ["Python", "Machine Learning", "SQL", "Statistics", "Pandas", "Scikit-Learn", "Deep Learning"],
                # Management & Leadership
                "product manager": ["Product Management", "Agile", "Scrum", "Jira", "Stakeholder Management", "Roadmap", "Market Research"],
                "project manager": ["Project Management", "Agile", "Scrum", "Risk Management", "Budget Management", "Stakeholder Management"],
                # Human Resources
                "human resources": ["Talent Acquisition", "Recruitment", "HRIS", "Employee Relations", "Onboarding", "Labor Laws", "Performance Management"],
                "hr manager": ["Talent Acquisition", "Employee Relations", "HRIS", "Performance Management", "Payroll", "Workday", "Leadership"],
                "talent acquisition": ["Recruitment", "Talent Acquisition", "Interviewing", "Sourcing", "HRIS", "Communication"],
                # Marketing & Growth
                "digital marketing": ["SEO", "SEM", "Google Analytics", "Content Strategy", "Social Media Marketing", "Email Marketing"],
                "marketing manager": ["Digital Marketing", "Brand Strategy", "Content Strategy", "Market Research", "Campaigns", "Team Leadership"],
                # Sales & Business Development
                "sales": ["B2B Sales", "Lead Generation", "Salesforce", "CRM", "Negotiation", "Pipeline Management", "Client Relations"],
                "account executive": ["B2B Sales", "Salesforce", "Cold Calling", "Negotiation", "Customer Success", "Closing"],
                # Finance & Accounting
                "finance": ["Financial Modeling", "Financial Analysis", "Accounting", "QuickBooks", "GAAP", "Excel", "Financial Forecasting"],
                "accountant": ["Accounting", "GAAP", "QuickBooks", "Tax Preparation", "Auditing", "Excel", "SAP"],
                # Design & UI/UX
                "ui/ux designer": ["UI/UX Design", "Figma", "Wireframing", "Prototyping", "User Research", "Design Systems"],
                # Operations & Supply Chain
                "operations manager": ["Process Improvement", "Supply Chain Management", "Logistics", "Budget Management", "Team Leadership", "Procurement"],
                # General Professional
                "general professional": ["Communication", "Problem Solving", "Team Leadership", "Strategic Planning", "Cross-Functional Collaboration"],
            }

            target_key = (target_role or inferred_domain).lower()
            # Match best role key
            matched_key = "general professional"
            for rk in role_expectations_map:
                if rk in target_key or target_key in rk:
                    matched_key = rk
                    break

            expected = role_expectations_map.get(matched_key, role_expectations_map["general professional"])
            keyword_gaps = [exp for exp in expected if exp not in skill_list][:5]

            # Dynamic strengths based on actual content
            strengths = []
            if skill_list:
                strengths.append(f"Extracted {len(skill_list)} validated skills in {inferred_domain} ({', '.join(skill_list[:4])})")
            if action_verbs:
                strengths.append(f"Demonstrates dynamic leadership with {len(action_verbs)} action verbs ({', '.join(action_verbs[:3])})")
            if metrics_found:
                strengths.append(f"Includes quantifiable outcome metrics ({', '.join(metrics_found[:2])})")
            if not strengths:
                strengths.append(f"Standard professional structure detected for {inferred_domain}")

            # Dynamic weaknesses & gaps
            weaknesses = []
            if keyword_gaps:
                weaknesses.append(f"Lacks explicit mentions of high-demand {inferred_domain} competencies: {', '.join(keyword_gaps[:2])}")
            if metric_score < 40:
                weaknesses.append("Low density of quantifiable metrics (add specific percentage growth, dollar values, or project scale numbers)")
            if verb_score < 50:
                weaknesses.append("Bullet points could use stronger action verbs (e.g. Spearheaded, Engineered, Orchestrated)")
            if not contact_info.get("linkedin"):
                weaknesses.append("Missing direct LinkedIn or portfolio profile link")

            # Dynamic actionable recommendations
            recommendations = []
            if keyword_gaps:
                recommendations.append(f"Integrate key domain proficiencies like {keyword_gaps[0]} and {keyword_gaps[1] if len(keyword_gaps)>1 else 'KPI tracking'} in project descriptions.")
            if metric_score < 50:
                recommendations.append("Enhance bullet points with the XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.")
            if verb_score < 50:
                recommendations.append("Start each bullet point with high-impact action verbs (e.g., 'Transformed', 'Delivered', 'Optimized').")
            if contact_info.get("contact_score", 0) < 80:
                recommendations.append("Ensure your header contains full contact details including Email, Phone, and LinkedIn/Portfolio link.")

            # Calculate holistic ATS score: 30% skills, 25% sections, 20% verbs, 15% metrics, 10% contact
            skill_score = min(100.0, max(25.0, (len(skill_list) / max(len(expected), 1)) * 100))
            holistic_ats = round(
                (skill_score * 0.30)
                + (section_comp * 0.25)
                + (verb_score * 0.20)
                + (metric_score * 0.15)
                + (contact_info["contact_score"] * 0.10),
                1
            )
            overall_resume_score = round((skill_score * 0.4) + (section_comp * 0.3) + (verb_score * 0.15) + (metric_score * 0.15), 1)

            analysis = ResumeAnalysisResponse(
                resume_score=min(100.0, max(10.0, overall_resume_score)),
                ats_score=min(100.0, max(10.0, holistic_ats)),
                is_valid_resume=True,
                inferred_domain=inferred_domain,
                contact_info=contact_info,
                diagnostics={
                    "action_verbs_found": action_verbs,
                    "action_verb_score": verb_score,
                    "quantifiable_metrics": metrics_found,
                    "quantifiable_metric_score": metric_score,
                    "contact_completeness": contact_info["contact_score"],
                },
                resume_skills=skill_list if skill_list else ["Communication", "Problem Solving"],
                resume_strengths=strengths,
                resume_weaknesses=weaknesses,
                missing_sections=[],
                keyword_gaps=keyword_gaps,
                recommendations=recommendations,
                keyword_match=round(skill_score, 1),
                skill_match=round(skill_score, 1),
                experience_relevance=round(max(50.0, verb_score), 1),
                section_completeness=section_comp,
                missing_keywords=keyword_gaps,
            )

        # Calculate deterministic ATS metrics if specific job keywords are provided
        if (
            job_keywords is not None
            or required_skills is not None
            or experience_keywords is not None
        ):
            ats_result = self.analyze_ats(
                resume_text=resume_text,
                resume_skills=analysis.resume_skills,
                job_keywords=job_keywords or [],
                required_skills=required_skills or [],
                experience_keywords=experience_keywords or [],
                required_sections=required_sections,
            )

            analysis.ats_score = ats_result.ats_score
            analysis.keyword_match = ats_result.keyword_match
            analysis.skill_match = ats_result.skill_match
            analysis.experience_relevance = ats_result.experience_relevance
            analysis.section_completeness = ats_result.section_completeness
            analysis.missing_keywords = ats_result.missing_keywords

        return analysis


    def analyze_ats(
        self,
        resume_text: str,
        resume_skills: list[str],
        job_keywords: list[str],
        required_skills: list[str],
        experience_keywords: list[str],
        required_sections: list[str] | None = None,
        weights: dict[str, float] | None = None,
    ) -> ATSAnalysisResponse:
        """
        Calculate deterministic ATS metrics for a resume.

        The ATS score is calculated using keyword matching,
        skill matching, experience relevance, and section
        completeness.
        """

        if not resume_text or not resume_text.strip():
            raise ValueError("Resume text cannot be empty.")

        keyword_match, missing_keywords = calculate_keyword_match(
            resume_text=resume_text,
            job_keywords=job_keywords,
        )

        skill_match = calculate_skill_match(
            resume_skills=resume_skills,
            required_skills=required_skills,
        )

        experience_relevance = calculate_experience_relevance(
            resume_text=resume_text,
            experience_keywords=experience_keywords,
        )

        section_completeness = calculate_section_completeness(
            resume_text=resume_text,
            required_sections=required_sections,
        )

        ats_score = calculate_ats_score(
            keyword_match=keyword_match,
            skill_match=skill_match,
            experience_relevance=experience_relevance,
            section_completeness=section_completeness,
            weights=weights,
        )

        return ATSAnalysisResponse(
            ats_score=ats_score,
            keyword_match=keyword_match,
            skill_match=skill_match,
            experience_relevance=experience_relevance,
            section_completeness=section_completeness,
            missing_keywords=missing_keywords,
        )

    def to_career_manager_envelope(self, analysis: ResumeAnalysisResponse) -> dict:
        """Format analysis response for Career Manager contract (Section 32)."""
        return {
            "agent": "resume",
            "status": "success",
            "data": analysis.model_dump(),
        }