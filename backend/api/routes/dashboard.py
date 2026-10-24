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

        scores = {}
        overall_score = None
        weakest_area = None
        target_role = "Software Engineer"

        # Check firestore database for latest resume ATS score if state is unset
        db = None
        try:
            from backend.database.firestore import FirestoreDatabase
            db = FirestoreDatabase()
        except Exception:
            db = None

        resume_score = None
        if db:
            try:
                resumes = db.list("resumes", filters={"user_id": user_id}, limit=1)
                if resumes and len(resumes) > 0:
                    r = resumes[0]
                    resume_score = r.get("resume_score") or r.get("ats_score") or r.get("analysis", {}).get("resume_score")
            except Exception:
                pass

        if state:
            scores = {
                "resume": getattr(state, "resume_score", None) or resume_score,
                "job_match": getattr(state, "job_match_score", None),
                "dsa": getattr(state, "dsa_score", None),
                "aptitude": getattr(state, "aptitude_score", None),
                "technical": getattr(state, "technical_score", None),
                "communication": getattr(state, "communication_score", None),
                "interview": getattr(state, "interview_score", None),
            }
            overall_score = getattr(state, "digital_twin_score", None)
            target_role = getattr(state, "target_role", "Software Engineer") or "Software Engineer"
        elif resume_score is not None:
            scores["resume"] = resume_score

        # Identify weakest area
        valid_scores = {k: v for k, v in scores.items() if v is not None}
        if valid_scores:
            weakest_area = min(valid_scores, key=valid_scores.get)

        if not valid_scores:
            return {
                "user_id": user_id,
                "scores": {},
                "overall_score": None,
                "weakest_area": None,
                "ai_insight": {
                    "summary": "Welcome to CareerTwin! Upload your resume and take an assessment to generate your personalized Career Twin insight.",
                    "next_action": "Upload your resume in the Resume Studio or start a skill assessment.",
                    "highlight": "Your journey begins today!",
                },
            }

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


@router.get("/stats")
@router.get("/overview")
async def get_dashboard_stats(user_id: str = Depends(get_current_user)):
    """
    Calculates live KPI metrics and scores exclusively from the user's persistent records:
    - Profile completion %
    - Resume ATS score from uploaded resume
    - Skills progress from verified assessment or profile skills
    - Interview readiness from completed interview evaluations
    - Total job applications count
    """
    from backend.api.routes.applications import _applications, _get_firestore as _get_app_db
    from backend.api.routes.profile import _user_profiles, _get_firestore as _get_prof_db
    from backend.api.routes.interview import _sessions
    from backend.api.routes.preparation import _user_test_reports

    # 1. Profile Completion
    prof_db = _get_prof_db()
    profile = _user_profiles.get(user_id)
    if not profile and prof_db:
        try:
            profile = prof_db.get("profiles", user_id)
        except Exception:
            profile = None
    profile = profile or {}

    profile_fields = ["full_name", "email", "target_role", "education", "graduation_year", "skills", "bio"]
    completed_fields = 0
    for field in profile_fields:
        val = profile.get(field)
        if val and (not isinstance(val, list) or len(val) > 0):
            completed_fields += 1
    profile_completion = int(round((completed_fields / len(profile_fields)) * 100)) if profile_fields else 0

    # 2. Resume ATS Score
    resume_score = None
    total_resumes = 0
    try:
        from backend.database.firestore import FirestoreDatabase
        db = FirestoreDatabase()
        resumes = db.list("resumes", filters={"user_id": user_id}, limit=10)
        total_resumes = len(resumes)
        if resumes:
            latest = resumes[0]
            resume_score = latest.get("resume_score") or latest.get("ats_score") or latest.get("analysis", {}).get("resume_score")
            if resume_score is not None:
                resume_score = int(round(float(resume_score)))
    except Exception:
        pass

    # 3. Interview Readiness
    user_sessions = [s for s in _sessions.values() if s.get("user_id") == user_id]
    if not user_sessions:
        try:
            from backend.database.firestore import FirestoreDatabase
            iv_db = FirestoreDatabase()
            iv_records = iv_db.list("interviews", filters={"user_id": user_id})
            if iv_records:
                user_sessions = iv_records
        except Exception:
            pass

    completed_interviews = [s for s in user_sessions if s.get("status") == "completed" and s.get("overall_score") is not None]
    interview_score = None
    if completed_interviews:
        interview_score = int(round(sum(s["overall_score"] for s in completed_interviews) / len(completed_interviews)))

    # 4. Assessment Reports / Skills Progress
    reports = _user_test_reports.get(user_id, [])
    if not reports:
        try:
            from backend.database.firestore import FirestoreDatabase
            asmt_db = FirestoreDatabase()
            asmt_records = asmt_db.list("assessments", filters={"user_id": user_id})
            if asmt_records:
                reports = asmt_records
        except Exception:
            pass

    technical_reports = [r for r in reports if r.get("score") is not None]
    skills_score = None
    if technical_reports:
        skills_score = int(round(sum(r["score"] for r in technical_reports) / len(technical_reports)))
    elif len(profile.get("skills", [])) > 0:
        skills_score = min(100, len(profile["skills"]) * 12)

    # 5. Applications Count
    app_db = _get_app_db()
    apps = _applications.get(user_id)
    if apps is None and app_db:
        try:
            apps = app_db.list("applications", filters={"user_id": user_id})
        except Exception:
            apps = []
    total_applications = len(apps) if apps else 0

    # 6. Overall Digital Twin Readiness
    state = career_states.get(user_id)
    twin_score = getattr(state, "digital_twin_score", None) if state else None

    return {
        "user_id": user_id,
        "profile_completion": profile_completion,
        "resume_ats_score": resume_score,
        "skills_progress": skills_score,
        "interview_readiness": interview_score,
        "total_applications": total_applications,
        "total_resumes": total_resumes,
        "overall_readiness": twin_score,
        "skills_count": len(profile.get("skills", [])),
    }
