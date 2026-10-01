"""
Dashboard-level AI endpoint — generates a personalised insight narrative
about the student's current career readiness state.
"""
from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Depends

from backend.agents.preparation.agent import PreparationAgent
from backend.api.dependencies import career_states, firebase_service, get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

_agent: PreparationAgent | None = None


def _get_agent() -> PreparationAgent:
    global _agent
    if _agent is None:
        _agent = PreparationAgent()
    return _agent


@router.get("/insight")
async def get_dashboard_insight(user_id: str = Depends(get_current_user)):
    """
    AI generates a personalised dashboard narrative from the student's
    current Digital Twin scores — explaining their position, what to do next,
    and what their biggest opportunity is.
    """
    try:
        state = career_states.get(user_id)
        scores = {}
        overall_score = None
        weakest_area = None
        target_role = "Software Engineer"

        if state:
            scores = {
                "resume": getattr(state, "resume_score", None),
                "job_match": getattr(state, "job_match_score", None),
                "dsa": getattr(state, "dsa_score", None),
                "aptitude": getattr(state, "aptitude_score", None),
                "technical": getattr(state, "technical_score", None),
                "communication": getattr(state, "communication_score", None),
                "interview": getattr(state, "interview_score", None),
            }
            overall_score = getattr(state, "digital_twin_score", None)
            target_role = getattr(state, "target_role", "Software Engineer") or "Software Engineer"

        # Identify weakest area
        valid_scores = {k: v for k, v in scores.items() if v is not None}
        if valid_scores:
            weakest_area = min(valid_scores, key=valid_scores.get)

        agent = _get_agent()
        insight = agent.generate_digital_twin_insight(
            scores=valid_scores,
            target_role=target_role,
            overall_score=overall_score,
            weakest_area=weakest_area,
        )
        return {
            "user_id": user_id,
            "scores": valid_scores,
            "overall_score": overall_score,
            "weakest_area": weakest_area,
            "ai_insight": insight,
        }
    except Exception as e:
        return {
            "user_id": user_id,
            "error": str(e),
            "ai_insight": {
                "summary": "Keep progressing — each session brings you closer to your goal.",
                "next_action": "Complete your profile and take your first assessment.",
                "highlight": "You're just getting started!",
            },
        }
