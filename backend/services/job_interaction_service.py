"""
Service for managing user job interactions (Viewed, Saved, Applied)
with Firebase Firestore persistence and in-memory caching.
Ensures strict user ownership, deduplication, and integration with
the existing job applications collection.
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

from backend.database.firestore import FirestoreDatabase

logger = logging.getLogger(__name__)

# Global cache: user_id -> { job_id -> interaction_dict }
_interactions_cache: Dict[str, Dict[str, Dict[str, Any]]] = {}


class JobInteractionService:
    def __init__(self, database: Optional[FirestoreDatabase] = None):
        if database is not None:
            self.database = database
        else:
            try:
                self.database = FirestoreDatabase()
            except Exception as exc:
                logger.warning(f"Could not initialize FirestoreDatabase for interactions: {exc}")
                self.database = None

    def _get_user_interactions(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Get or load all interactions for user from cache/Firestore."""
        if user_id in _interactions_cache:
            return _interactions_cache[user_id]

        user_map: Dict[str, Dict[str, Any]] = {}
        if self.database:
            try:
                # Query job_interactions for this user
                docs = self.database.list("job_interactions", filters={"user_id": user_id}, limit=300)
                for d in docs:
                    jid = d.get("job_id")
                    if jid:
                        user_map[jid] = d
            except Exception as exc:
                logger.warning(f"Failed to query job_interactions for user {user_id}: {exc}")

        _interactions_cache[user_id] = user_map
        return user_map

    def _persist_interaction(self, user_id: str, job_id: str, data: Dict[str, Any]) -> None:
        """Persist interaction in Firestore under job_interactions and user subcollection."""
        if not self.database:
            return

        doc_id = f"{user_id}_{job_id}"
        try:
            self.database.update("job_interactions", doc_id, data)
        except Exception:
            try:
                self.database.create("job_interactions", doc_id, data)
            except Exception as exc:
                logger.warning(f"Could not persist job_interactions doc {doc_id}: {exc}")

    def record_view(
        self,
        user_id: str,
        job_id: str,
        job_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Record a job view event for a user.
        Deduplicates: multiple views to the same job role update last_viewed_at
        without inflating the unique viewed count.
        """
        if not user_id or not job_id:
            raise ValueError("user_id and job_id are required to record a job view.")

        now = time.time()
        user_map = self._get_user_interactions(user_id)
        existing = user_map.get(job_id, {})

        first_viewed = existing.get("first_viewed_at") or now
        interaction = {
            **existing,
            "user_id": user_id,
            "job_id": job_id,
            "viewed": True,
            "first_viewed_at": first_viewed,
            "last_viewed_at": now,
        }

        # Preserve / populate snapshot info if provided
        if job_data:
            interaction.setdefault("title", job_data.get("title") or "Software Role")
            interaction.setdefault("company", job_data.get("company") or "Company")
            interaction.setdefault("location", job_data.get("location") or "Remote")
            interaction.setdefault("source", job_data.get("source") or "CareerTwin")
            interaction.setdefault("source_badge", job_data.get("source_badge") or "")
            interaction.setdefault("job_url", job_data.get("job_url") or job_data.get("application_url") or "")
            interaction.setdefault("salary_range", job_data.get("salary_range"))
            interaction.setdefault("work_arrangement", job_data.get("work_arrangement"))
            interaction.setdefault("employment_type", job_data.get("employment_type"))
            interaction.setdefault("required_skills", job_data.get("required_skills") or [])
            interaction.setdefault("description", job_data.get("description") or "")
            interaction.setdefault("job_snapshot", job_data)

        user_map[job_id] = interaction
        self._persist_interaction(user_id, job_id, interaction)
        return interaction

    def toggle_save(
        self,
        user_id: str,
        job_id: str,
        saved: bool,
        job_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Save or unsave a job for a user.
        Preserves independent view and application records.
        """
        if not user_id or not job_id:
            raise ValueError("user_id and job_id are required to save or unsave a job.")

        now = time.time()
        user_map = self._get_user_interactions(user_id)
        existing = user_map.get(job_id, {})

        interaction = {
            **existing,
            "user_id": user_id,
            "job_id": job_id,
            "saved": saved,
            "saved_at": now if saved else None,
        }

        if job_data:
            interaction.setdefault("title", job_data.get("title") or "Software Role")
            interaction.setdefault("company", job_data.get("company") or "Company")
            interaction.setdefault("location", job_data.get("location") or "Remote")
            interaction.setdefault("source", job_data.get("source") or "CareerTwin")
            interaction.setdefault("source_badge", job_data.get("source_badge") or "")
            interaction.setdefault("job_url", job_data.get("job_url") or job_data.get("application_url") or "")
            interaction.setdefault("salary_range", job_data.get("salary_range"))
            interaction.setdefault("work_arrangement", job_data.get("work_arrangement"))
            interaction.setdefault("employment_type", job_data.get("employment_type"))
            interaction.setdefault("required_skills", job_data.get("required_skills") or [])
            interaction.setdefault("description", job_data.get("description") or "")
            interaction.setdefault("job_snapshot", job_data)

        user_map[job_id] = interaction
        self._persist_interaction(user_id, job_id, interaction)
        return interaction

    def record_application(
        self,
        user_id: str,
        job_id: str,
        application_id: Optional[str] = None,
        job_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Mark a job as applied after user confirmation.
        Integrates with the applications collection and updates interaction state.
        """
        if not user_id or not job_id:
            raise ValueError("user_id and job_id are required to record an application.")

        now = time.time()
        user_map = self._get_user_interactions(user_id)
        existing = user_map.get(job_id, {})

        interaction = {
            **existing,
            "user_id": user_id,
            "job_id": job_id,
            "applied": True,
            "applied_at": existing.get("applied_at") or now,
            "application_id": application_id or existing.get("application_id"),
        }

        if job_data:
            interaction.setdefault("title", job_data.get("title") or "Software Role")
            interaction.setdefault("company", job_data.get("company") or "Company")
            interaction.setdefault("location", job_data.get("location") or "Remote")
            interaction.setdefault("source", job_data.get("source") or "CareerTwin")
            interaction.setdefault("source_badge", job_data.get("source_badge") or "")
            interaction.setdefault("job_url", job_data.get("job_url") or job_data.get("application_url") or "")
            interaction.setdefault("salary_range", job_data.get("salary_range"))
            interaction.setdefault("work_arrangement", job_data.get("work_arrangement"))
            interaction.setdefault("employment_type", job_data.get("employment_type"))
            interaction.setdefault("required_skills", job_data.get("required_skills") or [])
            interaction.setdefault("description", job_data.get("description") or "")
            interaction.setdefault("job_snapshot", job_data)

        user_map[job_id] = interaction
        self._persist_interaction(user_id, job_id, interaction)
        return interaction

    def get_summary(self, user_id: str) -> Dict[str, Any]:
        """
        Calculate unique Viewed, Saved, and Applied jobs for the user.
        Cross-references the applications collection for complete tracking.
        """
        if not user_id:
            return {
                "viewed_count": 0,
                "saved_count": 0,
                "applied_count": 0,
                "viewed_job_ids": [],
                "saved_job_ids": [],
                "applied_job_ids": [],
                "interactions": {},
                "saved_jobs": [],
                "viewed_jobs": [],
                "applied_jobs": [],
            }

        user_map = self._get_user_interactions(user_id)

        # Cross-reference with applications collection
        applied_from_apps: set[str] = set()
        apps_data: List[Dict[str, Any]] = []
        if self.database:
            try:
                records = self.database.list("applications", filters={"user_id": user_id}, limit=200)
                for r in records:
                    jid = r.get("job_id")
                    if jid and r.get("status") in ("Applied", "Interviewing", "Offer"):
                        applied_from_apps.add(jid)
                        apps_data.append(r)
            except Exception as exc:
                logger.warning(f"Failed to check applications for user {user_id}: {exc}")

        # Also check in-memory route applications
        from backend.api.routes.applications import _applications
        mem_apps = _applications.get(user_id, [])
        for a in mem_apps:
            jid = a.get("job_id")
            if jid and a.get("status") in ("Applied", "Interviewing", "Offer"):
                applied_from_apps.add(jid)

        viewed_ids = [jid for jid, data in user_map.items() if data.get("viewed")]
        saved_ids = [jid for jid, data in user_map.items() if data.get("saved")]
        applied_ids = list(set([jid for jid, data in user_map.items() if data.get("applied")] + list(applied_from_apps)))

        def extract_job_obj(jid: str, interaction: Dict[str, Any]) -> Dict[str, Any]:
            snap = interaction.get("job_snapshot") or {}
            return {
                "job_id": jid,
                "title": interaction.get("title") or snap.get("title") or "Software Engineer",
                "company": interaction.get("company") or snap.get("company") or "Company",
                "location": interaction.get("location") or snap.get("location") or "Remote",
                "source": interaction.get("source") or snap.get("source") or "CareerTwin",
                "source_badge": interaction.get("source_badge") or snap.get("source_badge") or "Verified",
                "job_url": interaction.get("job_url") or snap.get("job_url") or snap.get("application_url") or "",
                "salary_range": interaction.get("salary_range") or snap.get("salary_range"),
                "work_arrangement": interaction.get("work_arrangement") or snap.get("work_arrangement") or "Remote",
                "employment_type": interaction.get("employment_type") or snap.get("employment_type") or "Full-time",
                "required_skills": interaction.get("required_skills") or snap.get("required_skills") or [],
                "description": interaction.get("description") or snap.get("description") or "",
                "posting_date": snap.get("posting_date") or "Recently",
                "is_live_external": snap.get("is_live_external", False),
            }

        saved_jobs = [extract_job_obj(jid, user_map[jid]) for jid in saved_ids if jid in user_map]
        viewed_jobs = [extract_job_obj(jid, user_map[jid]) for jid in viewed_ids if jid in user_map]
        applied_jobs = [extract_job_obj(jid, user_map[jid]) for jid in applied_ids if jid in user_map]

        return {
            "viewed_count": len(viewed_ids),
            "saved_count": len(saved_ids),
            "applied_count": len(applied_ids),
            "viewed_job_ids": viewed_ids,
            "saved_job_ids": saved_ids,
            "applied_job_ids": applied_ids,
            "interactions": user_map,
            "saved_jobs": saved_jobs,
            "viewed_jobs": viewed_jobs,
            "applied_jobs": applied_jobs,
        }
