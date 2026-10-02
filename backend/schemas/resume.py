from pydantic import BaseModel, Field


class ResumeUploadResponse(BaseModel):
    resume_id: str
    user_id: str
    filename: str
    file_type: str
    page_count: int
    status: str
    storage_path: str


class ResumeAnalysisRequest(BaseModel):
    user_id: str
    target_role: str | None = None
    target_job_id: str | None = None


class ResumeAnalysisResponse(BaseModel):
    resume_score: float
    ats_score: float

    is_valid_resume: bool = True
    inferred_domain: str = "General Professional"
    contact_info: dict = Field(default_factory=dict)
    diagnostics: dict = Field(default_factory=dict)

    resume_skills: list[str] = Field(default_factory=list)
    resume_strengths: list[str] = Field(default_factory=list)
    resume_weaknesses: list[str] = Field(default_factory=list)

    missing_sections: list[str] = Field(default_factory=list)
    keyword_gaps: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)

    keyword_match: float = 0.0
    skill_match: float = 0.0
    experience_relevance: float = 0.0
    section_completeness: float = 0.0
    missing_keywords: list[str] = Field(default_factory=list)


class ATSAnalysisResponse(BaseModel):
    ats_score: float
    keyword_match: float
    skill_match: float
    experience_relevance: float
    section_completeness: float
    missing_keywords: list[str] = Field(default_factory=list)


class ResumeUpdateRequest(BaseModel):
    user_id: str
    target_role: str | None = None
    target_job_id: str | None = None
    skills: list[str] | None = None
    education: list[str] | None = None
    experience: list[str] | None = None
    projects: list[str] | None = None
    certifications: list[str] | None = None


class ATSAnalysisRequest(BaseModel):
    user_id: str
    job_id: str
    required_sections: list[str] | None = None
    weights: dict[str, float] | None = None


class ResumeDetailResponse(BaseModel):
    resume_id: str
    user_id: str
    filename: str
    file_type: str
    page_count: int
    status: str
    storage_path: str
    text: str = ""
    skills: list[str] = Field(default_factory=list)
    analysis: dict = Field(default_factory=dict)
    ats_analysis: dict = Field(default_factory=dict)
    created_at: str | None = None
    updated_at: str | None = None


class ResumeListResponse(BaseModel):
    resumes: list[ResumeUploadResponse]
    total: int


class CareerManagerResumeEnvelope(BaseModel):
    agent: str = "resume"
    status: str = "success"
    data: ResumeAnalysisResponse