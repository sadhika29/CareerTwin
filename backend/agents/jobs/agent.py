import json
import re
from typing import Any

from backend.schemas.job import JobAnalysisResponse
from backend.services.llm_service import LLMService

from .prompts import (
    AI_JOB_DISCOVERY_SYSTEM_PROMPT,
    AI_JOB_MATCH_SYSTEM_PROMPT,
    JOB_ANALYSIS_SYSTEM_PROMPT,
    build_ai_job_discovery_prompt,
    build_ai_job_match_prompt,
    build_job_analysis_prompt,
)


class JobAgent:
    """Agent responsible for analyzing, discovering, and matching jobs using AI & LLMs."""

    def __init__(self, llm_client=None):
        if llm_client is None:
            try:
                self.llm_client = LLMService()
            except Exception:
                self.llm_client = None
        else:
            self.llm_client = llm_client

    def _get_rag_context(self, query: str, role: str | None = None) -> str:
        try:
            from backend.rag.retriever import CareerRAGRetriever
            retriever = CareerRAGRetriever()
            return retriever.get_context_for_prompt(query=query, top_k=2, role=role)
        except Exception:
            return ""

    def analyze(
        self,
        description: str,
        job_id: str,
        target_role: str | None = None,
    ) -> JobAnalysisResponse:

        if not description or not description.strip():
            raise ValueError("Job description cannot be empty.")

        if not job_id or not job_id.strip():
            raise ValueError("job_id cannot be empty.")

        rag_context = self._get_rag_context(
            query=f"{target_role or 'Software Engineer'} skills and responsibilities",
            role=target_role,
        )

        response = None
        if self.llm_client is not None:
            try:
                prompt = build_job_analysis_prompt(
                    description=description,
                    target_role=target_role,
                    rag_context=rag_context,
                )
                raw = self.llm_client.generate_json(
                    system_prompt=JOB_ANALYSIS_SYSTEM_PROMPT,
                    prompt=prompt,
                )
                if isinstance(raw, str):
                    raw = raw.strip()
                    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
                    raw = re.sub(r"\s*```$", "", raw)
                    response = json.loads(raw)
                elif isinstance(raw, dict):
                    response = raw
            except Exception:
                response = None

        if response is None or not isinstance(response, dict):
            from backend.services.skill_service import SKILL_ALIASES
            lower_desc = description.lower()
            detected_skills = []
            for alias, canonical in SKILL_ALIASES.items():
                if re.search(r"\b" + re.escape(alias) + r"\b", lower_desc):
                    if canonical not in detected_skills:
                        detected_skills.append(canonical)

            response = {
                "job_title": target_role or "Software Engineer",
                "company": "Tech Company",
                "summary": description[:250] + "...",
                "required_skills": detected_skills[:5] if detected_skills else ["Python", "SQL", "Git"],
                "preferred_skills": detected_skills[5:8] if len(detected_skills) > 5 else ["Docker", "REST APIs"],
                "experience_requirements": ["1+ years relevant industry experience"],
                "qualifications": ["Bachelor's degree in Engineering, Computer Science or equivalent"],
                "responsibilities": [
                    "Design and develop scalable, maintainable software features",
                    "Collaborate with product and engineering team members",
                ],
                "keywords": detected_skills[:10],
            }

        response.pop("job_id", None)

        return JobAnalysisResponse(
            job_id=job_id,
            job_title=response.get("job_title") or response.get("title") or target_role or "Software Engineer",
            company=response.get("company") or response.get("company_name") or "Tech Company",
            required_skills=response.get("required_skills", []),
            preferred_skills=response.get("preferred_skills", []),
            experience_requirements=response.get("experience_requirements", []),
            qualifications=response.get("qualifications", []),
            responsibilities=response.get("responsibilities", []),
            keywords=response.get("keywords", []),
            summary=response.get("summary", ""),
        )

    def find_jobs_with_ai(
        self,
        target_role: str | None = None,
        candidate_skills: list[str] | None = None,
        experience_years: float | None = None,
        location: str | None = None,
        query: str | None = None,
        count: int = 4,
    ) -> list[dict[str, Any]]:
        """
        Use Gemini LLM and RAG to dynamically discover and generate live market job opportunities.
        """
        # 1. Priority: Retrieve live verified market job postings from Himalayas & OpenWebNinja JSearch
        try:
            live_jobs = []
            search_query = target_role or query or (f"{candidate_skills[0]} Developer" if candidate_skills else "Software Engineer")

            # A. Himalayas Remote Jobs
            try:
                from backend.services.himalayas_client import HimalayasClient
                h_jobs = HimalayasClient().search_jobs(query=search_query, limit=count)
                live_jobs.extend(h_jobs)
            except Exception:
                pass

            # B. OpenWebNinja JSearch
            if len(live_jobs) < count:
                try:
                    from backend.services.jsearch_client import JSearchClient
                    jsearch = JSearchClient()
                    j_jobs = jsearch.search_jobs(
                        query=search_query,
                        location=location,
                        num_pages=1,
                    )
                    live_jobs.extend(j_jobs)
                except Exception:
                    pass

            # C. SerpApi Google Jobs
            if len(live_jobs) < count:
                try:
                    from backend.services.serpapi_client import SerpApiClient
                    s_client = SerpApiClient()
                    s_jobs = s_client.search_jobs(query=search_query, location=location)
                    live_jobs.extend(s_jobs)
                except Exception:
                    pass

            if live_jobs:
                # Cache live postings to Firestore for seamless details & match tracking
                try:
                    from backend.database.firestore import FirestoreDatabase
                    db = FirestoreDatabase()
                    for j in live_jobs[:count]:
                        if j.get("job_id"):
                            db.set(collection="jobs", document_id=j["job_id"], data=j)
                except Exception:
                    pass
                return live_jobs[:count]
        except Exception:
            pass


        # 2. Secondary: Dynamic LLM market generation if live API query is unavailable
        rag_context = self._get_rag_context(
            query=f"{target_role or query or 'Software Engineer'} career market openings",
            role=target_role,
        )

        prompt = build_ai_job_discovery_prompt(
            target_role=target_role,
            candidate_skills=candidate_skills,
            experience_years=experience_years,
            location=location,
            query=query,
            count=count,
            rag_context=rag_context,
        )

        if self.llm_client is not None:
            try:
                raw = self.llm_client.generate_json(
                    system_prompt=AI_JOB_DISCOVERY_SYSTEM_PROMPT,
                    prompt=prompt,
                )
                if isinstance(raw, str):
                    raw = raw.strip()
                    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
                    raw = re.sub(r"\s*```$", "", raw)
                    data = json.loads(raw)
                    if isinstance(data, list):
                        return data
                    elif isinstance(data, dict) and "jobs" in data:
                        return data["jobs"]
            except Exception:
                pass

        # If LLM is unreachable, retrieve authentic stored jobs from database rather than fabricating listings
        try:
            from backend.database.firestore import FirestoreDatabase
            db = FirestoreDatabase()
            stored = db.list(collection="jobs", limit=count or 10)
            if stored:
                target_lower = (target_role or query or "").lower()
                filtered = [
                    j for j in stored
                    if not target_lower or target_lower in j.get("title", "").lower()
                ]
                return filtered[:count] if filtered else stored[:count]
        except Exception:
            pass

        return []

    def match_with_ai(
        self,
        job_title: str,
        job_company: str,
        job_description: str,
        required_skills: list[str],
        preferred_skills: list[str],
        experience_requirements: list[str],
        qualifications: list[str],
        candidate_skills: list[str],
        education: str | None = None,
        experience_years: float | None = None,
    ) -> dict[str, Any]:
        """
        Use Gemini LLM to conduct a deep semantic candidate-to-job fit evaluation.
        """
        prompt = build_ai_job_match_prompt(
            job_title=job_title,
            job_company=job_company,
            job_description=job_description,
            required_skills=required_skills,
            preferred_skills=preferred_skills,
            experience_requirements=experience_requirements,
            qualifications=qualifications,
            candidate_skills=candidate_skills,
            education=education,
            experience_years=experience_years,
        )

        if self.llm_client is not None:
            try:
                raw = self.llm_client.generate_json(
                    system_prompt=AI_JOB_MATCH_SYSTEM_PROMPT,
                    prompt=prompt,
                )
                if isinstance(raw, str):
                    raw = raw.strip()
                    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
                    raw = re.sub(r"\s*```$", "", raw)
                    data = json.loads(raw)
                    if isinstance(data, dict) and "match_score" in data:
                        return data
            except Exception:
                pass

        # Fallback baseline
        cand_norm = {s.strip().lower() for s in candidate_skills}
        matched = [s for s in required_skills if s.strip().lower() in cand_norm]
        missing = [s for s in required_skills if s.strip().lower() not in cand_norm]
        score = round((len(matched) / max(len(required_skills), 1)) * 100, 1)
        return {
            "match_score": score,
            "eligibility_status": "Eligible" if score >= 50 else "Borderline",
            "selection_likelihood": "High" if score >= 75 else ("Medium" if score >= 50 else "Low"),
            "matched_skills": matched,
            "missing_required_skills": missing,
            "missing_preferred_skills": preferred_skills,
            "strengths": [f"Candidate demonstrates proficiency in {', '.join(matched[:3])}" if matched else "Foundational technical background"],
            "gaps": [f"Missing required skills: {', '.join(missing[:3])}" if missing else "No critical gaps identified"],
            "recommendations": [f"Gain practical project exposure in {missing[0]}" if missing else "Prepare for system architecture and coding interview rounds"],
            "detailed_reasoning": f"Candidate matches {len(matched)} of {len(required_skills)} required technical skills.",
        }

    def to_career_manager_envelope(self, analysis: JobAnalysisResponse) -> dict:
        """Format analysis response for Career Manager contract (Section 32)."""
        return {
            "agent": "job",
            "status": "success",
            "data": analysis.model_dump(),
        }
