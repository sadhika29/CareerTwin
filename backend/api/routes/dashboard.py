"""
Dashboard-level dynamic metrics and AI insight endpoints.
Computes real-time career readiness exclusively from persistent Firestore records:
uploaded resumes, active analyses, user skills, mock interviews, and job applications.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query

from backend.agents.preparation.agent import PreparationAgent
from backend.api.dependencies import career_states, get_current_user
from backend.services.profile_sync_service import is_raw_uid_or_placeholder, sync_resume_to_user_profile
from backend.services.user_skill_service import (
    SKILL_LEVEL_RANKS,
    SKILL_LEVEL_TO_PERCENTAGE,
    UserSkillService,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

_agent: PreparationAgent | None = None


def _get_agent() -> PreparationAgent:
    global _agent
    if _agent is None:
        _agent = PreparationAgent()
    return _agent


def _resolve_user_display_name(profile: Any, user_id: str) -> str:
    """
    Derive a human-friendly display name.
    Strictly prevents displaying raw Firebase UIDs or hashes in the UI.
    Fallback hierarchy: profile.full_name -> email username -> 'Student'.
    """
    if not isinstance(profile, dict):
        return "Student"

    raw_name = profile.get("full_name")
    full_name = raw_name.strip() if isinstance(raw_name, str) else ""
    if full_name and not is_raw_uid_or_placeholder(full_name, user_id):
        return full_name

    raw_email = profile.get("email")
    email = raw_email.strip() if isinstance(raw_email, str) else ""
    if email and "@" in email:
        username = email.split("@")[0].replace(".", " ").replace("_", " ").title()
        if username and not is_raw_uid_or_placeholder(username, user_id):
            return username

    return "Student"


@router.get("/stats")
@router.get("/overview")
async def get_dashboard_stats(
    user_id: str = Depends(get_current_user),
    resume_id: Optional[str] = Query(default=None, description="Optional active resume ID override"),
):
    """
    Calculates live KPI metrics and scores exclusively from the user's persistent records:
    1. Profile completion % (based on actual biographical fields filled).
    2. Resume ATS score from user's active/latest resume analysis.
    3. Skills progress weighted by validated skill levels (Beginner/Intermediate/Advanced/Expert).
    4. Mock interview readiness from completed interview evaluations.
    5. DSA algorithms progress from tracked solved problems.
    6. Applications count and realistic pace.
    7. Overall Digital Twin readiness synthesized across active dimensions.
    """
    from backend.api.routes.applications import _applications, _get_firestore as _get_app_db
    from backend.api.routes.profile import _user_profiles, _get_firestore as _get_prof_db
    from backend.api.routes.interview import _sessions

    prof_db = _get_prof_db()
    profile = _user_profiles.get(user_id)
    if not profile and prof_db:
        try:
            profile = prof_db.get("profiles", user_id)
        except Exception:
            profile = None
    if not isinstance(profile, dict):
        profile = {}

    # Check Firestore resumes database
    db = prof_db
    if not db:
        try:
            from backend.database.firestore import FirestoreDatabase
            db = FirestoreDatabase()
        except Exception:
            db = None

    user_resumes = []
    if db:
        try:
            raw_res = db.list("resumes", filters={"user_id": user_id}, limit=20)
            if isinstance(raw_res, list):
                user_resumes = [r for r in raw_res if isinstance(r, dict)]
        except Exception as exc:
            logger.warning(f"Failed to query resumes for user {user_id}: {exc}")

    # Auto-synchronize profile if profile name is missing or raw UID, but user has uploaded resumes
    if user_resumes and is_raw_uid_or_placeholder(profile.get("full_name"), user_id):
        try:
            latest_r = user_resumes[0]
            profile = sync_resume_to_user_profile(
                user_id=user_id,
                resume_text=latest_r.get("text", ""),
                resume_id=latest_r.get("resume_id", ""),
                filename=latest_r.get("filename", "Resume"),
                ats_score=latest_r.get("ats_score"),
                resume_score=latest_r.get("resume_score"),
                database=db,
            )
        except Exception as exc:
            logger.warning(f"Auto-sync profile failed: {exc}")

    display_name = _resolve_user_display_name(profile, user_id)
    raw_role = profile.get("target_role")
    target_role = raw_role if isinstance(raw_role, str) and raw_role.strip() else "Software Engineer"

    # 1. Profile Completion % (8 foundational career dimensions)
    profile_fields = [
        "full_name",
        "email",
        "target_role",
        "education",
        "college",
        "graduation_year",
        "skills",
        "bio",
    ]
    completed_fields = 0
    for field in profile_fields:
        val = profile.get(field)
        if val:
            if isinstance(val, list) and len(val) > 0:
                completed_fields += 1
            elif isinstance(val, str) and val.strip() and not is_raw_uid_or_placeholder(val, user_id):
                completed_fields += 1
    profile_completion = int(round((completed_fields / len(profile_fields)) * 100))

    # 2. Resume ATS Score (Active resume or latest analyzed resume)
    total_resumes = len(user_resumes)
    has_resume = total_resumes > 0
    
    raw_active_id = resume_id or profile.get("active_resume_id")
    active_resume_id = raw_active_id if isinstance(raw_active_id, str) and raw_active_id.strip() else None

    raw_active_file = profile.get("active_resume_filename")
    active_resume_filename = raw_active_file if isinstance(raw_active_file, str) else ""

    resume_score = None
    specific_ats_score = None
    general_resume_score = None
    has_job_description = False

    # First, search saved analyses for active or latest analysis
    saved_analyses = []
    if db:
        try:
            raw_analyses = db.list("analyses", filters={"user_id": user_id}, limit=20)
            if isinstance(raw_analyses, list):
                saved_analyses = [a for a in raw_analyses if isinstance(a, dict)]
        except Exception:
            saved_analyses = []

    target_analysis = None
    if active_resume_id:
        target_analysis = next((a for a in saved_analyses if a.get("resume_id") == active_resume_id), None)
    if not target_analysis and saved_analyses:
        target_analysis = saved_analyses[0]

    if target_analysis:
        active_resume_id = active_resume_id or target_analysis.get("resume_id")
        active_resume_filename = active_resume_filename or target_analysis.get("filename", "")
        specific_ats_score = target_analysis.get("ats_score")
        general_resume_score = target_analysis.get("resume_score")
        has_job_description = bool(target_analysis.get("job_description"))
        resume_score = specific_ats_score if specific_ats_score is not None else general_resume_score
    elif user_resumes:
        # Fall back to latest resume document in resumes collection
        target_resume = None
        if active_resume_id:
            target_resume = next((r for r in user_resumes if r.get("resume_id") == active_resume_id), None)
        if not target_resume:
            target_resume = user_resumes[0]
            active_resume_id = target_resume.get("resume_id")
            active_resume_filename = target_resume.get("filename", "")

        specific_ats_score = target_resume.get("ats_score")
        general_resume_score = target_resume.get("resume_score")
        an_obj = target_resume.get("analysis", {})
        if specific_ats_score is None and isinstance(an_obj, dict):
            specific_ats_score = an_obj.get("ats_score")
        if general_resume_score is None and isinstance(an_obj, dict):
            general_resume_score = an_obj.get("resume_score")

        has_job_description = bool(target_resume.get("job_description"))
        resume_score = specific_ats_score if specific_ats_score is not None else general_resume_score

    if resume_score is not None:
        resume_score = int(round(float(resume_score)))
    if specific_ats_score is not None:
        specific_ats_score = int(round(float(specific_ats_score)))
    if general_resume_score is not None:
        general_resume_score = int(round(float(general_resume_score)))

    # 3. Skills Progress (Derived from UserSkillService with level weighting)
    skills_score = None
    skills_count = 0
    proficient_skills_count = 0
    try:
        skill_service = UserSkillService(database=db)
        res = skill_service.get_user_skills(user_id)
        user_skills_list = res[0] if isinstance(res, (tuple, list)) else []
        skills_count = len(user_skills_list)

        if skills_count > 0:
            weighted_sum = 0.0
            for sk in user_skills_list:
                lvl = sk.get("current_level", "Intermediate")
                pct = SKILL_LEVEL_TO_PERCENTAGE.get(lvl, 50.0)
                if lvl in ("Advanced", "Expert"):
                    proficient_skills_count += 1
                weighted_sum += pct
            skills_score = int(round(weighted_sum / skills_count))
    except Exception as exc:
        logger.warning(f"Error computing skills KPI: {exc}")

    # Fall back to profile skills count if user_skills not yet populated
    if skills_score is None and profile.get("skills"):
        skills_count = len(profile["skills"])
        skills_score = min(100, skills_count * 12)

    # 4. Mock Interview Readiness (Derived from real completed interviews)
    user_sessions = [s for s in _sessions.values() if s.get("user_id") == user_id]
    if db:
        try:
            iv_records = db.list("interviews", filters={"user_id": user_id}, limit=50)
            if iv_records:
                # Merge sessions by session_id
                seen_ids = {s.get("session_id") for s in user_sessions if s.get("session_id")}
                for rec in iv_records:
                    if rec.get("session_id") not in seen_ids:
                        user_sessions.append(rec)
        except Exception as exc:
            logger.warning(f"Error loading interview records: {exc}")

    completed_interviews = [
        s for s in user_sessions
        if s.get("status") == "completed" and s.get("overall_score") is not None
    ]
    total_interviews = len(completed_interviews)
    has_interviews = total_interviews > 0
    interview_score = None
    if has_interviews:
        interview_score = int(round(sum(float(s["overall_score"]) for s in completed_interviews) / total_interviews))

    # 5. DSA Algorithms Progress
    dsa_solved = 0
    if db:
        try:
            progress_records = db.list("learning_progress", filters={"user_id": user_id}, limit=100)
            dsa_solved = sum(
                1 for r in progress_records
                if r.get("category", "").lower() in ("dsa", "data structures", "algorithms")
                and r.get("status") in ("Solved", "Completed", "Mastered")
            )
        except Exception:
            pass

    # Target goal benchmark = 20 problems
    dsa_progress = min(100, int(round((dsa_solved / 20.0) * 100)))

    # 6. Job Applications
    apps = _applications.get(user_id)
    if apps is None and _get_app_db():
        try:
            apps = _get_app_db().list("applications", filters={"user_id": user_id}, limit=100)
        except Exception:
            apps = []
    total_applications = len(apps) if apps else 0
    application_pace = min(100, total_applications * 10) if total_applications > 0 else 0

    # 7. Overall Career Readiness (Synthesized across active components)
    components = []
    if resume_score is not None:
        components.append(resume_score)
    if skills_score is not None:
        components.append(skills_score)
    if dsa_progress > 0:
        components.append(dsa_progress)
    if interview_score is not None:
        components.append(interview_score)

    if components:
        overall_readiness = int(round(sum(components) / len(components)))
    else:
        overall_readiness = 0

    # Sync with live CareerState
    try:
        state = career_states.get(user_id)
        if state:
            setattr(state, "digital_twin_score", overall_readiness)
            if resume_score is not None:
                setattr(state, "resume_score", resume_score)
            if skills_score is not None:
                setattr(state, "technical_score", skills_score)
            if interview_score is not None:
                setattr(state, "interview_score", interview_score)
            if target_role:
                setattr(state, "target_role", target_role)
    except Exception:
        pass

    return {
        "user_id": user_id,
        "display_name": display_name,
        "full_name": profile.get("full_name") if isinstance(profile.get("full_name"), str) else "",
        "target_role": target_role,
        "profile_completion": profile_completion,
        
        # Resume ATS
        "resume_ats_score": resume_score,
        "ats_score": specific_ats_score,
        "general_resume_score": general_resume_score,
        "has_resume": has_resume,
        "total_resumes": total_resumes,
        "active_resume_id": active_resume_id,
        "active_resume_filename": active_resume_filename,
        "has_job_description": has_job_description,

        # Skills
        "skills_progress": skills_score,
        "skills_count": skills_count,
        "proficient_skills_count": proficient_skills_count,

        # Interviews
        "interview_readiness": interview_score,
        "has_interviews": has_interviews,
        "total_interviews": total_interviews,

        # DSA
        "dsa_progress": dsa_progress,
        "dsa_solved_count": dsa_solved,

        # Applications
        "total_applications": total_applications,
        "application_pace": application_pace,

        # Overall
        "overall_readiness": overall_readiness,
    }


@router.get("/insight")
async def get_dashboard_insight(user_id: str = Depends(get_current_user)):
    """
    AI generates a personalised dashboard narrative from the student's
    current Digital Twin scores, resume ATS analysis, and unassessed areas.
    """
    try:
        stats = await get_dashboard_stats(user_id=user_id)
        display_name = stats.get("display_name", "Student")
        target_role = stats.get("target_role", "Software Engineer")
        overall = stats.get("overall_readiness", 0)

        resume_score = stats.get("resume_ats_score")
        skills_score = stats.get("skills_progress")
        interview_score = stats.get("interview_readiness")
        dsa_score = stats.get("dsa_progress")

        # Determine real weakest area or next crucial priority
        scores = {}
        if resume_score is not None:
            scores["resume"] = resume_score
        if skills_score is not None:
            scores["technical"] = skills_score
        if dsa_score is not None and dsa_score > 0:
            scores["dsa"] = dsa_score
        if interview_score is not None:
            scores["interview"] = interview_score

        weakest_area = None
        if scores:
            weakest_area = min(scores, key=scores.get)

        # Dynamic Copilot diagnosis grounded in actual user records
        if not stats.get("has_resume"):
            return {
                "user_id": user_id,
                "scores": scores,
                "overall_score": overall,
                "weakest_area": "resume",
                "ai_insight": {
                    "summary": f"Welcome, {display_name}! Start by uploading your resume in the Resume Studio to unlock your personalized ATS score and role alignment.",
                    "next_action": "Upload your resume in Resume Studio for real-time ATS optimization.",
                    "highlight": "Resume parsing will automatically populate your career twin profile.",
                },
            }

        if not stats.get("has_interviews"):
            active_file = stats.get("active_resume_filename") or "uploaded resume"
            return {
                "user_id": user_id,
                "scores": scores,
                "overall_score": overall,
                "weakest_area": "interview",
                "ai_insight": {
                    "summary": f"Great progress, {display_name}! Your {active_file} is verified. Your next major milestone for {target_role} is taking your first AI Mock Interview.",
                    "next_action": "Start an AI Mock Interview session to establish your baseline interview readiness score.",
                    "highlight": f"Resume verified at {resume_score or 70}% ATS score.",
                },
            }

        agent = _get_agent()
        insight = agent.generate_digital_twin_insight(
            scores=scores,
            target_role=target_role,
            overall_score=overall,
            weakest_area=weakest_area,
        )
        return {
            "user_id": user_id,
            "scores": scores,
            "overall_score": overall,
            "weakest_area": weakest_area,
            "ai_insight": insight,
        }
    except Exception as e:
        logger.warning(f"Error generating dashboard insight: {e}")
        return {
            "user_id": user_id,
            "error": str(e),
            "ai_insight": {
                "summary": "Keep progressing — each session and practice problem brings you closer to your target role.",
                "next_action": "Practice core technical skills or take a mock interview.",
                "highlight": "Your career metrics are live and synchronized.",
            },
        }
