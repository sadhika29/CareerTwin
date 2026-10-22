"""
Profile Management and Multi-Agent Career Intent Architecture.
Provides dynamic student profile management and a multi-agent AI cascade:
Intent Analysis -> Roadmap Synthesis -> Executive Persona Refinement.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from backend.agents.preparation.agent import PreparationAgent
from backend.api.dependencies import career_states, get_current_user

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])

_agent: PreparationAgent | None = None


def _get_agent() -> PreparationAgent:
    global _agent
    if _agent is None:
        _agent = PreparationAgent()
    return _agent


class ProfileData(BaseModel):
    full_name: str = ""
    username: str = ""
    email: str = ""
    target_role: str = "Software Engineer"
    education: str = ""
    graduation_year: str = ""
    skills: List[str] = Field(default_factory=list)
    interests: str = ""
    dream_companies: List[str] = Field(default_factory=list)
    bio: str = ""


class ProfileAdvisorRequest(BaseModel):
    raw_input: str
    target_role: Optional[str] = None
    education: Optional[str] = None
    interests: Optional[str] = None
    current_skills: Optional[List[str]] = None


from backend.database.firestore import FirestoreDatabase

# Storage for user profiles with Firebase Firestore persistence
_user_profiles: Dict[str, Dict[str, Any]] = {}
_firestore_db: FirestoreDatabase | None = None


def _get_firestore() -> FirestoreDatabase | None:
    global _firestore_db
    if _firestore_db is None:
        try:
            _firestore_db = FirestoreDatabase()
        except Exception:
            _firestore_db = None
    return _firestore_db


@router.get("")
async def get_profile(user_id: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Retrieve the current user profile, career twin summary, and active AI persona."""
    profile = _user_profiles.get(user_id)
    if not profile:
        db = _get_firestore()
        if db:
            try:
                db_profile = db.get("profiles", user_id)
                if db_profile:
                    profile = db_profile
                    _user_profiles[user_id] = profile
            except Exception:
                pass

    if not profile:
        profile = {
            "username": user_id,
            "full_name": user_id.replace("_", " ").replace("-", " ").title(),
            "email": f"{user_id}@example.com",
            "target_role": "Software Engineer",
            "education": "",
            "graduation_year": "",
            "skills": [],
            "interests": "",
            "dream_companies": [],
            "bio": "",
        }
        _user_profiles[user_id] = profile

    # Attach live digital twin score if available
    state = career_states.get(user_id)
    twin_score = getattr(state, "digital_twin_score", None) if state else None

    return {
        "user_id": user_id,
        "profile": profile,
        "digital_twin_score": twin_score,
        "status": "success",
    }


@router.post("")
@router.put("")
async def update_profile(
    payload: ProfileData,
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update profile and synchronize with active CareerState and Firebase Firestore."""
    data = payload.dict()
    current = _user_profiles.get(user_id, {})
    current.update(data)
    _user_profiles[user_id] = current

    # Persist to Firebase Firestore
    db = _get_firestore()
    if db:
        try:
            db.create("profiles", user_id, current)
        except Exception:
            pass

    # Sync target_role with CareerState
    state = career_states.get(user_id)
    if state:
        setattr(state, "target_role", payload.target_role)

    return {
        "user_id": user_id,
        "profile": current,
        "message": "Profile updated successfully",
        "status": "success",
    }


@router.post("/ai-advisor")
async def ai_profile_advisor(
    payload: ProfileAdvisorRequest,
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Multi-Agent AI Pipeline:
    Takes raw student input -> AI diagnoses true career intent -> AI synthesizes roadmap ->
    AI refines into executive career persona with immediate actions.
    """
    profile = _user_profiles.get(user_id, {})
    agent = _get_agent()

    skills = payload.current_skills or profile.get("skills", [])
    education = payload.education or profile.get("education", "")
    interests = payload.interests or profile.get("interests", "")

    result = agent.analyze_and_refine_career_intent(
        raw_input=payload.raw_input,
        current_skills=skills,
        education=education,
        interests=interests,
    )

    # Cache AI persona to user profile
    if user_id in _user_profiles:
        _user_profiles[user_id]["ai_persona"] = result.get("executive_persona")

    return {
        "user_id": user_id,
        "raw_input": payload.raw_input,
        "intent_analysis": result.get("intent_analysis"),
        "roadmap": result.get("roadmap"),
        "executive_persona": result.get("executive_persona"),
        "status": "success",
    }


@router.post("/apply-ai-persona")
async def apply_ai_persona(
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """Apply the latest AI persona recommendations directly to the student profile."""
    profile = _user_profiles.get(user_id, {})
    persona = profile.get("ai_persona", {})

    if persona:
        if persona.get("target_role"):
            profile["target_role"] = persona["target_role"]
        if persona.get("top_priority_skills"):
            existing = set(profile.get("skills", []))
            for s in persona["top_priority_skills"]:
                existing.add(s)
            profile["skills"] = list(existing)

        # Sync with career state
        state = career_states.get(user_id)
        if state:
            setattr(state, "target_role", profile["target_role"])

    return {
        "user_id": user_id,
        "profile": profile,
        "message": "AI Persona successfully applied to active profile",
        "status": "success",
    }
