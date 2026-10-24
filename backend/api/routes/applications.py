"""
Job Applications Management and AI Application Coach.
Allows tracking job opportunities and uses multi-agent AI to generate tailored pitches,
recruiter talking points, company-specific interview prep, and action checklists.
"""
from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.agents.preparation.agent import PreparationAgent
from backend.api.dependencies import get_current_user
from backend.api.routes.profile import _user_profiles

router = APIRouter(prefix="/api/v1/applications", tags=["applications"])

_agent: PreparationAgent | None = None


def _get_agent() -> PreparationAgent:
    global _agent
    if _agent is None:
        _agent = PreparationAgent()
    return _agent


class CreateApplicationRequest(BaseModel):
    company: str
    role: str
    location: Optional[str] = "Remote"
    status: Optional[str] = "Saved"  # Saved, Applied, Interviewing, Offer, Rejected
    job_id: Optional[str] = None
    notes: Optional[str] = None
    salary: Optional[str] = "$110k - $135k"
    url: Optional[str] = None
    description: Optional[str] = None


class UpdateApplicationRequest(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    next_step: Optional[str] = None
    interview_date: Optional[str] = None


class GenerateStrategyRequest(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None


from backend.database.firestore import FirestoreDatabase

# Storage for applications per user with Firebase Firestore persistence
_applications: Dict[str, List[Dict[str, Any]]] = {}
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
async def get_applications(user_id: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Retrieve all tracked applications and aggregate analytics with Firestore support."""
    apps = _applications.get(user_id)
    if apps is None:
        # Load from Firestore
        db = _get_firestore()
        if db:
            try:
                records = db.list("applications", filters={"user_id": user_id})
                if records:
                    apps = sorted(records, key=lambda x: x.get("created_at", x.get("date", "")), reverse=True)
            except Exception:
                pass
        if apps is None:
            apps = []
        _applications[user_id] = apps

    total = len(apps)
    interviewing = sum(1 for a in apps if a.get("status") == "Interviewing")
    applied = sum(1 for a in apps if a.get("status") == "Applied")
    saved = sum(1 for a in apps if a.get("status") == "Saved")
    offers = sum(1 for a in apps if a.get("status") == "Offer")

    return {
        "user_id": user_id,
        "applications": apps,
        "stats": {
            "total": total,
            "interviewing": interviewing,
            "applied": applied,
            "saved": saved,
            "offers": offers,
            "response_rate": round(((interviewing + offers) / max(applied + interviewing + offers, 1)) * 100),
        },
        "status": "success",
    }


@router.post("")
async def create_application(
    payload: CreateApplicationRequest,
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """Add a new job application to tracker and persist in Firestore."""
    apps = _applications.setdefault(user_id, [])

    # Prevent duplicates: if an application already exists for this job_id, update it
    if payload.job_id:
        existing = next((a for a in apps if a.get("job_id") == payload.job_id), None)
        if existing:
            existing["status"] = payload.status or "Applied"
            if payload.notes:
                existing["notes"] = payload.notes
            if payload.url:
                existing["url"] = payload.url
            db = _get_firestore()
            if db:
                try:
                    db.update("applications", f"{user_id}_{existing['id']}", existing)
                except Exception:
                    pass

            # Sync with JobInteractionService if applied
            if existing.get("status") in ("Applied", "Interviewing", "Offer"):
                try:
                    from backend.services.job_interaction_service import JobInteractionService
                    JobInteractionService().record_application(
                        user_id=user_id,
                        job_id=payload.job_id,
                        application_id=existing["id"],
                        job_data={
                            "title": existing.get("role"),
                            "company": existing.get("company"),
                            "location": existing.get("location"),
                            "job_url": existing.get("url"),
                        },
                    )
                except Exception:
                    pass

            return {
                "user_id": user_id,
                "application": existing,
                "message": "Existing application updated successfully",
                "status": "success",
            }

    new_app = {
        "id": f"app-{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "job_id": payload.job_id,
        "company": payload.company,
        "role": payload.role,
        "location": payload.location or "Remote",
        "status": payload.status or "Saved",
        "date": time.strftime("%Y-%m-%d"),
        "created_at": time.time(),
        "salary": payload.salary or "Competitive",
        "notes": payload.notes or "Added to CareerTwin tracker.",
        "next_step": "Review role requirements and tailor profile.",
        "match_score": 80,
        "description": payload.description or f"Role at {payload.company}",
        "url": payload.url,
    }
    apps.insert(0, new_app)

    # Persist in Firebase Firestore
    db = _get_firestore()
    if db:
        try:
            doc_id = f"{user_id}_{new_app['id']}"
            db.create("applications", doc_id, new_app)
        except Exception:
            pass

    # Sync with JobInteractionService if applied or job_id provided
    if payload.job_id and (payload.status in ("Applied", "Interviewing", "Offer") or not payload.status):
        try:
            from backend.services.job_interaction_service import JobInteractionService
            JobInteractionService().record_application(
                user_id=user_id,
                job_id=payload.job_id,
                application_id=new_app["id"],
                job_data={
                    "title": payload.role,
                    "company": payload.company,
                    "location": payload.location,
                    "job_url": payload.url,
                },
            )
        except Exception:
            pass

    return {
        "user_id": user_id,
        "application": new_app,
        "message": "Application added successfully",
        "status": "success",
    }


@router.patch("/{app_id}")
async def update_application(
    app_id: str,
    payload: UpdateApplicationRequest,
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """Update application status, notes, or next interview step in Firestore."""
    apps = _applications.setdefault(user_id, [])
    target = next((a for a in apps if a["id"] == app_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Application not found")

    if payload.status:
        target["status"] = payload.status
    if payload.notes is not None:
        target["notes"] = payload.notes
    if payload.next_step is not None:
        target["next_step"] = payload.next_step
    if payload.interview_date is not None:
        target["interview_date"] = payload.interview_date

    # Update in Firestore
    db = _get_firestore()
    if db:
        try:
            doc_id = f"{user_id}_{app_id}"
            db.update("applications", doc_id, target)
        except Exception:
            pass

    return {
        "user_id": user_id,
        "application": target,
        "message": "Application updated",
        "status": "success",
    }


@router.delete("/{app_id}")
async def delete_application(
    app_id: str,
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """Remove application from tracker and Firestore."""
    apps = _applications.setdefault(user_id, [])
    initial_len = len(apps)
    _applications[user_id] = [a for a in apps if a["id"] != app_id]

    if len(_applications[user_id]) == initial_len:
        raise HTTPException(status_code=404, detail="Application not found")

    # Delete from Firestore
    db = _get_firestore()
    if db:
        try:
            doc_id = f"{user_id}_{app_id}"
            db.delete("applications", doc_id)
        except Exception:
            pass

    return {
        "user_id": user_id,
        "message": "Application removed",
        "status": "success",
    }


@router.post("/{app_id}/ai-strategy")
async def generate_app_ai_strategy(
    app_id: str,
    payload: Optional[GenerateStrategyRequest] = None,
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    AI Application Strategy Coach:
    Generates company-tailored cover letter pitch, recruiter talking points,
    anticipated technical/behavioral interview questions, and prep checklist.
    """
    apps = _applications.setdefault(user_id, [])
    target = next((a for a in apps if a["id"] == app_id), None)

    company = (payload.company if payload and payload.company else target.get("company")) if target else "Tech Company"
    role = (payload.role if payload and payload.role else target.get("role")) if target else "Software Engineer"
    description = (payload.description if payload and payload.description else target.get("description")) if target else None

    # Retrieve candidate profile skills
    profile = _user_profiles.get(user_id, {})
    from backend.api.dependencies import career_states
    user_state = career_states.get(user_id)
    skills = profile.get("skills") or getattr(user_state, "skills", None) or []

    agent = _get_agent()
    strategy = agent.generate_application_strategy(
        company=company,
        job_title=role,
        job_description=description,
        candidate_skills=skills,
        candidate_profile=profile,
    )

    # Attach strategy to application
    if target:
        target["ai_strategy"] = strategy

    return {
        "user_id": user_id,
        "application_id": app_id,
        "strategy": strategy,
        "status": "success",
    }
