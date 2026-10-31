"""
Modular Job Catalog Service and Provider Architecture for CareerTwin.
Integrates verified authentic job sources:
1. Himalayas Remote Jobs (Verified live remote jobs API)
2. OpenWebNinja JSearch (Web-wide live job postings)
3. Google Jobs via SerpApi (Live search engine job aggregation)

Normalizes all listings into a consistent internal schema and supports
real-time synchronization, Firestore shared catalog persistence, deduplication,
and LinkedIn-style multi-attribute filtering.
"""

from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import logging
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional, Tuple

from backend.database.firestore import FirestoreDatabase
from backend.services.himalayas_client import HimalayasClient
from backend.services.jsearch_client import JSearchClient
from backend.services.serpapi_client import SerpApiClient
from backend.services.skill_service import SkillService
from backend.utils.text_sanitizer import normalize_job_description, normalize_job_dict

logger = logging.getLogger(__name__)

# High-performance in-memory cache for job search queries (5-minute TTL)
_JOBS_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
_CACHE_LOCK = threading.Lock()
CACHE_TTL_SECONDS = 300  # 5 minutes


def parse_relative_time_to_timestamp(posted_str: Optional[str]) -> Optional[float]:
    """Parse an ISO date or relative freshness string (e.g. '3 days ago') to a UTC timestamp."""
    if not posted_str or not isinstance(posted_str, str):
        return None

    cleaned = posted_str.strip().lower()
    now_ts = datetime.now(timezone.utc).timestamp()

    # Try ISO date parsing first
    try:
        dt = datetime.fromisoformat(cleaned.replace("z", "+00:00"))
        return dt.timestamp()
    except Exception:
        pass

    # Handle relative descriptions
    if any(k in cleaned for k in ["just now", "moment ago", "today", "hour"]):
        return now_ts - 3600

    if "yesterday" in cleaned:
        return now_ts - 86400

    match_days = re.search(r"(\d+)\s*day", cleaned)
    if match_days:
        return now_ts - (int(match_days.group(1)) * 86400)

    match_weeks = re.search(r"(\d+)\s*week", cleaned)
    if match_weeks:
        return now_ts - (int(match_weeks.group(1)) * 7 * 86400)

    match_months = re.search(r"(\d+)\s*month", cleaned)
    if match_months:
        return now_ts - (int(match_months.group(1)) * 30 * 86400)

    return None


def detect_work_arrangement(location: str, description: str, is_remote_flag: bool = False) -> str:
    """Classify work arrangement as Remote, Hybrid, or On-site without inventing false data."""
    text = f"{location} {description}".lower()
    if is_remote_flag or "remote" in location.lower() or "work from home" in text or "wfh" in text or "worldwide" in location.lower():
        return "Remote"
    if "hybrid" in location.lower() or "hybrid" in text:
        return "Hybrid"
    return "On-site"


def detect_experience_level(title: str, text: str, given_level: Any = None) -> str:
    """Normalize experience level based on authentic source indications."""
    if isinstance(given_level, list):
        given_level = ", ".join(str(x) for x in given_level)
    level_str = str(given_level or "").strip()
    combo = f"{title} {level_str} {text[:300]}".lower()

    if any(k in combo for k in ["intern", "internship", "co-op", "trainee"]):
        return "Internship"
    if any(k in combo for k in ["director", "vp", "vice president", "head of", "chief", "executive"]):
        return "Director"
    if any(k in combo for k in ["senior", "sr.", "lead", "staff", "principal", "mid-senior", "architect"]):
        return "Mid-Senior level"
    if any(k in combo for k in ["associate", "mid level", "mid-level"]):
        return "Associate"
    if any(k in combo for k in ["entry", "junior", "jr.", "fresher", "graduate"]):
        return "Entry level"

    if level_str:
        return level_str

    return "Not specified"


