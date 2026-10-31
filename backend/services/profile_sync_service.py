"""
Profile Synchronization Service.
Synchronizes parsed resume information into the user's persistent profile,
skill registry, and digital twin state without overwriting manual overrides
or violating authentication identity.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from backend.database.firestore import FirestoreDatabase
from backend.services.resume_extractor import extract_comprehensive_resume_data
from backend.services.user_skill_service import UserSkillService

logger = logging.getLogger(__name__)


def is_raw_uid_or_placeholder(name: Optional[str], user_id: str) -> bool:
    """Check if a name string is a raw Firebase UID or dummy placeholder."""
    if not name or not name.strip():
        return True
    cleaned = name.strip()
    if cleaned in (user_id, f"users/{user_id}", "null", "undefined", "string"):
        return True
    # Firebase UID pattern (alphanumeric, ~28 chars, no spaces)
    if len(cleaned) >= 20 and " " not in cleaned and any(c.isdigit() for c in cleaned) and any(c.isalpha() for c in cleaned):
        return True
    # Capitalized UID like 'Bfitticnaeq7Ntmmgpsooqubbc33'
    if len(cleaned) >= 20 and " " not in cleaned and cleaned.lower() == user_id.lower():
        return True
    return False


def sync_resume_to_user_profile(
    user_id: str,
    resume_text: str,
    resume_id: str,
    filename: str,
    ats_score: Optional[float] = None,
    resume_score: Optional[float] = None,
    job_description: Optional[str] = None,
    database: Optional[FirestoreDatabase] = None,
) -> Dict[str, Any]:
    """
    Synchronizes biographical, educational, and technical information extracted
    from the resume into the user's persistent profile.
    
    Adheres strictly to these safety rules:
    1. NEVER overwrites auth identity or account email with arbitrary text.
    2. NEVER overwrites fields that the user has manually entered and saved.
    3. Populates empty fields (full_name, college, graduation_year, skills, bio).
    4. Sets active_resume_id and active_resume_filename for multi-resume isolation.
    5. Syncs detected skills into UserSkillService so they immediately register in skills KPI.
    """
    if not user_id or not resume_text:
        return {}

    db = database
    if db is None:
        try:
            db = FirestoreDatabase()
        except Exception as exc:
            logger.warning(f"Could not initialize Firestore in profile sync: {exc}")
            db = None

    # 1. Fetch current profile
    current_profile: Dict[str, Any] = {}
    if db:
        try:
            existing = db.get("profiles", user_id)
            if existing and isinstance(existing, dict):
                current_profile = existing
        except Exception as exc:
            logger.warning(f"Could not load existing profile for {user_id}: {exc}")

    # Also check memory cache in profile route
    try:
        from backend.api.routes.profile import _user_profiles
        if user_id in _user_profiles:
            for k, v in _user_profiles[user_id].items():
                if v and k not in current_profile:
                    current_profile[k] = v
    except Exception:
        pass

    # 2. Extract comprehensive data from resume
    extracted = extract_comprehensive_resume_data(resume_text)
    if not extracted:
        return current_profile

    updated = dict(current_profile)

    # 3. Safe field updates (only if missing or raw UID)
    existing_name = updated.get("full_name")
    if is_raw_uid_or_placeholder(existing_name, user_id) and extracted.get("full_name"):
        updated["full_name"] = extracted["full_name"]

    if not updated.get("phone") and extracted.get("phone"):
        updated["phone"] = extracted["phone"]

    if not updated.get("linkedin") and extracted.get("linkedin"):
        updated["linkedin"] = extracted["linkedin"]

    if not updated.get("github") and extracted.get("github"):
        updated["github"] = extracted["github"]

    if (not updated.get("target_role") or updated.get("target_role") == "Software Engineer") and extracted.get("target_role"):
        updated["target_role"] = extracted["target_role"]

    if not updated.get("education") and extracted.get("education"):
        updated["education"] = extracted["education"]

    if not updated.get("college") and extracted.get("college"):
        updated["college"] = extracted["college"]

    if not updated.get("graduation_year") and extracted.get("graduation_year"):
        updated["graduation_year"] = extracted["graduation_year"]

    if not updated.get("degree") and extracted.get("degree"):
        updated["degree"] = extracted["degree"]

    if not updated.get("bio") and extracted.get("bio"):
        updated["bio"] = extracted["bio"]

    # Merge skills safely
    existing_skills = set(updated.get("skills", []))
    new_skills = extracted.get("skills", [])
    merged_skills = sorted(list(existing_skills.union(set(new_skills))))
    updated["skills"] = merged_skills

    # Active resume pointer
    updated["active_resume_id"] = resume_id
    updated["active_resume_filename"] = filename
    if ats_score is not None:
        updated["latest_ats_score"] = int(round(float(ats_score)))
    if resume_score is not None:
        updated["latest_resume_score"] = int(round(float(resume_score)))
    if job_description:
        updated["latest_job_description"] = job_description

    # 4. Persist to Firestore profiles
    if db:
        try:
            db.create("profiles", user_id, updated)
        except Exception as exc:
            logger.warning(f"Could not persist updated profile to Firestore: {exc}")

    # Update in-memory profile cache
    try:
        from backend.api.routes.profile import _user_profiles
        _user_profiles[user_id] = updated
    except Exception:
        pass

    # 5. Sync skills to UserSkillService so they appear in Skills page and KPI
    try:
        skill_service = UserSkillService(database=db)
        res = skill_service.get_user_skills(user_id)
        existing_user_skills = res[0] if isinstance(res, (tuple, list)) else []
        existing_names = {s.get("skill_name", "").lower() for s in existing_user_skills if isinstance(s, dict)}

        for sk_name in new_skills:
            if sk_name.lower() not in existing_names:
                try:
                    skill_service.add_skill(
                        user_id=user_id,
                        skill_name=sk_name,
                        category="Technical",
                        current_level="Intermediate",
                        target_level="Advanced",
                    )
                except Exception:
                    pass
    except Exception as exc:
        logger.warning(f"Could not sync resume skills to UserSkillService: {exc}")

    # 6. Sync with CareerState for live Twin
    try:
        from backend.api.dependencies import career_states
        state = career_states.get(user_id)
        if state:
            if updated.get("target_role"):
                setattr(state, "target_role", updated["target_role"])
            if resume_score is not None:
                setattr(state, "resume_score", float(resume_score))
            elif ats_score is not None:
                setattr(state, "resume_score", float(ats_score))
    except Exception:
        pass

    return updated
