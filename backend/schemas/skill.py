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


class UserSkillCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Skill name")
    category: str = Field(default="Programming Languages", description="Category")
    proficiency: float = Field(default=50.0, ge=0.0, le=100.0, description="Current proficiency %")
    target_proficiency: float = Field(default=80.0, ge=0.0, le=100.0, description="Target proficiency %")
    notes: str = Field(default="", max_length=500, description="Optional notes")
    learning_goal: str = Field(default="", max_length=500, description="Optional learning goal")


class UserSkillUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    category: str | None = None
    proficiency: float | None = Field(default=None, ge=0.0, le=100.0)
    target_proficiency: float | None = Field(default=None, ge=0.0, le=100.0)
    notes: str | None = None
    learning_goal: str | None = None


class UserSkillItem(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    proficiency: float
    target_proficiency: float
    proficiency_source: str = "self-assessed"
    notes: str = ""
    learning_goal: str = ""
    created_at: str
    updated_at: str


class UserSkillsSummary(BaseModel):
    total_skills: int
    proficient_skills: int
    skills_to_improve: int
    target_role: str


class UserSkillsResponse(BaseModel):
    skills: list[UserSkillItem]
    summary: UserSkillsSummary


class TargetRoleUpdateRequest(BaseModel):
    target_role: str = Field(..., min_length=1, max_length=100)


class LearningProgressItem(BaseModel):
    id: str
    user_id: str
    resource_id: str
    category: str
    topic: str
    title: str
    status: str
    notes: str = ""
    last_practiced_at: str | None = None
    completed_at: str | None = None
    created_at: str
    updated_at: str


class LearningProgressUpdateRequest(BaseModel):
    resource_id: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1)
    topic: str = Field(default="")
    title: str = Field(default="")
    status: str = Field(default="Not Started")  # Not Started, In Progress, Solved, Completed, Revision
    notes: str = Field(default="")


class LearningProgressResponse(BaseModel):
    progress: list[LearningProgressItem]
    progress_map: dict[str, LearningProgressItem]
    counts: dict[str, int]