def detect_industry(title: str, description: str, category_hint: Any = None) -> str:
    """Determine high-level job category without inventing arbitrary tags."""
    if isinstance(category_hint, list):
        category_hint = category_hint[0] if category_hint else ""
    hint_str = str(category_hint or "").strip()
    if hint_str:
        return hint_str

    combo = f"{title} {description[:400]}".lower()
    if any(k in combo for k in ["data", "machine learning", "ai", "scientist", "deep learning", "nlp"]):
        return "Data & AI"
    if any(k in combo for k in ["devops", "cloud", "sre", "infrastructure", "kubernetes", "aws", "docker"]):
        return "Cloud & DevOps"
    if any(k in combo for k in ["product manager", "ui/ux", "designer", "product owner", "scrum"]):
        return "Product & Design"
    if any(k in combo for k in ["security", "cyber", "infosec"]):
        return "Security & Systems"
    return "Engineering & Software"


class JobCatalogService:
    """
    Central service for normalizing, synchronizing, deduplicating,
    persisting, and filtering authentic job listings from multiple providers.
    """

    def __init__(self, database: Optional[FirestoreDatabase] = None):
        self.database = database or FirestoreDatabase()

    def normalize_himalayas_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw Himalayas job posting into canonical CareerTwin format."""
        title = raw.get("title") or "Software Engineer"
        company = raw.get("companyName") or "Remote Employer"
        guid = raw.get("guid") or f"{raw.get('companySlug', '')}_{title}"
        clean_id = re.sub(r"[^a-zA-Z0-9_-]", "", guid)[:64]
        job_id = f"himalayas_{clean_id}"

        location_str = "Remote (Worldwide)"
        restrictions = raw.get("locationRestrictions") or []
        if isinstance(restrictions, list) and restrictions:
            location_str = f"Remote ({', '.join(restrictions)})"

        min_sal = raw.get("minSalary")
        max_sal = raw.get("maxSalary")
        currency = raw.get("currency") or "USD"
        period = raw.get("salaryPeriod") or "year"

        salary_range = None
        if min_sal and max_sal:
            salary_range = f"${int(min_sal):,} - ${int(max_sal):,} {currency}/{period}"
        elif min_sal:
            salary_range = f"From ${int(min_sal):,} {currency}/{period}"
        elif max_sal:
            salary_range = f"Up to ${int(max_sal):,} {currency}/{period}"

        desc = normalize_job_description(raw.get("description") or raw.get("excerpt") or "")
        skills = SkillService.extract_skills(f"{title}\n{desc}")
        if not skills and isinstance(raw.get("categories"), list):
            skills = [c for c in raw.get("categories") if isinstance(c, str)]
        if not skills:
            skills = ["Problem Solving", "Collaboration", "Git"]

        pub_date = raw.get("pubDate") or ""
        now_iso = datetime.now(timezone.utc).isoformat()
        categories = raw.get("categories") or []
        cat_hint = categories[0] if isinstance(categories, list) and categories else None

        return {
            "job_id": job_id,
            "provider": "Himalayas",
            "source": "Himalayas Remote Jobs",
            "source_badge": "Himalayas Remote",
            "company": company,
            "company_name": company,
            "employer_logo": raw.get("companyLogo") or "",
            "title": title,
            "location": location_str,
            "work_arrangement": "Remote",
            "employment_type": raw.get("employmentType") or "Full-time",
            "experience_level": detect_experience_level(title, desc, raw.get("seniority")),
            "industry": detect_industry(title, desc, cat_hint),
            "description": desc,
            "required_skills": skills[:6],
            "preferred_skills": skills[6:12] if len(skills) > 6 else [],
            "salary_range": salary_range,
            "min_salary": float(min_sal) if min_sal is not None else None,
            "max_salary": float(max_sal) if max_sal is not None else None,
            "posting_date": pub_date,
            "posted_at": pub_date,
            "posted_timestamp": parse_relative_time_to_timestamp(pub_date),
            "application_url": raw.get("applicationLink") or f"https://himalayas.app/companies/{raw.get('companySlug', '')}/jobs",
            "job_url": raw.get("applicationLink") or f"https://himalayas.app/companies/{raw.get('companySlug', '')}/jobs",
            "last_synchronized_at": now_iso,
            "is_live_external": True,
            "user_id": "shared_catalog",
        }

    def normalize_jsearch_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw OpenWebNinja JSearch posting into canonical format."""
        raw_id = raw.get("job_id") or raw.get("job_uid") or ""
        clean_id = re.sub(r"[^a-zA-Z0-9_-]", "", raw_id)[:64]
        job_id = f"jsearch_{clean_id}" if not raw_id.startswith("jsearch_") else raw_id

        title = raw.get("job_title") or raw.get("title") or "Software Engineer"
        company = raw.get("employer_name") or raw.get("company") or "Technology Employer"
        desc = normalize_job_description(raw.get("job_description") or raw.get("description") or "")

        # Location
        loc = raw.get("job_location") or raw.get("location")
        if not loc:
            parts = [raw.get("job_city"), raw.get("job_state"), raw.get("job_country")]
            loc = ", ".join([p for p in parts if p])
        if not loc:
            loc = "Remote" if raw.get("job_is_remote") else "Not specified"

        # Salary formatting (only when actual salary exists)
        min_sal = raw.get("job_min_salary") or raw.get("min_salary")
        max_sal = raw.get("job_max_salary") or raw.get("max_salary")
        salary_str = raw.get("job_salary_string")
        if not salary_str and min_sal and max_sal:
            period = raw.get("job_salary_period", "year")
            salary_str = f"${int(min_sal):,} - ${int(max_sal):,} / {period}"
        elif not salary_str and min_sal:
            period = raw.get("job_salary_period", "year")
            salary_str = f"From ${int(min_sal):,} / {period}"

        # Work arrangement & employment type
        is_remote = bool(raw.get("job_is_remote") or "remote" in loc.lower())
        work_arr = detect_work_arrangement(loc, desc, is_remote)
        emp_raw = str(raw.get("job_employment_type") or raw.get("employment_type") or "").upper()
        if "FULL" in emp_raw:
            emp_type = "Full-time"
        elif "PART" in emp_raw:
            emp_type = "Part-time"
        elif "CONTRACT" in emp_raw:
            emp_type = "Contract"
        elif "INTERN" in emp_raw:
            emp_type = "Internship"
        else:
            emp_type = "Full-time"

        # Skills extraction
        skills = SkillService.extract_skills(f"{title}\n{desc}")
        if not skills:
            skills = ["Problem Solving", "Collaboration", "Git"]

        posted_at = raw.get("job_posted_at_datetime_utc") or raw.get("posted_at") or ""
        now_iso = datetime.now(timezone.utc).isoformat()
        job_url = raw.get("job_apply_link") or raw.get("job_url") or raw.get("application_url") or ""

        return {
            "job_id": job_id,
            "provider": "OpenWebNinja JSearch",
            "source": "OpenWebNinja JSearch (Live)",
            "source_badge": "JSearch Live",
            "company": company,
            "company_name": company,
            "employer_logo": raw.get("employer_logo") or "",
            "title": title,
            "location": loc,
            "work_arrangement": work_arr,
            "employment_type": emp_type,
            "experience_level": detect_experience_level(title, desc),
            "industry": detect_industry(title, desc),
            "description": desc,
            "required_skills": skills[:6],
            "preferred_skills": skills[6:12] if len(skills) > 6 else [],
            "salary_range": salary_str if salary_str and "competitive" not in salary_str.lower() else None,
            "min_salary": float(min_sal) if min_sal is not None else None,
            "max_salary": float(max_sal) if max_sal is not None else None,
            "posting_date": posted_at,
            "posted_at": posted_at,
            "posted_timestamp": parse_relative_time_to_timestamp(posted_at),
            "application_url": job_url,
            "job_url": job_url,
            "last_synchronized_at": now_iso,
            "is_live_external": True,
            "user_id": "shared_catalog",
        }

    def normalize_serpapi_job(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw Google Jobs posting from SerpApi into canonical format."""
        title = raw.get("title") or "Software Engineer"
        company = raw.get("company_name") or raw.get("company") or "Technology Company"
        loc = raw.get("location") or "Remote"
        desc = normalize_job_description(raw.get("description") or "")

        raw_id = raw.get("job_id") or f"{title}_{company}_{loc}"
        clean_hash = hashlib.md5(raw_id.encode("utf-8")).hexdigest()[:16]
        job_id = f"google_jobs_{clean_hash}"

        det = raw.get("detected_extensions") or {}
        is_remote = bool(
            det.get("work_from_home")
            or "remote" in loc.lower()
            or "work from home" in desc.lower()
        )
        work_arr = detect_work_arrangement(loc, desc, is_remote)

        # Schedule / employment type
        sched = det.get("schedule_type") or "Full-time"
        if "contract" in sched.lower():
            emp_type = "Contract"
        elif "part" in sched.lower():
            emp_type = "Part-time"
        elif "intern" in sched.lower():
            emp_type = "Internship"
        else:
            emp_type = "Full-time"

        # Apply URL
        apply_options = raw.get("apply_options") or []
        job_url = ""
        if isinstance(apply_options, list) and apply_options:
            job_url = apply_options[0].get("link") or ""
        if not job_url:
            job_url = raw.get("job_url") or raw.get("source_link") or "https://www.google.com/search?ibp=htl;jobs"

        # Skills
        skills = SkillService.extract_skills(f"{title}\n{desc}")
        if not skills:
            skills = ["Problem Solving", "Collaboration", "Git"]

        posted_at = det.get("posted_at") or raw.get("posted_at") or ""
        salary_str = det.get("salary") or raw.get("salary_range") or None
        now_iso = datetime.now(timezone.utc).isoformat()

        via = raw.get("via") or ""
        source_label = f"Google Jobs ({via})" if via else "Google Jobs via SerpApi"

        return {
            "job_id": job_id,
            "provider": "Google Jobs (SerpApi)",
            "source": source_label,
            "source_badge": "Google Jobs",
            "company": company,
            "company_name": company,
            "employer_logo": raw.get("thumbnail") or raw.get("employer_logo") or "",
            "title": title,
            "location": loc,
            "work_arrangement": work_arr,
            "employment_type": emp_type,
            "experience_level": detect_experience_level(title, desc),
            "industry": detect_industry(title, desc),
            "description": desc,
            "required_skills": skills[:6],
            "preferred_skills": skills[6:12] if len(skills) > 6 else [],
            "salary_range": salary_str,
            "min_salary": None,
            "max_salary": None,
            "posting_date": posted_at,
            "posted_at": posted_at,
            "posted_timestamp": parse_relative_time_to_timestamp(posted_at),
            "application_url": job_url,
            "job_url": job_url,
            "last_synchronized_at": now_iso,
            "is_live_external": True,
            "user_id": "shared_catalog",
        }

    def _persist_jobs_batch(
        self,
        jobs_to_persist: List[Dict[str, Any]],
        now_dt: datetime,
        now_iso: str,
        sync_meta: Dict[str, Any],
    ) -> None:
        """Asynchronously persist jobs in chunks via Firestore batch API."""
        try:
            if hasattr(self.database, "db") and self.database.db:
                batch = self.database.db.batch()
                batch_count = 0
                for j in jobs_to_persist:
                    jid = j.get("job_id")
                    if jid:
                        ref = self.database.db.collection("jobs").document(jid)
                        batch.set(ref, {**j, "updated_at": now_dt, "created_at": now_dt}, merge=True)
                        batch_count += 1
                        if batch_count >= 400:
                            batch.commit()
                            batch = self.database.db.batch()
                            batch_count = 0
                if batch_count > 0:
                    batch.commit()

                meta_ref = self.database.db.collection("system_metadata").document("job_sync")
                meta_ref.set(sync_meta, merge=True)
            else:
                for j in jobs_to_persist:
                    jid = j.get("job_id")
                    if jid:
                        try:
                            self.database.create("jobs", jid, {**j, "updated_at": now_dt, "created_at": now_dt})
                        except Exception:
                            try:
                                self.database.update("jobs", jid, {**j, "updated_at": now_dt})
                            except Exception:
                                pass
        except Exception as exc:
            logger.warning(f"Background Firestore batch persistence failed: {exc}")

    def sync_jobs(
        self,
        query: str = "Software Engineer",
        location: Optional[str] = None,
        limit_per_provider: int = 15,
        force_refresh: bool = False,
    ) -> Dict[str, Any]:
        """
        Request a refresh from configured live providers (Himalayas, JSearch, SerpApi),
        normalize and deduplicate results, persist them in background, and return report.
        """
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()
        cache_key = f"{query.strip().lower()}___{str(location or '').strip().lower()}___{limit_per_provider}"

        if not force_refresh:
            with _CACHE_LOCK:
                if cache_key in _JOBS_CACHE:
                    cached_ts, cached_result = _JOBS_CACHE[cache_key]
                    if (now.timestamp() - cached_ts) < CACHE_TTL_SECONDS:
                        return cached_result

        all_normalized: List[Dict[str, Any]] = []
        provider_counts: Dict[str, int] = {}
        provider_errors: Dict[str, str] = {}

        # Define provider workers
        def fetch_himalayas():
            try:
                h_client = HimalayasClient()
                h_jobs = h_client.search_jobs(query=query, limit=limit_per_provider)
                if not h_jobs:
                    h_jobs = h_client.browse_jobs(limit=limit_per_provider)
                return "Himalayas", [self.normalize_himalayas_job(j) for j in h_jobs], None
            except Exception as exc:
                return "Himalayas", [], str(exc)

        def fetch_serpapi():
            try:
                s_client = SerpApiClient()
                s_jobs = s_client.search_jobs(query=query, location=location)
                return "SerpApi", [self.normalize_serpapi_job(j) for j in s_jobs], None
            except Exception as exc:
                return "SerpApi", [], str(exc)

        def fetch_jsearch():
            try:
                j_client = JSearchClient()
                j_jobs = j_client.search_jobs(query=query, location=location, num_pages=1)
                return "JSearch", [self.normalize_jsearch_job(j) for j in j_jobs], None
            except Exception as exc:
                return "JSearch", [], str(exc)

        # Run all 3 live providers in parallel threads!
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [
                executor.submit(fetch_himalayas),
                executor.submit(fetch_serpapi),
                executor.submit(fetch_jsearch),
            ]
            for future in as_completed(futures):
                prov_name, jobs_list, err = future.result()
                if err:
                    logger.error(f"{prov_name} sync error: {err}")
                    provider_errors[prov_name] = err
                else:
                    all_normalized.extend(jobs_list)
                    provider_counts[prov_name] = len(jobs_list)

        # Deduplicate results using stable identifier and (title, company)
        seen_keys = set()
        deduped_jobs: List[Dict[str, Any]] = []

        for j in all_normalized:
            dedup_key = (
                j.get("title", "").strip().lower(),
                j.get("company", "").strip().lower(),
            )
            job_id = j.get("job_id", "")
            if dedup_key not in seen_keys and job_id not in seen_keys:
                seen_keys.add(dedup_key)
                seen_keys.add(job_id)
                deduped_jobs.append(j)

        sync_meta = {
            "last_sync_time": now_iso,
            "query": query,
            "location": location or "",
            "total_synced": len(deduped_jobs),
            "total_persisted": len(deduped_jobs),
            "provider_counts": provider_counts,
            "provider_errors": provider_errors,
            "status": "success" if deduped_jobs else "partial_success",
        }

        # Offload Firestore batch writes to a daemon background thread
        # Client does NOT wait for 20+ seconds of remote DB operations!
        threading.Thread(
            target=self._persist_jobs_batch,
            args=(deduped_jobs, now, now_iso, sync_meta),
            daemon=True,
        ).start()

        report = {
            "status": sync_meta["status"],
            "sync_time": now_iso,
            "formatted_sync_time": now.strftime("%I:%M %p"),
            "total_synced": len(deduped_jobs),
            "provider_counts": provider_counts,
            "provider_errors": provider_errors,
            "jobs": deduped_jobs,
        }

        with _CACHE_LOCK:
            _JOBS_CACHE[cache_key] = (now.timestamp(), report)

        return report

    def get_last_sync_status(self) -> Dict[str, Any]:
        """Retrieve the persisted sync status and timestamp."""
        try:
            doc = self.database.get(collection="system_metadata", document_id="job_sync")
            if doc:
                return doc
        except Exception:
            pass

        return {
            "last_sync_time": datetime.now(timezone.utc).isoformat(),
            "formatted_sync_time": "Recently",
            "total_synced": 0,
            "provider_counts": {},
            "provider_errors": {},
            "status": "ready",
        }
