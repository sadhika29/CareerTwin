from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from backend.agents.preparation.recommendation import build_preparation_recommendation
from backend.api.dependencies import get_current_user
from backend.schemas.preparation import (
    AssessmentRequest,
    AssessmentResponse,
    AssessmentSubmission,
    PerformanceResponse,
    PreparationPlanRequest,
    PreparationPlanResponse,
    ReassessmentRequest,
)
from backend.services.preparation_service import (
    evaluate_assessment,
    generate_assessment,
    generate_preparation_plan,
    summarize_performance,
)

router = APIRouter(prefix="/api/v1/preparation", tags=["preparation"])


@router.post("/plan", response_model=PreparationPlanResponse)
async def create_plan(payload: PreparationPlanRequest, user_id: str = Depends(get_current_user)):
    plan = generate_preparation_plan(payload, user_id)
    return plan


@router.get("/today")
async def today_tasks(user_id: str = Depends(get_current_user)):
    return {
        "user_id": user_id,
        "tasks": [
            "Dynamic programming patterns · 30 min",
            "SQL joins practice · 25 min",
            "Tell me about yourself · 15 min",
        ],
    }


@router.get("/progress")
async def current_progress(user_id: str = Depends(get_current_user)):
    return {
        "user_id": user_id,
        "completion": 68,
        "weekly_sessions_completed": 4,
        "weekly_sessions_total": 6,
    }


@router.get("/weak-topics")
async def weak_topics(user_id: str = Depends(get_current_user)):
    return {
        "user_id": user_id,
        "weak_topics": ["Sliding Window", "Dynamic Programming", "System Design"],
    }


@router.post("/assessment", response_model=AssessmentResponse)
async def create_assessment(payload: AssessmentRequest, user_id: str = Depends(get_current_user)):
    payload.user_id = user_id
    return generate_assessment(payload)


@router.post("/assessment/submit")
async def submit_assessment(payload: AssessmentSubmission):
    # The caller provides the assessment data alongside the answer set. This endpoint verifies it and returns the score.
    assessment = generate_assessment(
        AssessmentRequest(
            user_id=payload.user_id,
            category="Technical",
            topic="General",
            difficulty="medium",
            number_of_questions=5,
            duration=30,
            target_role="Software Engineer",
        )
    )
    return evaluate_assessment(assessment, payload)


@router.post("/performance", response_model=PerformanceResponse)
async def performance_summary(attempts: List[Dict[str, Any]]):
    return summarize_performance(attempts)


@router.post("/reassess")
async def reassess(payload: ReassessmentRequest):
    improvement = payload.new_score - payload.previous_score
    return {
        "topic": payload.topic,
        "previous_score": payload.previous_score,
        "new_score": payload.new_score,
        "improvement": round(improvement, 2),
        "status": "improved" if improvement > 0 else "needs-focus",
    }


@router.post("/recommendation")
async def recommendation(payload: Dict[str, Any]):
    target_role = str(payload.get("target_role") or "Software Engineer")
    return build_preparation_recommendation(
        target_role=target_role,
        skill_gaps=payload.get("skill_gaps") or [],
        current_skills=payload.get("current_skills") or [],
        previous_performance=payload.get("previous_performance") or {},
        available_time=int(payload.get("available_time") or 60),
        target_job=payload.get("target_job"),
    )
