"""
User Skill and Learning Resource Service for CareerTwin.
Provides robust persistence with Firebase Firestore and in-memory cache fallback.
Enforces strict user isolation, deduplication, proficiency boundaries,
and learning progress tracking.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from backend.database.firestore import FirestoreDatabase

logger = logging.getLogger(__name__)

# Global in-memory caches for fast access and testing isolation
_user_skills_cache: Dict[str, Dict[str, Dict[str, Any]]] = {}
_learning_progress_cache: Dict[str, Dict[str, Dict[str, Any]]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class UserSkillService:
    def __init__(self, database: Optional[FirestoreDatabase] = None):
        if database is not None:
            self.database = database
        else:
            try:
                self.database = FirestoreDatabase()
            except Exception as exc:
                logger.warning(f"Could not initialize FirestoreDatabase for UserSkillService: {exc}")
                self.database = None

    # --------------------------------------------------------------------------
    # SKILLS MANAGEMENT
    # --------------------------------------------------------------------------

    def _load_user_skills(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Retrieve skills for user from cache or Firestore."""
        if user_id in _user_skills_cache:
            return _user_skills_cache[user_id]

        skills_map: Dict[str, Dict[str, Any]] = {}
        if self.database:
            try:
                docs = self.database.list("user_skills", filters={"user_id": user_id}, limit=500)
                for d in docs:
                    sid = d.get("id") or d.get("skill_id")
                    if sid:
                        skills_map[sid] = d
            except Exception as exc:
                logger.warning(f"Failed to load user_skills from Firestore for user {user_id}: {exc}")

        _user_skills_cache[user_id] = skills_map
        return skills_map

    def get_user_skills(self, user_id: str) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Get list of user skills and summary metrics."""
        skills_map = self._load_user_skills(user_id)
        skills_list = list(skills_map.values())
        # Sort descending by updated_at
        skills_list.sort(key=lambda s: s.get("updated_at", ""), reverse=True)

        total_skills = len(skills_list)
        proficient_skills = sum(1 for s in skills_list if float(s.get("proficiency", 0)) >= 70.0)
        skills_to_improve = sum(
            1 for s in skills_list if float(s.get("proficiency", 0)) < float(s.get("target_proficiency", 80.0))
        )

        target_role = self.get_user_target_role(user_id)

        summary = {
            "total_skills": total_skills,
            "proficient_skills": proficient_skills,
            "skills_to_improve": skills_to_improve,
            "target_role": target_role,
        }
        return skills_list, summary

    def get_user_target_role(self, user_id: str) -> str:
        """Fetch target role from profile."""
        from backend.api.routes.profile import _user_profiles
        if user_id in _user_profiles and _user_profiles[user_id].get("target_role"):
            return _user_profiles[user_id]["target_role"]

        if self.database:
            try:
                prof = self.database.get("profiles", user_id)
                if prof and prof.get("target_role"):
                    return prof["target_role"]
            except Exception:
                pass
        return "Software Engineer"

    def set_user_target_role(self, user_id: str, target_role: str) -> str:
        """Update target role in profile and return clean role name."""
        clean_role = target_role.strip()
        if not clean_role:
            clean_role = "Software Engineer"

        from backend.api.routes.profile import _user_profiles
        if user_id not in _user_profiles:
            _user_profiles[user_id] = {}
        _user_profiles[user_id]["target_role"] = clean_role

        if self.database:
            try:
                self.database.update("profiles", user_id, {"target_role": clean_role})
            except Exception as exc:
                logger.warning(f"Could not update target_role in Firestore for user {user_id}: {exc}")

        return clean_role

    def create_skill(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new skill for user, preventing duplicates."""
        name = data.get("name", "").strip()
        if not name:
            raise ValueError("Skill name cannot be empty.")

        skills_map = self._load_user_skills(user_id)
        # Check duplicate by normalized name
        name_lower = name.lower()
        for s in skills_map.values():
            if s.get("name", "").strip().lower() == name_lower:
                raise ValueError(f"Skill '{name}' already exists in your profile.")

        skill_id = f"skill_{uuid4().hex[:10]}"
        now = _now_iso()

        proficiency = max(0.0, min(100.0, float(data.get("proficiency", 50.0))))
        target_proficiency = max(0.0, min(100.0, float(data.get("target_proficiency", 80.0))))

        skill_record = {
            "id": skill_id,
            "user_id": user_id,
            "name": name,
            "category": data.get("category", "Programming Languages"),
            "proficiency": proficiency,
            "target_proficiency": target_proficiency,
            "proficiency_source": data.get("proficiency_source", "self-assessed"),
            "notes": (data.get("notes") or "").strip(),
            "learning_goal": (data.get("learning_goal") or "").strip(),
            "created_at": now,
            "updated_at": now,
        }

        # Save to memory cache
        skills_map[skill_id] = skill_record
        _user_skills_cache[user_id] = skills_map

        # Persist to Firestore: both user_skills/{user_id}_{skill_id} and subcollection
        if self.database:
            try:
                doc_id = f"{user_id}_{skill_id}"
                self.database.update("user_skills", doc_id, skill_record)
            except Exception as exc:
                logger.error(f"Failed to persist user_skill to Firestore: {exc}")

        return skill_record

    def update_skill(self, user_id: str, skill_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing skill with ownership check."""
        skills_map = self._load_user_skills(user_id)
        existing = skills_map.get(skill_id)

        # Check database directly if not in memory
        if not existing and self.database:
            doc_id = f"{user_id}_{skill_id}"
            existing = self.database.get("user_skills", doc_id)
            if existing and existing.get("user_id") == user_id:
                skills_map[skill_id] = existing

        if not existing:
            raise KeyError("Skill not found.")

        if existing.get("user_id") != user_id:
            raise PermissionError("Access forbidden: You do not own this skill.")

        # If name is changed, check duplicates
        new_name = data.get("name")
        if new_name is not None:
            new_name = new_name.strip()
            if not new_name:
                raise ValueError("Skill name cannot be empty.")
            name_lower = new_name.lower()
            for sid, s in skills_map.items():
                if sid != skill_id and s.get("name", "").strip().lower() == name_lower:
                    raise ValueError(f"Another skill with name '{new_name}' already exists.")
            existing["name"] = new_name

        if "category" in data and data["category"] is not None:
            existing["category"] = str(data["category"]).strip()

        if "proficiency" in data and data["proficiency"] is not None:
            existing["proficiency"] = max(0.0, min(100.0, float(data["proficiency"])))

        if "target_proficiency" in data and data["target_proficiency"] is not None:
            existing["target_proficiency"] = max(0.0, min(100.0, float(data["target_proficiency"])))

        if "notes" in data and data["notes"] is not None:
            existing["notes"] = str(data["notes"]).strip()

        if "learning_goal" in data and data["learning_goal"] is not None:
            existing["learning_goal"] = str(data["learning_goal"]).strip()

        now = _now_iso()
        existing["updated_at"] = now
        skills_map[skill_id] = existing
        _user_skills_cache[user_id] = skills_map

        # Persist to Firestore
        if self.database:
            try:
                doc_id = f"{user_id}_{skill_id}"
                self.database.update("user_skills", doc_id, existing)
            except Exception as exc:
                logger.error(f"Failed to update user_skill in Firestore: {exc}")

        return existing

    def delete_skill(self, user_id: str, skill_id: str) -> bool:
        """Delete a skill with ownership check."""
        skills_map = self._load_user_skills(user_id)
        existing = skills_map.get(skill_id)

        if not existing and self.database:
            doc_id = f"{user_id}_{skill_id}"
            existing = self.database.get("user_skills", doc_id)

        if not existing:
            raise KeyError("Skill not found.")

        if existing.get("user_id") != user_id:
            raise PermissionError("Access forbidden: You do not own this skill.")

        # Remove from cache
        skills_map.pop(skill_id, None)
        _user_skills_cache[user_id] = skills_map

        # Delete from Firestore
        if self.database:
            try:
                doc_id = f"{user_id}_{skill_id}"
                self.database.delete("user_skills", doc_id)
            except Exception as exc:
                logger.error(f"Failed to delete user_skill from Firestore: {exc}")

        return True

    # --------------------------------------------------------------------------
    # LEARNING PROGRESS TRACKING
    # --------------------------------------------------------------------------

    def _load_learning_progress(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Retrieve progress map for user from cache or Firestore."""
        if user_id in _learning_progress_cache:
            return _learning_progress_cache[user_id]

        progress_map: Dict[str, Dict[str, Any]] = {}
        if self.database:
            try:
                docs = self.database.list("learning_progress", filters={"user_id": user_id}, limit=500)
                for d in docs:
                    rid = d.get("resource_id")
                    if rid:
                        progress_map[rid] = d
            except Exception as exc:
                logger.warning(f"Failed to load learning_progress for user {user_id}: {exc}")

        _learning_progress_cache[user_id] = progress_map
        return progress_map

    def get_learning_progress(self, user_id: str, category: Optional[str] = None) -> Dict[str, Any]:
        """Get all learning progress records and summary counts for user."""
        progress_map = self._load_learning_progress(user_id)
        records = list(progress_map.values())

        if category:
            cat_lower = category.lower()
            records = [r for r in records if r.get("category", "").lower() == cat_lower]

        counts = {
            "dsa_solved": sum(
                1 for r in progress_map.values()
                if r.get("category") == "dsa" and r.get("status") in ("Solved", "Completed")
            ),
            "aptitude_completed": sum(
                1 for r in progress_map.values()
                if r.get("category") == "aptitude" and r.get("status") in ("Completed", "Solved")
            ),
            "programming_completed": sum(
                1 for r in progress_map.values()
                if r.get("category") == "programming" and r.get("status") in ("Completed", "Solved")
            ),
            "total_completed": sum(
                1 for r in progress_map.values() if r.get("status") in ("Solved", "Completed")
            ),
        }

        return {
            "progress": records,
            "progress_map": progress_map,
            "counts": counts,
        }

    def update_learning_progress(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save or update learning progress for a specific resource."""
        resource_id = data.get("resource_id", "").strip()
        if not resource_id:
            raise ValueError("resource_id is required.")

        progress_map = self._load_learning_progress(user_id)
        existing = progress_map.get(resource_id)
        now = _now_iso()

        status = data.get("status", "In Progress")
        is_completed = status in ("Solved", "Completed")

        if existing:
            existing["status"] = status
            if "notes" in data and data["notes"] is not None:
                existing["notes"] = str(data["notes"]).strip()
            if "topic" in data and data["topic"]:
                existing["topic"] = str(data["topic"]).strip()
            if "title" in data and data["title"]:
                existing["title"] = str(data["title"]).strip()
            if "category" in data and data["category"]:
                existing["category"] = str(data["category"]).strip().lower()

            existing["last_practiced_at"] = now
            existing["updated_at"] = now
            if is_completed and not existing.get("completed_at"):
                existing["completed_at"] = now
            elif not is_completed:
                existing["completed_at"] = None

            record = existing
        else:
            record_id = f"{user_id}_{resource_id}"
            record = {
                "id": record_id,
                "user_id": user_id,
                "resource_id": resource_id,
                "category": data.get("category", "dsa").strip().lower(),
                "topic": data.get("topic", "").strip(),
                "title": data.get("title", "").strip(),
                "status": status,
                "notes": (data.get("notes") or "").strip(),
                "last_practiced_at": now,
                "completed_at": now if is_completed else None,
                "created_at": now,
                "updated_at": now,
            }

        progress_map[resource_id] = record
        _learning_progress_cache[user_id] = progress_map

        # Persist to Firestore
        if self.database:
            try:
                doc_id = f"{user_id}_{resource_id}"
                self.database.update("learning_progress", doc_id, record)
            except Exception as exc:
                logger.error(f"Failed to update learning_progress in Firestore: {exc}")

        return record
