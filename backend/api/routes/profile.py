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
    full_name: str = "Navya Sharma"
    username: str = "navya"
    email: str = "navya@example.com"
    target_role: str = "Full Stack Engineer"
    education: str = "B.Tech Computer Science & Engineering"
    graduation_year: str = "2027"
    skills: List[str] = Field(default_factory=lambda: ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git"])
    interests: str = "Scalable cloud distributed systems, modern AI-native applications, web performance"
    dream_companies: List[str] = Field(default_factory=lambda: ["Google", "Stripe", "Microsoft", "Atlassian"])
    bio: str = "Passionate engineering student building high-performance web applications and mastering distributed systems."


class ProfileAdvisorRequest(BaseModel):
    raw_input: str
    target_role: Optional[str] = None
    education: Optional[str] = None
    interests: Optional[str] = None
    current_skills: Optional[List[str]] = None


# In-memory storage for user profiles with rich default demo-student profile
_user_profiles: Dict[str, Dict[str, Any]] = {
    "demo-student": {
        "full_name": "Navya Sharma",
        "username": "navya",
        "email": "navya@example.com",
        "target_role": "Full Stack Engineer",
        "education": "B.Tech Computer Science & Engineering",
        "graduation_year": "2027",
        "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
        "interests": "Scalable cloud distributed systems, modern AI-native applications, web performance",
        "dream_companies": ["Google", "Stripe", "Microsoft", "Atlassian"],
        "bio": "Passionate engineering student building high-performance web applications and mastering distributed systems.",
        "ai_persona": {
            "career_persona_title": "Aspiring Full Stack & Cloud Systems Engineer",
            "executive_summary": "High-potential software engineering student combining strong Python/React full-stack acumen with deep passion for distributed cloud architecture. Actively preparing for top-tier software engineering roles.",
            "elevator_pitch": "I build robust, full-stack web applications with Python, FastAPI, and React, focusing on resilient system architecture and seamless user experiences.",
            "predicted_target_role": "Full Stack Engineer",
            "top_priority_skills": ["System Design", "Docker", "PostgreSQL", "FastAPI", "React"],
            "immediate_actions": [
                {"action": "Simulate technical architecture mock interview", "impact": "Critical", "timeframe": "This week"},
                {"action": "Complete Docker containerization project", "impact": "High", "timeframe": "Next 7 days"}
            ]
        }
    }
}


@router.get("")
async def get_profile(user_id: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Retrieve the current user profile, career twin summary, and active AI persona."""
    profile = _user_profiles.get(user_id)
    if not profile:
        profile = dict(_user_profiles["demo-student"])
        profile["username"] = user_id
        profile["email"] = f"{user_id}@example.com"
        _user_profiles[user_id] = profile

    # Attach live digital twin score if available
    state = career_states.get(user_id)
    twin_score = getattr(state, "digital_twin_score", None) if state else 76

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
    """Update profile and synchronize with active CareerState."""
    data = payload.dict()
    current = _user_profiles.get(user_id, {})
    current.update(data)
    _user_profiles[user_id] = current

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
    profile = _user_profiles.get(user_id, _user_profiles["demo-student"])
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
    profile = _user_profiles.get(user_id, _user_profiles["demo-student"])
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
