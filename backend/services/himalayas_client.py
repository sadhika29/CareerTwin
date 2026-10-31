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

HIMALAYAS_HOST = "himalayas.app"
DEFAULT_HIMALAYAS_KEY = "hml_59ae6d8b9d3cabf53584f43053a44103594e4f8f0059e14edc4243e2b35ba04b"


class HimalayasClient:
    """
    Client for Himalayas Remote Jobs API.
    Provides verified live remote job postings, salary details, and company intelligence.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (
            api_key
            or os.getenv("HIMALAYAS_API_KEY")
            or DEFAULT_HIMALAYAS_KEY
        )

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "User-Agent": "CareerTwin-Intelligence/1.0",
            "Accept": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key.strip()}"
        return headers

    def _execute_get(self, path: str, timeout: int = 15) -> Optional[Dict[str, Any]]:
        conn = None
        try:
            conn = http.client.HTTPSConnection(HIMALAYAS_HOST, timeout=timeout)
            conn.request("GET", path, headers=self._get_headers())
            res = conn.getresponse()
            raw_body = res.read().decode("utf-8", errors="replace")

            if res.status != 200:
                logger.warning(
                    f"Himalayas request failed: path={path} status={res.status} body={raw_body[:200]}"
                )
                return None

            return json.loads(raw_body)
        except Exception as exc:
            logger.error(f"Error querying Himalayas endpoint {path}: {exc}")
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
        limit: int = 20,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Search live remote job postings on Himalayas by keyword/role.
        """
        query_str = urllib.parse.urlencode({
            "q": query.strip() if query else "Software Engineer",
            "limit": min(limit, 50),
            "offset": offset,
        })
        path = f"/jobs/api/search?{query_str}"
        data = self._execute_get(path)

        if not data or not isinstance(data, dict):
            return []

        raw_jobs = data.get("jobs", [])
        return [self._normalize_job(j) for j in raw_jobs if isinstance(j, dict)]

    def browse_jobs(
        self,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Browse the latest unfiltered live remote job postings on Himalayas.
        """
        query_str = urllib.parse.urlencode({
            "limit": min(limit, 50),
            "offset": offset,
        })
        path = f"/jobs/api?{query_str}"
        data = self._execute_get(path)

        if not data or not isinstance(data, dict):
            return []

        raw_jobs = data.get("jobs", [])
        return [self._normalize_job(j) for j in raw_jobs if isinstance(j, dict)]

    def _normalize_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a raw Himalayas job posting into CareerTwin's canonical schema."""
        title = raw.get("title") or "Remote Position"
        company = raw.get("companyName") or "Remote Employer"
        company_slug = raw.get("companySlug") or ""
        guid = raw.get("guid") or ""

        # Build clean unique job ID
        clean_slug = re.sub(r"[^a-zA-Z0-9_-]", "", guid or f"{company_slug}_{title}")
        job_id = f"himalayas_{clean_slug[:64]}"

        # Location restrictions or Worldwide
        restrictions = raw.get("locationRestrictions") or []
        if isinstance(restrictions, list) and restrictions:
            location_str = f"Remote ({', '.join(restrictions)})"
        else:
            location_str = "Remote (Worldwide)"

        # Salary formatting
        min_salary = raw.get("minSalary")
        max_salary = raw.get("maxSalary")
        currency = raw.get("currency") or "USD"
        salary_period = raw.get("salaryPeriod") or "year"

        salary_range = None
        if min_salary and max_salary:
            salary_range = f"${int(min_salary):,} - ${int(max_salary):,} {currency}/{salary_period}"
        elif min_salary:
            salary_range = f"From ${int(min_salary):,} {currency}/{salary_period}"
        elif max_salary:
            salary_range = f"Up to ${int(max_salary):,} {currency}/{salary_period}"

        # Description and clean text
        raw_desc = raw.get("description") or raw.get("excerpt") or ""
        desc = normalize_job_description(raw_desc)
        excerpt = normalize_job_description(raw.get("excerpt") or "")

        # Extract skills using CareerTwin SkillService taxonomy
        skills_corpus = f"{title}\n{desc}"
        extracted_skills = SkillService.extract_skills(skills_corpus)
        if not extracted_skills:
            categories = raw.get("categories") or []
            if isinstance(categories, list):
                extracted_skills = [c for c in categories if isinstance(c, str)]

        if not extracted_skills:
            extracted_skills = ["Remote Collaboration", "Communication", "Problem Solving"]


        return {
            "job_id": job_id,
            "title": title,
            "company": company,
            "company_name": company,
            "company_logo": raw.get("companyLogo") or "",
            "employer_logo": raw.get("companyLogo") or "",
            "company_slug": company_slug,
            "location": location_str,
            "is_remote": True,
            "is_live_external": True,
            "employment_type": raw.get("employmentType") or "Full-time",
            "seniority": raw.get("seniority") or "Mid-Senior Level",
            "min_salary": min_salary,
            "max_salary": max_salary,
            "salary_currency": currency,
            "salary_range": salary_range,
            "description": desc,
            "excerpt": excerpt,
            "application_link": raw.get("applicationLink") or f"https://himalayas.app/companies/{company_slug}/jobs",
            "apply_url": raw.get("applicationLink") or f"https://himalayas.app/companies/{company_slug}/jobs",
            "job_url": raw.get("applicationLink") or f"https://himalayas.app/companies/{company_slug}/jobs",
            "required_skills": extracted_skills,
            "preferred_skills": extracted_skills[3:] if len(extracted_skills) > 3 else [],
            "skills": extracted_skills,
            "keywords": extracted_skills[:8],
            "source": "Himalayas Remote Jobs (Live)",
            "source_badge": "Himalayas Remote",
            "pub_date": raw.get("pubDate") or "",
            "expiry_date": raw.get("expiryDate") or "",
        }
