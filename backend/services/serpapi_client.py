import hashlib
import http.client
import json
import logging
import os
import re
import urllib.parse
from typing import Any, Dict, List, Optional

from backend.services.skill_service import SkillService
from backend.utils.text_sanitizer import normalize_job_description

logger = logging.getLogger(__name__)

SERPAPI_HOST = "serpapi.com"
DEFAULT_SERPAPI_KEY = "3ac1f850e2e23c34416dd14a3ceefef7a7ef2de2baa37bebe83e7cc9d2645917"


class SerpApiClient:
    """
    Client for SerpApi Google Jobs & Google Intelligence API.
    Provides live global job listings aggregating LinkedIn, Indeed, Glassdoor, ZipRecruiter,
    and employer portals directly from Google Jobs.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (
            api_key
            or os.getenv("SERPAPI_API_KEY")
            or DEFAULT_SERPAPI_KEY
        )

    def _execute_get(self, path: str, timeout: int = 20) -> Optional[Dict[str, Any]]:
        conn = None
        try:
            conn = http.client.HTTPSConnection(SERPAPI_HOST, timeout=timeout)
            headers = {
                "User-Agent": "CareerTwin-SerpApi-Client/1.0",
                "Accept": "application/json",
            }
            conn.request("GET", path, headers=headers)
            res = conn.getresponse()
            raw_body = res.read().decode("utf-8", errors="replace")

            if res.status >= 400:
                logger.error(f"SerpApi HTTP {res.status}: {raw_body[:300]}")
                return None

            return json.loads(raw_body)
        except Exception as exc:
            logger.error(f"SerpApi request failed for {path}: {exc}")
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
        start: int = 0,
        hl: str = "en",
    ) -> List[Dict[str, Any]]:
        """
        Search live jobs on Google Jobs via SerpApi.
        """
        query_text = (query or "Software Engineer").strip()
        loc = (location or "").strip()

        # If keyword without role indicator, enrich so Google Jobs returns accurate results
        role_indicators = [
            "developer", "engineer", "designer", "architect", "manager",
            "intern", "analyst", "scientist", "lead", "jobs", "specialist",
            "consultant", "administrator", "devops", "qa", "tester"
        ]
        if not any(w in query_text.lower() for w in role_indicators):
            query_text = f"{query_text} Developer"

        # SerpApi Google Jobs engine requires physical geographical locations in 'location'.
        # 'remote' or 'worldwide' must be part of the query text 'q'.
        if loc.lower() in ["remote", "work from home", "wfh", "any location", "worldwide"]:
            if "remote" not in query_text.lower():
                query_text = f"{query_text} remote"
            loc = ""

        params = {
            "engine": "google_jobs",
            "q": query_text,
            "api_key": self.api_key.strip(),
            "hl": hl,
            "start": start,
        }
        if loc:
            params["location"] = loc

        path = f"/search.json?{urllib.parse.urlencode(params)}"
        data = self._execute_get(path)

        if not data or not isinstance(data, dict):
            return []

        raw_jobs = data.get("jobs_results", [])
        return [self._normalize_job(j) for j in raw_jobs if isinstance(j, dict)]

    def _normalize_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a raw Google Jobs posting from SerpApi into CareerTwin's canonical schema."""
        title = raw.get("title") or "Position"
        company = raw.get("company_name") or "Employer"
        location = raw.get("location") or "Remote"
        via = raw.get("via") or ""
        thumbnail = raw.get("thumbnail") or ""
        desc = normalize_job_description(raw.get("description") or "")

        # Deterministic unique ID
        raw_id = raw.get("job_id") or f"{title}_{company}_{location}"
        clean_hash = hashlib.md5(raw_id.encode("utf-8")).hexdigest()[:16]
        job_id = f"google_jobs_{clean_hash}"

        # Application link resolution
        apply_options = raw.get("apply_options") or []
        job_url = ""
        if apply_options and isinstance(apply_options, list):
            job_url = apply_options[0].get("link") or ""
        if not job_url:
            job_url = raw.get("source_link") or raw.get("share_link") or "https://www.google.com/search?ibp=htl;jobs"

        # Check remote status
        is_remote = False
        det = raw.get("detected_extensions") or {}
        if det.get("work_from_home") or "remote" in location.lower() or "anywhere" in location.lower() or "work from home" in desc.lower():
            is_remote = True

        # Employment type
        employment_type = det.get("schedule_type") or "Full-time"
        if not employment_type and raw.get("extensions"):
            for ext in raw.get("extensions", []):
                if any(t in ext.lower() for t in ["full-time", "part-time", "contract", "internship"]):
                    employment_type = ext
                    break

        # Salary detection
        salary_range = det.get("salary") or None

        # Skill extraction
        skills_corpus = f"{title}\n{desc}"
        extracted_skills = SkillService.extract_skills(skills_corpus)
        if not extracted_skills and raw.get("job_highlights"):
            for hl_group in raw.get("job_highlights", []):
                if isinstance(hl_group, dict) and hl_group.get("title") == "Qualifications":
                    items_str = " ".join(hl_group.get("items", []))
                    extracted_skills = SkillService.extract_skills(items_str)
                    if extracted_skills:
                        break

        if not extracted_skills:
            extracted_skills = ["Problem Solving", "Collaboration", "Analytical Skills"]

        source_label = f"Google Jobs ({via})" if via else "Google Jobs via SerpApi"

        return {
            "job_id": job_id,
            "title": title,
            "company": company,
            "company_name": company,
            "company_logo": thumbnail,
            "employer_logo": thumbnail,
            "location": location,
            "is_remote": is_remote,
            "is_live_external": True,
            "employment_type": employment_type,
            "salary_range": salary_range,
            "description": desc,
            "application_link": job_url,
            "apply_url": job_url,
            "job_url": job_url,
            "required_skills": extracted_skills,
            "preferred_skills": extracted_skills[3:] if len(extracted_skills) > 3 else [],
            "skills": extracted_skills,
            "keywords": extracted_skills[:8],
            "source": source_label,
            "source_badge": "Google Jobs",
            "posted_at": det.get("posted_at") or "",
        }
