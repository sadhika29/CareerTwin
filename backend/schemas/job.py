from pydantic import BaseModel, Field, HttpUrl


class JobCreateRequest(BaseModel):
    user_id: str
    title: str
    company: str = ""
    location: str = ""
    job_url: HttpUrl | None = None
    description: str

    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    experience_requirements: list[str] = Field(default_factory=list)
    qualifications: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)


class JobResponse(BaseModel):
    job_id: str
    user_id: str

    title: str
    company: str
    location: str

    job_url: str
    description: str

    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    experience_requirements: list[str] = Field(default_factory=list)
    qualifications: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)

    work_arrangement: str | None = None
    employment_type: str | None = None
    experience_level: str | None = None
    industry: str | None = None
    salary_range: str | None = None
    source: str | None = None
    source_badge: str | None = None
    employer_logo: str | None = None
    posting_date: str | None = None
    last_synchronized_at: str | None = None

    created_at: str | None = None
    updated_at: str | None = None


class JobAnalysisRequest(BaseModel):
    user_id: str
    target_role: str | None = None


class JobAnalysisResponse(BaseModel):
    job_id: str
    job_title: str
    company: str
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    experience_requirements: list[str] = Field(default_factory=list)
    qualifications: list[str] = Field(default_factory=list)
    responsibilities: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    summary: str = ""


class JobEligibilityResponse(BaseModel):
    eligible: bool
    matched_requirements: list[str] = Field(default_factory=list)
    missing_requirements: list[str] = Field(default_factory=list)
    details: dict = Field(default_factory=dict)


class JobMatchWeights(BaseModel):
    required_skills: float = 0.40
    preferred_skills: float = 0.20
    education: float = 0.15
    experience: float = 0.15
    role_alignment: float = 0.10


class JobMatchRequest(BaseModel):
    user_id: str
    resume_id: str | None = None
    candidate_skills: list[str] = Field(default_factory=list)
    education: str | None = None
    experience_years: float | None = None
    target_role: str | None = None
    weights: JobMatchWeights | None = None
    title: str | None = None
    company: str | None = None
    location: str | None = None
    description: str | None = None
    required_skills: list[str] = Field(default_factory=list)
    job_url: str | None = None


class JobMatchResponse(BaseModel):
    job_id: str
    job_match_score: float
    skill_match: float
    education_match: float
    experience_match: float
    role_alignment: float
    eligible: bool
    matched_skills: list[str] = Field(default_factory=list)
    missing_skills: list[str] = Field(default_factory=list)
    missing_requirements: list[str] = Field(default_factory=list)
    details: dict = Field(default_factory=dict)
    resume_id: str | None = None
    resume_filename: str | None = None
    evaluated_at: str | None = None


class JobListResponse(BaseModel):
    jobs: list[JobResponse]
    total: int


class AISearchJobsRequest(BaseModel):
    user_id: str
    target_role: str | None = None
    candidate_skills: list[str] = Field(default_factory=list)
    experience_years: float | None = None
    location: str | None = None
    query: str | None = None
    count: int = 4
    save_to_db: bool = True


class AIJobMatchResponse(BaseModel):
    job_id: str
    match_score: float
    eligibility_status: str
    selection_likelihood: str
    matched_skills: list[str] = Field(default_factory=list)
    missing_required_skills: list[str] = Field(default_factory=list)
    missing_preferred_skills: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    detailed_reasoning: str = ""
