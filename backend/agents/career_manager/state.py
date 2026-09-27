from typing import TypedDict, Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CareerState(TypedDict, total=False):
    """
    Shared state for the Career Manager LangGraph workflow.
    """
    user_id: str
    target_role: Optional[str]
    target_job_id: Optional[str]
    
    # Profile & Resume
    profile: Optional[Dict[str, Any]]
    resume_analysis: Optional[Dict[str, Any]]
    
    # Job & Skills
    job_analysis: Optional[Dict[str, Any]]
    skills: Optional[List[str]]
    skill_gaps: Optional[List[str]]
    
    # Scores
    job_match_score: Optional[float]
    resume_score: Optional[float]
    dsa_score: Optional[float]
    aptitude_score: Optional[float]
    communication_score: Optional[float]
    technical_score: Optional[float]
    interview_score: Optional[float]
    digital_twin_score: Optional[float]
    
    # Execution context
    pipeline_stage: Optional[str]
    performance_history: Optional[List[Dict[str, Any]]]
    
    # Outcomes
    recommendations: Optional[List[str]]
    next_action: Optional[str]
    errors: Optional[List[str]]
    metadata: Optional[Dict[str, Any]]
