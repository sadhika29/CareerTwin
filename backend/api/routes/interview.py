"""
Interview API routes — powered entirely by PreparationAgent (LLM).
The AI generates role-specific questions, evaluates answers, and provides
detailed coaching feedback. No static question bank.
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException

from backend.agents.preparation.agent import PreparationAgent
from backend.api.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/interview", tags=["interview"])

_agent: PreparationAgent | None = None


def _get_agent() -> PreparationAgent:
    global _agent
    if _agent is None:
        _agent = PreparationAgent()
    return _agent


# ---------------------------------------------------------------------------
# START INTERVIEW — AI generates contextual questions
# ---------------------------------------------------------------------------

@router.post("/start")
async def start_interview(
    payload: Dict[str, Any],
    user_id: str = Depends(get_current_user),
):
    """
    User provides round type (technical/project/HR) and target role.
    The AI generates fresh, role-specific interview questions.
    """
    round_type = str(payload.get("type") or payload.get("round_type") or "technical")
    target_role = str(payload.get("target_role") or "Software Engineer")
    count = int(payload.get("count") or 5)
    difficulty = str(payload.get("difficulty") or "medium")
    skills = payload.get("skills") or []

    try:
        agent = _get_agent()
        questions = agent.generate_interview_questions(
            target_role=target_role,
            round_type=round_type,
            count=count,
            skills=skills,
            difficulty=difficulty,
        )
        session_id = f"iv-{uuid.uuid4().hex[:10]}"
        return {
            "session_id": session_id,
            "user_id": user_id,
            "target_role": target_role,
            "round_type": round_type,
            "questions": questions,
            "status": "in_progress",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI interview generation failed: {str(e)}")


# ---------------------------------------------------------------------------
# SUBMIT ANSWER — AI evaluates and gives coaching feedback
# ---------------------------------------------------------------------------

@router.post("/{session_id}/answer")
async def submit_answer(
    session_id: str,
    payload: Dict[str, Any],
    user_id: str = Depends(get_current_user),
):
    """
    Student submits an answer to an interview question.
    The AI evaluates it and returns detailed coaching feedback.
    """
    question = payload.get("question", "")
    question_type = payload.get("question_type", "technical")
    candidate_answer = payload.get("answer", "")
    target_role = str(payload.get("target_role") or "Software Engineer")
    expected_key_points = payload.get("expected_key_points")

    if not candidate_answer:
        raise HTTPException(status_code=400, detail="answer is required")

    try:
        agent = _get_agent()
        evaluation = agent.evaluate_interview_answer(
            question=question,
            question_type=question_type,
            candidate_answer=candidate_answer,
            target_role=target_role,
            expected_key_points=expected_key_points,
        )
        return {
            "session_id": session_id,
            "user_id": user_id,
            "evaluation": evaluation,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI answer evaluation failed: {str(e)}")


# ---------------------------------------------------------------------------
# INTERVIEW RESULT — aggregate session score + narrative feedback
# ---------------------------------------------------------------------------

@router.get("/{session_id}/result")
async def get_interview_result(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Returns a summary of the interview session.
    In production, this would load per-answer evaluations from Firestore.
    """
    return {
        "session_id": session_id,
        "user_id": user_id,
        "status": "completed",
        "message": "Interview complete. Submit individual answers to receive detailed AI coaching feedback.",
    }


# ---------------------------------------------------------------------------
# INTERVIEW HISTORY
# ---------------------------------------------------------------------------

@router.get("/history")
async def get_interview_history(user_id: str = Depends(get_current_user)):
    """Returns past interview sessions for the user."""
    # In production this would be fetched from Firestore.
    return {
        "user_id": user_id,
        "sessions": [],
    }
