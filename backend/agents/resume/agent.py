import json
import re

from backend.schemas.resume import (
    ATSAnalysisResponse,
    GrammarIssue,
    MissingKeywordItem,
    ResumeAnalysisResponse,
    ResumeRecommendationItem,
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

from backend.services.skill_service import SKILL_ALIASES

from .prompts import (
    RESUME_ANALYSIS_SYSTEM_PROMPT,
    build_resume_analysis_prompt,
)


class ResumeAgent:
    """Agent responsible for analyzing resumes across any professional domain."""

    def __init__(self, llm_client="auto"):
        if llm_client == "auto":
            try:
                from backend.services.llm_service import LLMService
                self.llm_client = LLMService()
            except Exception:
                self.llm_client = None
        else:
            self.llm_client = llm_client


    def _extract_skills_from_text(self, text: str) -> list[str]:
        """Extract canonical skills from text using SKILL_ALIASES."""
        if not text:
            return []
        lower_text = text.lower()
        detected_skills = set()
        for alias, canonical in SKILL_ALIASES.items():
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, lower_text):
                detected_skills.add(canonical)
        return sorted(list(detected_skills))

    def _detect_grammar_and_resume_issues(self, resume_text: str) -> list[GrammarIssue]:
        """
        Identify actual grammar, spelling, punctuation, capitalization,
        and formatting problems grounded directly in the candidate's resume text.
        """
        issues: list[GrammarIssue] = []
        if not resume_text:
            return issues

        lines = [line.strip() for line in resume_text.splitlines() if line.strip()]

        # 1. Common spelling errors in resumes
        spelling_dict = {
            r"\bseperate\b": ("separate", "Spelling error: 'seperate' is misspelled."),
            r"\bdefinately\b": ("definitely", "Spelling error: 'definately' is misspelled."),
            r"\bacheive\b": ("achieve", "Spelling error: 'acheive' is misspelled."),
            r"\bexperiance\b": ("experience", "Spelling error: 'experiance' is misspelled."),
            r"\bmanagment\b": ("management", "Spelling error: 'managment' is misspelled."),
            r"\bresponsable\b": ("responsible", "Spelling error: 'responsable' is misspelled."),
            r"\benviroment\b": ("environment", "Spelling error: 'enviroment' is misspelled."),
            r"\bimpliment\b": ("implement", "Spelling error: 'impliment' is misspelled."),
            r"\bmaintainance\b": ("maintenance", "Spelling error: 'maintainance' is misspelled."),
            r"\btechnolgy\b": ("technology", "Spelling error: 'technolgy' is misspelled."),
            r"\blead\b(?=\s+(?:a\s+team|projects?|the\s+effort)\s+(?:in|from)\s+(?:20\d{2}|last\s+year))": (
                "led",
                "Grammar issue: Past tense 'led' should be used instead of 'lead' for past positions."
            ),
        }

        # 2. Inconsistent tech capitalization (e.g. "python" instead of "Python")
        tech_cap_rules = [
            (r"\bpython\b", "Python", "Language name should be capitalized as 'Python'."),
            (r"\bjavascript\b", "JavaScript", "Proper casing is 'JavaScript'."),
            (r"\btypescript\b", "TypeScript", "Proper casing is 'TypeScript'."),
            (r"\breact(?:\.js)?\b", "React", "Framework should be properly capitalized as 'React'."),
            (r"\bnode(?:\.js)?\b", "Node.js", "Runtime should be properly capitalized as 'Node.js'."),
            (r"\baws\b", "AWS", "Acronym for Amazon Web Services should be uppercase 'AWS'."),
            (r"\bsql\b", "SQL", "Database query language should be uppercase 'SQL'."),
            (r"\bdocker\b", "Docker", "Tool name should be capitalized as 'Docker'."),
            (r"\bkubernetes\b", "Kubernetes", "Container platform should be capitalized as 'Kubernetes'."),
            (r"\bgit\b", "Git", "Version control system should be capitalized as 'Git'."),
            (r"\bapi[s]?\b", "APIs", "Acronym for Application Programming Interface should be uppercase 'APIs'."),
            (r"\bhtml\b", "HTML", "Standard acronym should be uppercase 'HTML'."),
            (r"\bcss\b", "CSS", "Standard acronym should be uppercase 'CSS'."),
        ]

        # 3. Wordiness & Redundancies
        wordiness_rules = [
            (r"(?i)\bin order to\b", "to", "Wordy phrasing: 'in order to' can be simplified to 'to' for concise resume impact."),
            (r"(?i)\bresponsible for the development of\b", "developed", "Passive phrasing: Replace with active verb 'developed'."),
            (r"(?i)\bdue to the fact that\b", "because", "Wordiness: 'due to the fact that' should be replaced with 'because' or restructured."),
            (r"(?i)\bat this point in time\b", "currently", "Wordiness: Replace with 'currently'."),
            (r"(?i)\bfor the purpose of\b", "to", "Wordiness: Simplify 'for the purpose of' to 'to'."),
            (r"(?i)\bworked in the capacity of\b", "served as", "Wordy phrasing: Simplify 'worked in the capacity of' to 'served as'."),
        ]

        # 4. Passive voice / weak impact phrases
        passive_rules = [
            (r"(?i)\bworked on\b", "Engineered / Implemented", "Weak phrasing: 'worked on' does not indicate your specific technical ownership or impact."),
            (r"(?i)\bwas responsible for\b", "Spearheaded / Managed", "Passive phrasing: 'was responsible for' lists duties rather than accomplishments."),
            (r"(?i)\bhelped with\b", "Collaborated to deliver", "Weak phrasing: 'helped with' obscures your specific technical contribution."),
            (r"(?i)\bassisted in\b", "Contributed to", "Vague phrasing: 'assisted in' can be strengthened with concrete contribution details."),
        ]

        for line in lines:
            if len(line) < 10 or len(line) > 300:
                continue

            # Check spelling
            for pat, (correct, exp) in spelling_dict.items():
                m = re.search(pat, line, re.IGNORECASE)
                if m:
                    excerpt = line.lstrip("-*• ")
                    issues.append(
                        GrammarIssue(
                            original=m.group(0),
                            problem=f"Misspelled word in: \"{excerpt[:80]}...\"",
                            suggested_correction=correct,
                            explanation=exp,
                            issue_type="spelling",
                        )
                    )

            # Check tech capitalization if line is in a technical description or skill list
            for pat, correct, exp in tech_cap_rules:
                # only match if it's exact lowercase
                m = re.search(pat, line)
                if m and m.group(0) != correct:
                    excerpt = line.lstrip("-*• ")
                    issues.append(
                        GrammarIssue(
                            original=m.group(0),
                            problem=f"Inconsistent capitalization in: \"{excerpt[:70]}\"",
                            suggested_correction=correct,
                            explanation=exp,
                            issue_type="formatting",
                        )
                    )

            # Check wordiness
            for pat, correct, exp in wordiness_rules:
                m = re.search(pat, line)
                if m:
                    excerpt = line.lstrip("-*• ")
                    issues.append(
                        GrammarIssue(
                            original=m.group(0),
                            problem=f"Wordy phrasing in: \"{excerpt[:70]}\"",
                            suggested_correction=correct,
                            explanation=exp,
                            issue_type="wordiness",
                        )
                    )

            # Check passive phrasing
            for pat, correct, exp in passive_rules:
                m = re.search(pat, line)
                if m:
                    excerpt = line.lstrip("-*• ")
                    issues.append(
                        GrammarIssue(
                            original=m.group(0),
                            problem=f"Weak verb usage in: \"{excerpt[:70]}\"",
                            suggested_correction=correct,
                            explanation=exp,
                            issue_type="passive_voice",
                        )
                    )

            # Punctuation check: double periods or missing space after comma
            if re.search(r"\w\.\.\w", line):
                issues.append(
                    GrammarIssue(
                        original="..",
                        problem=f"Typographical error with double periods in: \"{line[:60]}\"",
                        suggested_correction=".",
                        explanation="Remove duplicate period to ensure polished presentation.",
                        issue_type="punctuation",
                    )
                )

            if len(issues) >= 8:
                break

        # Deduplicate issues by (problem, suggested_correction)
        seen = set()
        unique_issues = []
        for iss in issues:
            key = (iss.problem, iss.suggested_correction)
            if key not in seen:
                seen.add(key)
                unique_issues.append(iss)

        return unique_issues

    def _build_structured_recommendations(
        self,
        resume_text: str,
        skill_list: list[str],
        verb_score: float,
        metric_score: float,
        contact_info: dict,
        section_comp: float,
        inferred_domain: str,
        job_description: str | None = None,
        missing_kw_details: list[MissingKeywordItem] | None = None,
    ) -> list[ResumeRecommendationItem]:
        """Generate actionable, grounded recommendations without inventing false data."""
        recs: list[ResumeRecommendationItem] = []

        # 1. Job Description keyword alignment (if JD provided)
        if job_description and missing_kw_details:
            top_missing = [item.keyword for item in missing_kw_details if item.status == "absent"][:3]
            if top_missing:
                recs.append(
                    ResumeRecommendationItem(
                        area="Target Role Keyword Coverage",
                        issue=f"The job description specifically calls for competencies ({', '.join(top_missing)}) that are not explicitly found in your resume.",
                        why="Applicant Tracking Systems and recruiters scan for exact qualification matches specified in the job posting.",
                        action="Incorporate these keywords into your Technical Skills list and project descriptions (only where you have legitimate practical experience).",
                        example=f"• Spearheaded deployment of [Project Name] leveraging {top_missing[0]}, ensuring high scalability and adherence to engineering best practices."
                    )
                )

        # 2. Quantifiable Achievements
        if metric_score < 60:
            recs.append(
                ResumeRecommendationItem(
                    area="Quantifiable Impact & Metrics",
                    issue="Work experience bullets primarily describe tasks and duties rather than measurable business or engineering impact.",
                    why="Demonstrating quantified outcomes (e.g., latency reduction, cost savings, user growth) distinguishes top candidates from average applicants.",
                    action="Apply the Google XYZ formula: 'Accomplished [X] as measured by [Y], by doing [Z]'.",
                    example="• Engineered [Feature / System], improving system throughput by [X%] and reducing page load latency by [Y ms]."
                )
            )

        # 3. Action Verbs
        if verb_score < 60:
            recs.append(
                ResumeRecommendationItem(
                    area="Action Verbs & Leadership Phrasing",
                    issue="Several bullet points start with passive verbs (e.g. 'worked on', 'helped with') instead of strong decisive verbs.",
                    why="High-impact action verbs communicate proactive ownership, technical leadership, and execution velocity.",
                    action="Replace opening phrases with decisive power verbs such as 'Architected', 'Spearheaded', 'Engineered', 'Optimized', or 'Orchestrated'.",
                    example="• Architected and shipped [Module Name] using [Technology Stack], delivering 99.9% uptime across [N] production deployments."
                )
            )

        # 4. Contact Information & Professional Links
        if contact_info.get("contact_score", 0) < 80:
            missing_links = []
            if not contact_info.get("linkedin"):
                missing_links.append("LinkedIn profile")
            if not contact_info.get("github") and "software" in inferred_domain.lower():
                missing_links.append("GitHub / Portfolio")
            if not contact_info.get("phone"):
                missing_links.append("Phone number")

            recs.append(
                ResumeRecommendationItem(
                    area="Contact Information & Online Presence",
                    issue=f"Your contact header is missing key professional links: {', '.join(missing_links) if missing_links else 'complete contact information'}.",
                    why="Recruiters need frictionless ways to contact you and inspect real code repositories or recommendations.",
                    action="Place full name, email, phone number, location, and clickable LinkedIn/GitHub URLs in the top header.",
                    example="[Full Name] | [City, Country] | [Email] | [Phone] | linkedin.com/in/[profile] | github.com/[handle]"
                )
            )

        # 5. Professional Summary
        lower = resume_text.lower()
        if not any(h in lower for h in ["summary", "objective", "profile", "about me"]):
            recs.append(
                ResumeRecommendationItem(
                    area="Professional Summary",
                    issue="The resume lacks a focused 2-3 line professional executive summary at the top.",
                    why="A concise summary immediately frames your professional identity and key value proposition within the first 6 seconds of review.",
                    action="Add a 2-3 sentence executive summary highlighting your years of experience, core technical stack, and target focus.",
                    example=f"• Dynamic {inferred_domain} professional with experience building scalable solutions in {', '.join(skill_list[:3]) if skill_list else 'modern frameworks'}. Proven track record of delivering high-reliability systems."
                )
            )

        # 6. Readability & Organization
        if section_comp < 100:
            recs.append(
                ResumeRecommendationItem(
                    area="Section Organization & Formatting",
                    issue="One or more standard structural sections (Experience, Education, Skills, Projects) could not be verified by the ATS parser.",
                    why="ATS parsers rely on unambiguous standard headings to accurately categorize your experience and calculate rank scores.",
                    action="Use standard single-line section headers: 'Work Experience', 'Education', 'Technical Skills', 'Projects'.",
                    example="## WORK EXPERIENCE\n[Company Name] — [Role Title] | [Dates]"
                )
            )

        return recs

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
        job_description: str | None = None,
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
        skill_list = self._extract_skills_from_text(resume_text)
        inferred_domain = infer_candidate_domain(resume_text, skill_list)

        # 3. Detect genuine grammar and formatting issues
        grammar_issues = self._detect_grammar_and_resume_issues(resume_text)
        sentence_improvements, repaired_text = self._generate_sentence_enhancements(resume_text, inferred_domain)

        # 4. Check if a Job Description was provided
        has_job_description = bool(job_description and job_description.strip())
        jd_skills: list[str] = []
        missing_kw_details: list[MissingKeywordItem] = []
        keyword_gaps: list[str] = []
        calculated_ats_score: float | None = None
        keyword_match_val = 0.0
        skill_match_val = 0.0
        experience_relevance_val = 0.0

        if has_job_description:
            # Extract required skills from the target job description
            jd_skills = self._extract_skills_from_text(job_description)
            
            # Additional regex extraction for tools/requirements mentioned in JD
            for pat in [
                r"(?:experience with|proficient in|knowledge of|required:\s*|skills:\s*)([\w\s\+\#\.\/]+?)(?:[,;\.\n]|\band\b)",
                r"(?:strong understanding of|familiarity with|background in)\s+([\w\s\+\#\.\/]+?)(?:[,;\.\n])",
            ]:
                for m in re.finditer(pat, job_description, re.IGNORECASE):
                    chunk = m.group(1).strip()
                    for term in re.split(r"[,/|]", chunk):
                        cleaned = term.strip()
                        if len(cleaned) >= 2 and len(cleaned) <= 25 and not any(w in cleaned.lower() for w in ["the", "and", "or", "a", "an", "such as", "including"]):
                            # map alias if exists
                            canonical = SKILL_ALIASES.get(cleaned.lower(), cleaned.title())
                            if canonical not in jd_skills and len(canonical) >= 2:
                                jd_skills.append(canonical)

            lower_resume = resume_text.lower()
            normalized_candidate_skills = {s.lower() for s in skill_list}

            # Compare JD skills against resume
            for req_skill in jd_skills:
                req_lower = req_skill.lower()
                # Check if exact skill or alias is present in candidate skills or text
                in_skills_list = req_lower in normalized_candidate_skills or any(alias in normalized_candidate_skills for alias, can in SKILL_ALIASES.items() if can.lower() == req_lower)
                in_text = bool(re.search(r"\b" + re.escape(req_lower) + r"\b", lower_resume))

                if not in_skills_list and not in_text:
                    # Skill is completely absent
                    missing_kw_details.append(
                        MissingKeywordItem(
                            keyword=req_skill,
                            relevance=f"Required qualification or tool emphasized in the target job description for {target_role or inferred_domain}.",
                            status="absent",
                            suggested_placement="Technical Skills section or relevant project description (if you possess hands-on capability).",
                        )
                    )
                    keyword_gaps.append(req_skill)
                elif in_skills_list and not in_text:
                    # Weakly represented (listed in skills block but never mentioned in experience/projects)
                    missing_kw_details.append(
                        MissingKeywordItem(
                            keyword=req_skill,
                            relevance="Mentioned in skills block, but lacks concrete project or achievement evidence in work history.",
                            status="weakly_represented",
                            suggested_placement="Incorporate into a project or experience bullet point demonstrating measurable outcomes.",
                        )
                    )

            # Calculate deterministic ATS match against JD
            total_jd_skills = len(jd_skills)
            matched_count = total_jd_skills - len([m for m in missing_kw_details if m.status == "absent"])
            skill_match_val = round((matched_count / max(total_jd_skills, 1)) * 100.0, 1) if total_jd_skills > 0 else 75.0
            keyword_match_val = skill_match_val
            experience_relevance_val = round(max(40.0, min(100.0, float(verb_score))), 1)

            calculated_ats_score = round(
                (keyword_match_val * 0.35)
                + (skill_match_val * 0.35)
                + (experience_relevance_val * 0.15)
                + (section_comp * 0.15),
                1
            )
        else:
            # When NO JD is provided: do NOT fabricate missing keywords or fake job-specific score
            calculated_ats_score = None
            missing_kw_details = []
            keyword_gaps = []

        # 5. Dynamic RAG grounding & LLM-based analysis
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
            job_description=job_description if has_job_description else None,
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

        # 6. Overall Quality Score (0-100) based on actual resume characteristics
        # Section Completeness: 25%, Action Verbs: 25%, Quantifiable Metrics: 25%, Contact: 15%, Grammar cleanliness: 10%
        grammar_penalty = min(20.0, len(grammar_issues) * 2.0)
        overall_resume_score = round(
            (section_comp * 0.25)
            + (verb_score * 0.25)
            + (metric_score * 0.25)
            + (contact_info.get("contact_score", 70.0) * 0.15)
            + (max(0.0, 100.0 - grammar_penalty) * 0.10),
            1
        )
        overall_resume_score = min(100.0, max(15.0, overall_resume_score))

        structured_recs = self._build_structured_recommendations(
            resume_text=resume_text,
            skill_list=skill_list,
            verb_score=verb_score,
            metric_score=metric_score,
            contact_info=contact_info,
            section_comp=section_comp,
            inferred_domain=inferred_domain,
            job_description=job_description,
            missing_kw_details=missing_kw_details,
        )
        plain_recs = [f"[{r.area}] {r.issue} — {r.action}" for r in structured_recs]

        # Process LLM response if available
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

            extracted_skills = response.get("resume_skills") or skill_list
            response["resume_skills"] = extracted_skills

            # Overall Quality Score
            response["resume_score"] = float(response.get("resume_score") or overall_resume_score)

            # ATS Score & Job Description logic
            if has_job_description:
                response["has_target_job"] = True
                response["ats_score"] = float(response.get("ats_score") or calculated_ats_score or 75.0)
                llm_details = response.get("missing_keyword_details") or []
                if llm_details:
                    response["missing_keyword_details"] = [
                        MissingKeywordItem(**item) if isinstance(item, dict) else item
                        for item in llm_details
                    ]
                else:
                    response["missing_keyword_details"] = missing_kw_details
                response["keyword_gaps"] = [item.keyword for item in response["missing_keyword_details"]]
                response["missing_keywords"] = response["keyword_gaps"]
            else:
                response["has_target_job"] = False
                response["ats_score"] = None
                response["missing_keyword_details"] = []
                response["keyword_gaps"] = []
                response["missing_keywords"] = []

            # Merge LLM grammar issues with verified detected issues
            llm_grammar = response.get("grammar_issues") or []
            if llm_grammar:
                parsed_grammar = []
                for g in llm_grammar:
                    if isinstance(g, dict) and "original" in g and "problem" in g:
                        parsed_grammar.append(GrammarIssue(**g))
                response["grammar_issues"] = parsed_grammar if parsed_grammar else grammar_issues
            else:
                response["grammar_issues"] = grammar_issues

            # Merge recommendations
            llm_recs = response.get("structured_recommendations") or []
            if llm_recs:
                parsed_recs = []
                for r in llm_recs:
                    if isinstance(r, dict) and "area" in r and "issue" in r:
                        parsed_recs.append(ResumeRecommendationItem(**r))
                response["structured_recommendations"] = parsed_recs if parsed_recs else structured_recs
            else:
                response["structured_recommendations"] = structured_recs

            if not response.get("recommendations"):
                response["recommendations"] = plain_recs

            if not response.get("sentence_improvements"):
                response["sentence_improvements"] = sentence_improvements
            if not response.get("repaired_text"):
                response["repaired_text"] = repaired_text

            response["keyword_match"] = keyword_match_val
            response["skill_match"] = skill_match_val
            response["experience_relevance"] = experience_relevance_val
            response["section_completeness"] = section_comp

            return ResumeAnalysisResponse(**response)

        # Fallback evaluation without LLM
        doc_val = validate_resume_document(resume_text)
        if not doc_val["is_valid"] and len(resume_text.strip()) > 150:
            return ResumeAnalysisResponse(
                resume_score=15.0,
                ats_score=None,
                has_target_job=has_job_description,
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
                keyword_gaps=[],
                missing_keyword_details=[],
                recommendations=[
                    "Please upload a standard professional resume or CV in PDF/DOCX format.",
                    "Ensure the document includes your contact info, work experience, education, and relevant skill sections.",
                ],
                structured_recommendations=[],
                grammar_issues=[],
                sentence_improvements=[],
                repaired_text="",
                keyword_match=0.0,
                skill_match=0.0,
                experience_relevance=0.0,
                section_completeness=0.0,
                missing_keywords=[],
            )

        strengths = []
        if skill_list:
            strengths.append(f"Identified {len(skill_list)} validated skills in {inferred_domain} ({', '.join(skill_list[:4])})")
        if action_verbs:
            strengths.append(f"Demonstrates dynamic leadership with {len(action_verbs)} action verbs ({', '.join(action_verbs[:3])})")
        if metrics_found:
            strengths.append(f"Includes quantifiable outcome metrics ({', '.join(metrics_found[:2])})")
        if not strengths:
            strengths.append(f"Standard professional structure detected for {inferred_domain}")

        weaknesses = []
        if has_job_description and missing_kw_details:
            top_g = [m.keyword for m in missing_kw_details if m.status == "absent"][:3]
            if top_g:
                weaknesses.append(f"Lacks key qualifications required by target job: {', '.join(top_g)}")
        if metric_score < 40:
            weaknesses.append("Low density of quantifiable metrics (add specific percentage growth, throughput, or scale figures)")
        if verb_score < 50:
            weaknesses.append("Bullet points could use stronger action verbs (e.g. Spearheaded, Engineered, Orchestrated)")
        if not contact_info.get("linkedin"):
            weaknesses.append("Missing direct LinkedIn or portfolio profile link")

        return ResumeAnalysisResponse(
            resume_score=overall_resume_score,
            ats_score=calculated_ats_score if has_job_description else None,
            has_target_job=has_job_description,
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
            keyword_gaps=keyword_gaps if has_job_description else [],
            missing_keyword_details=missing_kw_details if has_job_description else [],
            recommendations=plain_recs,
            structured_recommendations=structured_recs,
            grammar_issues=grammar_issues,
            sentence_improvements=sentence_improvements,
            repaired_text=repaired_text,
            keyword_match=keyword_match_val,
            skill_match=skill_match_val,
            experience_relevance=experience_relevance_val,
            section_completeness=section_comp,
            missing_keywords=keyword_gaps if has_job_description else [],
            job_description_snippet=job_description[:200] if has_job_description else None,
        )

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

    def _generate_sentence_enhancements(self, resume_text: str, domain: str) -> tuple[list[dict], str]:
        """Detect sentence formation issues, grammar weaknesses, and generate XYZ rewrites."""
        improvements = []
        lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
        repaired_lines = list(lines)

        weak_patterns = [
            (r"(?i)\b(?:i\s+)?worked\s+on\s+(.*)", "Architected and implemented {0}, delivering high production stability and measurable throughput gains."),
            (r"(?i)\b(?:was\s+)?responsible\s+for\s+(.*)", "Spearheaded {0}, ensuring optimal system performance and high team delivery standards."),
            (r"(?i)\bhelped\s+(?:in|with|to)?\s+(.*)", "Collaborated cross-functionally to drive {0}, accelerating milestone execution by 25%."),
            (r"(?i)\bhandled\s+(.*)", "Orchestrated {0} with robust test coverage and continuous integration pipelines."),
            (r"(?i)\bdoing\s+(.*)", "Engineered and automated {0} to streamline daily workflows and reduce manual overhead."),
            (r"(?i)\bdeveloped\s+(.*)\s+using\s+(.*)", "Engineered {0} utilizing {1}, improving user engagement and query responsiveness by 30%."),
            (r"(?i)\bcreated\s+(.*)", "Designed and deployed scalable {0}, achieving high availability and seamless data flow."),
        ]

        for idx, line in enumerate(lines):
            if len(line) < 20 or len(line) > 250:
                continue

            for pattern, template in weak_patterns:
                match = re.search(pattern, line)
                if match:
                    groups = match.groups()
                    if groups:
                        term = groups[0].strip().rstrip(".")
                        tool = groups[1].strip().rstrip(".") if len(groups) > 1 else ""
                        if "{1}" in template and tool:
                            improved = template.format(term, tool)
                        else:
                            improved = template.format(term)
                    else:
                        improved = f"Engineered and optimized {line.lstrip('-*• ')}"

                    clean_orig = line.lstrip("-*• ").strip()
                    clean_improved = improved.lstrip("-*• ").strip()

                    if clean_orig != clean_improved:
                        improvements.append({
                            "original": clean_orig,
                            "improved": clean_improved,
                            "reason": "Replaced weak passive verb with high-impact action verb and quantifiable outcome (Google XYZ formula).",
                            "issue_type": "passive_voice" if ("responsible" in line.lower() or "worked" in line.lower()) else "vague_impact",
                        })
                        repaired_lines[idx] = f"• {clean_improved}"
                        break

            if len(improvements) >= 6:
                break

        if not improvements:
            improvements = [
                {
                    "original": "Worked on backend features and database integration.",
                    "improved": "Architected resilient REST API endpoints and optimized PostgreSQL queries, reducing endpoint latency by 35%.",
                    "reason": "Converted passive phrasing into measurable achievement with concrete metrics.",
                    "issue_type": "vague_impact",
                },
                {
                    "original": "Responsible for frontend development and bug fixing.",
                    "improved": "Engineered responsive, accessible React components and automated unit tests, cutting defect turnaround time by 40%.",
                    "reason": "Used strong action verb 'Engineered' and quantified time savings.",
                    "issue_type": "passive_voice",
                },
                {
                    "original": "Helped team with deployment and code reviews.",
                    "improved": "Spearheaded CI/CD automated pipeline deployment and standardized peer review criteria, elevating code quality scores.",
                    "reason": "Strengthened leadership visibility and engineering impact.",
                    "issue_type": "weak_verb",
                },
            ]

        repaired_text = "\n".join(repaired_lines)
        return improvements, repaired_text

    def to_career_manager_envelope(self, analysis: ResumeAnalysisResponse) -> dict:
        """Format analysis response for Career Manager contract (Section 32)."""
        return {
            "agent": "resume",
            "status": "success",
            "data": analysis.model_dump(),
        }