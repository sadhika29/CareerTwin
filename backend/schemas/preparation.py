from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class DailyTask(BaseModel):
    day: int
    tasks: List[str] = Field(default_factory=list)


class PreparationPlanRequest(BaseModel):
    user_id: str = Field(min_length=1)
    target_role: str = Field(min_length=1)
    target_job: Optional[str] = None
    target_job_id: Optional[str] = None
    current_skills: List[str] = Field(default_factory=list)
    skill_gaps: List[str] = Field(default_factory=list)
    digital_twin_state: Dict[str, Any] = Field(default_factory=dict)
    previous_performance: Dict[str, Any] = Field(default_factory=dict)
    available_time: int = Field(default=60, ge=15, le=600)
    target_date: Optional[datetime] = None

    @field_validator("target_role")
    @classmethod
    def validate_target_role(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Target role is required")
        return value.strip()


class PreparationPlanResponse(BaseModel):
    user_id: str
    target_role: str
    target_job_id: Optional[str] = None
    priority_topics: List[str] = Field(default_factory=list)
    daily_plan: List[DailyTask] = Field(default_factory=list)
    reason: str = ""
    estimated_time: int = 0
    practice_types: List[str] = Field(default_factory=list)
    expected_outcomes: List[str] = Field(default_factory=list)


class AssessmentRequest(BaseModel):
    user_id: str = Field(min_length=1)
    category: str = Field(min_length=1)
    topic: Optional[str] = None
    difficulty: str = Field(default="medium")
    number_of_questions: int = Field(default=5, ge=1, le=20)
    duration: int = Field(default=30, ge=5, le=180)
    target_role: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        valid = {"DSA", "Aptitude", "Technical", "Communication"}
        if value not in valid:
            raise ValueError(f"Category must be one of {sorted(valid)}")
        return value


class AssessmentQuestion(BaseModel):
    question_id: str
    category: str
    topic: str
    difficulty: str
    question: str
    options: List[str] = Field(default_factory=list)
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    problem_statement: Optional[str] = None
    constraints: Optional[str] = None
    sample_input: Optional[str] = None
    sample_output: Optional[str] = None
    expected_concept: Optional[str] = None


class AssessmentResponse(BaseModel):
    assessment_id: str
    user_id: str
    category: str
    topic: Optional[str] = None
    difficulty: str
    questions: List[AssessmentQuestion] = Field(default_factory=list)
    duration: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AssessmentSubmission(BaseModel):
    assessment_id: str
    user_id: str = Field(min_length=1)
    answers: Dict[str, Any] = Field(default_factory=dict)
    time_taken: int = Field(default=0, ge=0)


class QuestionEvaluation(BaseModel):
    question_id: str
    category: str = "Technical"
    topic: str = "General"
    difficulty: str = "medium"
    question: str
    options: List[str] = Field(default_factory=list)
    user_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    status: str = "skipped"  # "passed", "failed", "skipped"
    explanation: Optional[str] = None


class TestReportResponse(BaseModel):
    assessment_id: str
    user_id: str
    category: str = "Technical"
    score: float = 0.0
    accuracy: float = 0.0
    total_questions: int = 0
    correct_answers: int = 0  # passed
    incorrect_answers: int = 0  # failed
    unattempted: int = 0  # skipped
    time_taken: int = 0
    weak_topics: List[str] = Field(default_factory=list)
    topic_wise_performance: Dict[str, float] = Field(default_factory=dict)
    question_results: List[QuestionEvaluation] = Field(default_factory=list)
    skipped_questions: List[Dict[str, Any]] = Field(default_factory=list)
    failed_questions: List[Dict[str, Any]] = Field(default_factory=list)
    passed_questions: List[Dict[str, Any]] = Field(default_factory=list)
    remediation_tasks: List[str] = Field(default_factory=list)
    status: str = "submitted"
    completed_at: datetime = Field(default_factory=datetime.utcnow)


class PerformanceResponse(BaseModel):
    strong_topics: List[str] = Field(default_factory=list)
    weak_topics: List[str] = Field(default_factory=list)
    slow_topics: List[str] = Field(default_factory=list)
    trend: str = "stable"
    score: Optional[float] = None
    total_assessments: int = 0
    total_passed: int = 0
    total_failed: int = 0
    total_skipped: int = 0


class ReassessmentRequest(BaseModel):
    previous_score: float = Field(ge=0, le=100)
    new_score: float = Field(ge=0, le=100)
    topic: str = Field(min_length=1)
    accuracy_change: Optional[float] = None
    time_change: Optional[float] = None


class ReattemptIncompleteRequest(BaseModel):
    user_id: str = Field(min_length=1)
    assessment_id: str = Field(min_length=1)
    category: str = Field(default="Technical")
    include_skipped: bool = True
    include_failed: bool = True
    specific_question_ids: Optional[List[str]] = None

