from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AgentResult(BaseModel):
    agent: str
    status: str = "success"
    data: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None


class CareerState(BaseModel):
    """
    Shared state for the Career Manager LangGraph workflow.
    Supports both Pydantic attribute access and dictionary serialization.
    """
    user_id: str = ""
    target_role: Optional[str] = None
    target_job_id: Optional[str] = None

    # Profile & Resume
    profile: Dict[str, Any] = Field(default_factory=dict)
    resume_analysis: Dict[str, Any] = Field(default_factory=dict)

    # Job & Skills
    job_analysis: Dict[str, Any] = Field(default_factory=dict)
    skills: List[str] = Field(default_factory=list)
    skill_gaps: List[str] = Field(default_factory=list)

    # Scores
    job_match_score: Optional[float] = None
    resume_score: Optional[float] = None
    dsa_score: Optional[float] = None
    aptitude_score: Optional[float] = None
    communication_score: Optional[float] = None
    technical_score: Optional[float] = None
    interview_score: Optional[float] = None
    digital_twin_score: Optional[float] = None

    # Execution context
    pipeline_stage: str = "created"
    performance_history: List[Dict[str, Any]] = Field(default_factory=list)

    # Outcomes
    recommendations: List[str] = Field(default_factory=list)
    next_action: Optional[str] = None
    errors: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentRequest(BaseModel):
    user_id: str
    target_role: Optional[str] = None
    target_job_id: Optional[str] = None
    request: str = "full career analysis"
    data: Dict[str, Any] = Field(default_factory=dict)

