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

SUPPORTED_SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]

SKILL_LEVEL_RANKS: Dict[str, int] = {
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3,
    "Expert": 4,
}

SKILL_LEVEL_TO_PERCENTAGE: Dict[str, float] = {
    "Beginner": 25.0,
    "Intermediate": 50.0,
    "Advanced": 75.0,
    "Expert": 90.0,
}


def normalize_skill_level(val: Any, default: str = "Intermediate") -> str:
    """
    Safely normalize any skill proficiency input (level string or legacy numeric percentage)
    to one of the four supported skill levels: Beginner, Intermediate, Advanced, Expert.
    """
    if val is None or val == "":
        return default
    if isinstance(val, str):
        cleaned = val.strip().capitalize()
        if cleaned in SKILL_LEVEL_RANKS:
            return cleaned
        try:
            val = float(val)
        except ValueError:
            return default
    try:
        f = float(val)
        if f < 40.0:
            return "Beginner"
        elif f < 70.0:
            return "Intermediate"
        elif f < 90.0:
            return "Advanced"
        else:
            return "Expert"
    except Exception:
        return default


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

    def _normalize_skill_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure record contains migrated level fields alongside legacy proficiency."""
        c_lvl = normalize_skill_level(
            record.get("current_level") or record.get("currentLevel") or record.get("proficiency"),
            default="Intermediate",
        )
        t_lvl = normalize_skill_level(
            record.get("target_level") or record.get("targetLevel") or record.get("target_proficiency"),
            default="Advanced",
        )
        record["current_level"] = c_lvl
        record["currentLevel"] = c_lvl
        record["target_level"] = t_lvl
        record["targetLevel"] = t_lvl

        if "proficiency" not in record or record["proficiency"] is None:
            record["proficiency"] = SKILL_LEVEL_TO_PERCENTAGE[c_lvl]
        else:
            try:
                record["proficiency"] = float(record["proficiency"])
            except Exception:
                record["proficiency"] = SKILL_LEVEL_TO_PERCENTAGE[c_lvl]

        if "target_proficiency" not in record or record["target_proficiency"] is None:
            record["target_proficiency"] = SKILL_LEVEL_TO_PERCENTAGE[t_lvl]
        else:
            try:
                record["target_proficiency"] = float(record["target_proficiency"])
            except Exception:
                record["target_proficiency"] = SKILL_LEVEL_TO_PERCENTAGE[t_lvl]

        return record

    def _load_user_skills(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Retrieve skills for user from cache or Firestore with automatic level migration."""
        if user_id in _user_skills_cache:
            return _user_skills_cache[user_id]

        skills_map: Dict[str, Dict[str, Any]] = {}
        if self.database:
            try:
                docs = self.database.list("user_skills", filters={"user_id": user_id}, limit=500)
                for d in docs:
                    sid = d.get("id") or d.get("skill_id")
                    if sid:
                        skills_map[sid] = self._normalize_skill_record(d)
            except Exception as exc:
                logger.warning(f"Failed to load user_skills from Firestore for user {user_id}: {exc}")

        _user_skills_cache[user_id] = skills_map
        return skills_map

    def get_user_skills(self, user_id: str) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Get list of user skills and summary metrics."""
        skills_map = self._load_user_skills(user_id)
        skills_list = [self._normalize_skill_record(s) for s in skills_map.values()]
        # Sort descending by updated_at
        skills_list.sort(key=lambda s: s.get("updated_at", ""), reverse=True)

        total_skills = len(skills_list)
        proficient_skills = sum(
            1 for s in skills_list
            if s.get("current_level") in ("Advanced", "Expert") or float(s.get("proficiency", 0.0)) >= 70.0
        )
        skills_to_improve = sum(
            1 for s in skills_list
            if SKILL_LEVEL_RANKS.get(s.get("current_level", "Intermediate"), 2) < SKILL_LEVEL_RANKS.get(s.get("target_level", "Advanced"), 3)
            or float(s.get("proficiency", 0.0)) < float(s.get("target_proficiency", 80.0))
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

        current_lvl_input = data.get("current_level") or data.get("currentLevel")
        target_lvl_input = data.get("target_level") or data.get("targetLevel")

        if current_lvl_input:
            clean_c = str(current_lvl_input).strip().capitalize()
            if clean_c not in SKILL_LEVEL_RANKS:
                raise ValueError(f"Unsupported skill level '{current_lvl_input}'. Supported levels: Beginner, Intermediate, Advanced, Expert.")
            current_lvl = clean_c
            proficiency = SKILL_LEVEL_TO_PERCENTAGE[current_lvl]
        else:
            raw_prof = data.get("proficiency")
            if raw_prof is None:
                raw_prof = 50.0
            proficiency = max(0.0, min(100.0, float(raw_prof)))
            current_lvl = normalize_skill_level(proficiency, "Intermediate")

        if target_lvl_input:
            clean_t = str(target_lvl_input).strip().capitalize()
            if clean_t not in SKILL_LEVEL_RANKS:
                raise ValueError(f"Unsupported skill level '{target_lvl_input}'. Supported levels: Beginner, Intermediate, Advanced, Expert.")
            target_lvl = clean_t
            target_proficiency = SKILL_LEVEL_TO_PERCENTAGE[target_lvl]
        else:
            raw_t_prof = data.get("target_proficiency")
            if raw_t_prof is None:
                raw_t_prof = 80.0
            target_proficiency = max(0.0, min(100.0, float(raw_t_prof)))
            target_lvl = normalize_skill_level(target_proficiency, "Advanced")

        skill_record = {
            "id": skill_id,
            "user_id": user_id,
            "name": name,
            "category": data.get("category", "Programming Languages"),
            "current_level": current_lvl,
            "target_level": target_lvl,
            "currentLevel": current_lvl,
            "targetLevel": target_lvl,
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
        """Update an existing skill with ownership check and level validation."""
        skills_map = self._load_user_skills(user_id)
        existing = skills_map.get(skill_id)

        # Check database directly if not in memory
        if not existing and self.database:
            doc_id = f"{user_id}_{skill_id}"
            existing = self.database.get("user_skills", doc_id)
            if existing and existing.get("user_id") == user_id:
                existing = self._normalize_skill_record(existing)
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

        # Update current level / proficiency
        if "current_level" in data or "currentLevel" in data:
            c_in = data.get("current_level") or data.get("currentLevel")
            if c_in:
                clean_c = str(c_in).strip().capitalize()
                if clean_c not in SKILL_LEVEL_RANKS:
                    raise ValueError(f"Unsupported skill level '{c_in}'. Supported levels: Beginner, Intermediate, Advanced, Expert.")
                existing["current_level"] = clean_c
                existing["currentLevel"] = clean_c
                existing["proficiency"] = SKILL_LEVEL_TO_PERCENTAGE[clean_c]
        elif "proficiency" in data and data["proficiency"] is not None:
            raw = max(0.0, min(100.0, float(data["proficiency"])))
            existing["proficiency"] = raw
            c_lvl = normalize_skill_level(raw, "Intermediate")
            existing["current_level"] = c_lvl
            existing["currentLevel"] = c_lvl

        # Update target level / target proficiency
        if "target_level" in data or "targetLevel" in data:
            t_in = data.get("target_level") or data.get("targetLevel")
            if t_in:
                clean_t = str(t_in).strip().capitalize()
                if clean_t not in SKILL_LEVEL_RANKS:
                    raise ValueError(f"Unsupported skill level '{t_in}'. Supported levels: Beginner, Intermediate, Advanced, Expert.")
                existing["target_level"] = clean_t
                existing["targetLevel"] = clean_t
                existing["target_proficiency"] = SKILL_LEVEL_TO_PERCENTAGE[clean_t]
        elif "target_proficiency" in data and data["target_proficiency"] is not None:
            raw = max(0.0, min(100.0, float(data["target_proficiency"])))
            existing["target_proficiency"] = raw
            t_lvl = normalize_skill_level(raw, "Advanced")
            existing["target_level"] = t_lvl
            existing["targetLevel"] = t_lvl

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

    def delete_skill(self, user_id: str, skill_id: str) -> None:
        """Delete skill for user with ownership check."""
        skills_map = self._load_user_skills(user_id)
        existing = skills_map.get(skill_id)

        if not existing and self.database:
            doc_id = f"{user_id}_{skill_id}"
            existing = self.database.get("user_skills", doc_id)
            if existing and existing.get("user_id") == user_id:
                skills_map[skill_id] = existing

        if not existing:
            raise KeyError("Skill not found.")

        if existing.get("user_id") != user_id:
            raise PermissionError("Access forbidden: You do not own this skill.")

        # Remove from memory cache
        if skill_id in skills_map:
            del skills_map[skill_id]
        _user_skills_cache[user_id] = skills_map

        # Remove from Firestore
        if self.database:
            try:
                doc_id = f"{user_id}_{skill_id}"
                self.database.delete("user_skills", doc_id)
            except Exception as exc:
                logger.error(f"Failed to delete user_skill from Firestore: {exc}")

    # --------------------------------------------------------------------------
    # LEARNING & PRACTICE PROGRESS TRACKING
    # --------------------------------------------------------------------------

    def _load_learning_progress(self, user_id: str) -> Dict[str, Dict[str, Any]]:
        """Retrieve learning progress items from memory or Firestore."""
        if user_id in _learning_progress_cache:
            return _learning_progress_cache[user_id]

        progress_map: Dict[str, Dict[str, Any]] = {}
        if self.database:
            try:
                docs = self.database.list("learning_progress", filters={"user_id": user_id}, limit=500)
                for d in docs:
                    rid = d.get("resource_id") or d.get("id")
                    if rid:
                        progress_map[rid] = d
            except Exception as exc:
                logger.warning(f"Failed to load learning_progress for user {user_id}: {exc}")

        _learning_progress_cache[user_id] = progress_map
        return progress_map

    def get_learning_progress(self, user_id: str, category: Optional[str] = None) -> Dict[str, Any]:
        """Fetch user practice records and compute counts."""
        progress_map = self._load_learning_progress(user_id)
        records = list(progress_map.values())

        if category and category.strip():
            cat_lower = category.strip().lower()
            records = [r for r in records if r.get("category", "").lower() == cat_lower]

        counts = {
            "dsa_solved": sum(1 for r in records if r.get("category", "").lower() == "dsa" and r.get("status") in ("Solved", "Completed")),
            "aptitude_completed": sum(1 for r in records if r.get("category", "").lower() == "aptitude" and r.get("status") in ("Solved", "Completed")),
            "total_completed": sum(1 for r in records if r.get("status") in ("Solved", "Completed")),
            "solved": sum(1 for r in records if r.get("status") in ("Solved", "Completed")),
            "in_progress": sum(1 for r in records if r.get("status") == "In Progress"),
            "revision": sum(1 for r in records if r.get("status") == "Revision"),
            "total_attempted": len(records),
        }

        return {
            "progress": records,
            "progress_map": progress_map,
            "counts": counts,
        }

    def update_learning_progress(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save practice status, notes, or completion timestamp for an item."""
        resource_id = data.get("resource_id", "").strip()
        if not resource_id:
            raise ValueError("Resource ID is required.")

        category = data.get("category", "General").strip()
        status = data.get("status", "Not Started").strip()
        notes = (data.get("notes") or "").strip()
        topic = (data.get("topic") or "").strip()
        title = (data.get("title") or resource_id).strip()

        now = _now_iso()
        progress_map = self._load_learning_progress(user_id)
        existing = progress_map.get(resource_id)

        if existing:
            existing["status"] = status
            existing["notes"] = notes or existing.get("notes", "")
            existing["last_practiced_at"] = now
            existing["updated_at"] = now
            if status in ("Solved", "Completed") and not existing.get("completed_at"):
                existing["completed_at"] = now
            record = existing
        else:
            record_id = f"prog_{uuid4().hex[:10]}"
            record = {
                "id": record_id,
                "user_id": user_id,
                "resource_id": resource_id,
                "category": category,
                "topic": topic,
                "title": title,
                "status": status,
                "notes": notes,
                "last_practiced_at": now,
                "completed_at": now if status in ("Solved", "Completed") else None,
                "created_at": now,
                "updated_at": now,
            }

        progress_map[resource_id] = record
        _learning_progress_cache[user_id] = progress_map

        if self.database:
            try:
                doc_id = f"{user_id}_{resource_id}"
                self.database.update("learning_progress", doc_id, record)
            except Exception as exc:
                logger.error(f"Failed to persist learning_progress to Firestore: {exc}")

        return record
