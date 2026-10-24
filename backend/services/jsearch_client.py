import http.client
import json
import logging
import os
import urllib.parse
from typing import Any, Dict, List, Optional

from backend.services.skill_service import SkillService

logger = logging.getLogger(__name__)

OPENWEBNINJA_HOST = "api.openwebninja.com"
DEFAULT_API_KEY = "ak_s5lfv7pvhlzswnap8gqs5nhrf8q1ccxunmx0r7x6tpa2yi7"


class JSearchClient:
    """
    Client for OpenWebNinja JSearch live job search, salary estimates,
    and company market intelligence.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (
            api_key
            or os.getenv("OPENWEBNINJA_API_KEY")
            or os.getenv("JSEARCH_API_KEY")
            or DEFAULT_API_KEY
        )

    def _get_headers(self) -> Dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "User-Agent": "CareerTwin-Intelligence/1.0",
        }

    def _execute_get(self, path: str, timeout: int = 4) -> Optional[Dict[str, Any]]:
        conn = None
        try:
            conn = http.client.HTTPSConnection(OPENWEBNINJA_HOST, timeout=timeout)
            conn.request("GET", path, headers=self._get_headers())
            res = conn.getresponse()
            raw_body = res.read().decode("utf-8", errors="replace")

            if res.status != 200:
                logger.warning(
                    f"OpenWebNinja request failed: path={path} status={res.status} body={raw_body[:200]}"
                )
                return None

            return json.loads(raw_body)
        except Exception as exc:
            logger.error(f"Error querying OpenWebNinja endpoint {path}: {exc}")
            return None
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

    def search_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        page: int = 1,
        num_pages: int = 1,
        is_remote: Optional[bool] = None,
        employment_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search live current job postings across the web using OpenWebNinja JSearch search-v2.
        """
        search_terms = query.strip() if query else "Software Engineer"
        if location and location.strip() and "remote" not in location.lower():
            search_terms = f"{search_terms} in {location.strip()}"
        if is_remote:
            search_terms = f"{search_terms} remote"

        params = {
            "query": search_terms,
            "page": str(page),
            "num_pages": str(num_pages),
        }
        if employment_type:
            params["employment_types"] = employment_type.upper()

        query_str = urllib.parse.urlencode(params)
        path = f"/jsearch/search-v2?{query_str}"

        res_json = self._execute_get(path)
        if not res_json:
            return []

        data_obj = res_json.get("data")
        raw_jobs = []
        if isinstance(data_obj, dict):
            raw_jobs = data_obj.get("jobs", [])
        elif isinstance(data_obj, list):
            raw_jobs = data_obj

        normalized_jobs = []
        for raw in raw_jobs:
            norm = self._normalize_job(raw)
            if norm:
                normalized_jobs.append(norm)

        return normalized_jobs

    def get_job_details(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Fetch complete live posting details for a specific JSearch job_id."""
        if not job_id:
            return None
        path = f"/jsearch/job-details?job_id={urllib.parse.quote(job_id)}"
        res_json = self._execute_get(path)
        if not res_json:
            return None

        data_obj = res_json.get("data")
        if isinstance(data_obj, list) and data_obj:
            return self._normalize_job(data_obj[0])
        elif isinstance(data_obj, dict):
            jobs = data_obj.get("jobs", [])
            if jobs:
                return self._normalize_job(jobs[0])
            return self._normalize_job(data_obj)
        return None

    def get_estimated_salary(
        self,
        job_title: str,
        location: Optional[str] = None,
        radius: int = 100,
    ) -> Optional[Dict[str, Any]]:
        """Fetch estimated compensation benchmarks for a given role and location."""
        params = {"job_title": job_title, "radius": str(radius)}
        if location:
            params["location"] = location
        path = f"/jsearch/estimated-salary?{urllib.parse.urlencode(params)}"
        return self._execute_get(path)

    def get_company_salary(
        self,
        company: str,
        job_title: str,
    ) -> Optional[Dict[str, Any]]:
        """Fetch reported salary ranges for a specific company and role."""
        params = {"company": company, "job_title": job_title}
        path = f"/jsearch/company-job-salary?{urllib.parse.urlencode(params)}"
        return self._execute_get(path)

    def _normalize_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a raw JSearch posting into CareerTwin's canonical job representation."""
        desc = raw.get("job_description") or ""
        highlights = raw.get("job_highlights") or {}

        # Extract qualifications & responsibilities from highlights if available
        quals = []
        resps = []
        if isinstance(highlights, dict):
            quals = highlights.get("Qualifications") or highlights.get("qualifications") or []
            resps = highlights.get("Responsibilities") or highlights.get("responsibilities") or []

        # Extract authentic skills dynamically from description & qualifications
        skills_corpus = f"{desc}\n" + " ".join(quals)
        detected_skills = SkillService.extract_skills(skills_corpus)

        required_skills = detected_skills[:6] if detected_skills else ["Communication", "Problem Solving"]
        preferred_skills = detected_skills[6:12] if len(detected_skills) > 6 else []

        # Salary formatting
        salary = raw.get("job_salary_string")
        if not salary and raw.get("job_min_salary") and raw.get("job_max_salary"):
            period = raw.get("job_salary_period", "year")
            min_sal = raw.get("job_min_salary")
            max_sal = raw.get("job_max_salary")
            salary = f"${min_sal:,} - ${max_sal:,} / {period}"

        # Location formatting
        loc = raw.get("job_location")
        if not loc:
            parts = [raw.get("job_city"), raw.get("job_state"), raw.get("job_country")]
            loc = ", ".join([p for p in parts if p])
        if not loc:
            loc = "Remote" if raw.get("job_is_remote") else "Not Specified"

        return {
            "job_id": raw.get("job_id") or raw.get("job_uid") or "",
            "title": raw.get("job_title") or "Software Engineer",
            "company": raw.get("employer_name") or "Leading Tech Company",
            "employer_logo": raw.get("employer_logo"),
            "employer_website": raw.get("employer_website"),
            "location": loc,
            "job_url": raw.get("job_apply_link") or raw.get("job_google_link") or "",
            "description": desc,
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "experience_requirements": quals[:3] if quals else ["Relevant industry or project experience"],
            "qualifications": quals if quals else ["Bachelor's degree or equivalent practical experience"],
            "responsibilities": resps if resps else ["Contribute to architecture and deliver production features"],
            "keywords": detected_skills[:8],
            "salary_range": salary or "Competitive / Market Standard",
            "work_type": raw.get("job_employment_type") or "Full-time",
            "is_remote": bool(raw.get("job_is_remote", False)),
            "posted_at": raw.get("job_posted_at_datetime_utc") or raw.get("job_posted_at"),
            "source": "OpenWebNinja JSearch (Live)",
            "is_live_external": True,
        }
