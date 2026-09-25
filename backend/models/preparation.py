from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PreparationPlanModel(BaseModel):
    plan_id: str = Field(default_factory=str)
    user_id: str
    target_role: str
    target_job_id: Optional[str] = None
    skill_gaps: List[str] = Field(default_factory=list)
    priority_topics: List[str] = Field(default_factory=list)
    daily_tasks: List[Dict[str, Any]] = Field(default_factory=list)
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
    status: str = "planned"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AssessmentModel(BaseModel):
    assessment_id: str
    user_id: str
    category: str
    topic: Optional[str] = None
    difficulty: str = "medium"
    questions: List[Dict[str, Any]] = Field(default_factory=list)
    duration: int = 30
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AssessmentAttemptModel(BaseModel):
    attempt_id: str
    assessment_id: str
    user_id: str
    answers: Dict[str, Any] = Field(default_factory=dict)
    score: float = 0.0
    accuracy: float = 0.0
    time_taken: int = 0
    weak_topics: List[str] = Field(default_factory=list)
    completed_at: datetime = Field(default_factory=datetime.utcnow)
