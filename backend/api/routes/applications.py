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


# In-memory storage for applications seeded with initial real-world examples
_applications: Dict[str, List[Dict[str, Any]]] = {
    "demo-student": [
        {
            "id": "app-1",
            "company": "Northstar Labs",
            "role": "Frontend Engineer",
            "location": "Bengaluru or Remote",
            "status": "Interviewing",
            "date": "2026-09-24",
            "salary": "$115k - $135k",
            "notes": "Technical screening cleared. Next round: Systems Architecture & React Performance.",
            "next_step": "System design round scheduled for Thursday",
            "match_score": 88,
            "description": "Building high-performance design system and web platform components using React, TypeScript, and modern browser standards."
        },
        {
            "id": "app-2",
            "company": "TechNova Systems",
            "role": "Full Stack Engineer",
            "location": "Remote",
            "status": "Applied",
            "date": "2026-09-28",
            "salary": "$120k - $140k",
            "notes": "Applied with AI-tailored resume via referral.",
            "next_step": "Awaiting recruiter response",
            "match_score": 82,
            "description": "Developing FastAPI and PostgreSQL microservices with React frontends in an agile cloud ecosystem."
        },
        {
            "id": "app-3",
            "company": "Orbit Systems",
            "role": "Product Engineer",
            "location": "San Francisco / Remote",
            "status": "Saved",
            "date": "2026-09-29",
            "salary": "$130k - $155k",
            "notes": "High growth startup in enterprise developer tools.",
            "next_step": "Tailor resume before submitting application",
            "match_score": 75,
            "description": "Collaborate with designers and founders to ship user-facing products with React and distributed cloud backends."
        },
        {
            "id": "app-4",
            "company": "Fieldwork AI",
            "role": "Cloud Platform Engineer",
            "location": "Bengaluru",
            "status": "Offer",
            "date": "2026-09-15",
            "salary": "$125k + Equity",
            "notes": "Received written offer! Reviewing compensation package.",
            "next_step": "Respond with negotiation parameters by Monday",
            "match_score": 92,
            "description": "Scale Kubernetes, Docker pipelines, and automated cloud workflows."
        }
    ]
}


@router.get("")
async def get_applications(user_id: str = Depends(get_current_user)) -> Dict[str, Any]:
    """Retrieve all tracked applications and aggregate analytics."""
    apps = _applications.get(user_id)
    if apps is None:
        apps = list(_applications["demo-student"])
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
    """Add a new job application to tracker."""
    apps = _applications.setdefault(user_id, [])

    new_app = {
        "id": f"app-{uuid.uuid4().hex[:8]}",
        "company": payload.company,
        "role": payload.role,
        "location": payload.location or "Remote",
        "status": payload.status or "Saved",
        "date": time.strftime("%Y-%m-%d"),
        "salary": payload.salary or "Competitive",
        "notes": payload.notes or "Added to CareerTwin tracker.",
        "next_step": "Review role requirements and tailor profile.",
        "match_score": 80,
        "description": payload.description or f"Role at {payload.company}",
        "url": payload.url,
    }
    apps.insert(0, new_app)

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
    """Update application status, notes, or next interview step."""
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
    """Remove application from tracker."""
    apps = _applications.setdefault(user_id, [])
    initial_len = len(apps)
    _applications[user_id] = [a for a in apps if a["id"] != app_id]

    if len(_applications[user_id]) == initial_len:
        raise HTTPException(status_code=404, detail="Application not found")

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
    profile = _user_profiles.get(user_id, _user_profiles["demo-student"])
    skills = profile.get("skills", ["Python", "React", "FastAPI", "PostgreSQL", "Docker"])

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
