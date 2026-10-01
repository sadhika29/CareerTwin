from enum import Enum
from pydantic import BaseModel, Field


class PriorityLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class SkillItem(BaseModel):
    skill_id: str
    name: str
    category: str = "General"
    difficulty: str = "medium"
    aliases: list[str] = Field(default_factory=list)
    description: str = ""


class SkillGapItem(BaseModel):
    skill_id: str = ""
    skill_name: str
    priority: PriorityLevel
    category: str = "General"
    target_role: str = ""
    reason: str = ""
    prerequisites: list[str] = Field(default_factory=list)


class SkillAnalysisRequest(BaseModel):
    user_id: str
    current_skills: list[str] = Field(default_factory=list)
    resume_skills: list[str] = Field(default_factory=list)
    target_role: str | None = None
    target_job_id: str | None = None
    job_required_skills: list[str] | None = None


class SkillAnalysisResponse(BaseModel):
    current_skills: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    skill_gaps: list[str] = Field(default_factory=list)
    skill_gap_score: float = 0.0
    priority_skills: list[SkillGapItem] = Field(default_factory=list)
    learning_recommendations: list[str] = Field(default_factory=list)


class SkillGapRequest(BaseModel):
    user_id: str
    current_skills: list[str] = Field(default_factory=list)
    job_required_skills: list[str] = Field(default_factory=list)
    target_role: str | None = None


class SkillGapResponse(BaseModel):
    current_skills: list[str] = Field(default_factory=list)
    required_skills: list[str] = Field(default_factory=list)
    matched_skills: list[str] = Field(default_factory=list)
    skill_gaps: list[str] = Field(default_factory=list)
    priority_skills: list[SkillGapItem] = Field(default_factory=list)
    skill_gap_score: float = 0.0


class SkillCatalogResponse(BaseModel):
    skills: list[SkillItem]
    total: int


class CareerManagerSkillEnvelope(BaseModel):
    agent: str = "skill"
    status: str = "success"
    data: SkillAnalysisResponse
