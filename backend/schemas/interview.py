from enum import Enum
from pydantic import BaseModel, Field, field_validator


class InterviewFormat(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    HR = "hr"
    PROJECT = "project"
    SCENARIO = "scenario"
    RESUME_BASED = "resume_based"
    COMPANY_SPECIFIC = "company_specific"
    MULTIPLE_CHOICE = "multiple_choice"
    CODING = "coding"
    MIXED = "mixed"


class InterviewDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewExperienceLevel(str, Enum):
    FRESHER = "fresher"
    INTERMEDIATE = "intermediate"
    EXPERIENCED = "experienced"


class InterviewStartRequest(BaseModel):
    type: InterviewFormat
    target_role: str = Field(..., min_length=2, max_length=120)
    count: int = Field(..., ge=5, le=15)
    difficulty: InterviewDifficulty
    experience_level: InterviewExperienceLevel
    target_company: str | None = Field(default=None, max_length=120)
    resume_id: str | None = Field(default=None, max_length=200)
    job_description: str | None = Field(default=None, max_length=20000)

    @field_validator("target_role", "target_company")
    @classmethod
    def strip_text(cls, value):
        value = value.strip() if value is not None else value
        if value == "":
            return None if value is None else ""
        return value

    @field_validator("target_role")
    @classmethod
    def role_must_contain_text(cls, value):
        if not value:
            raise ValueError("Target role cannot be blank.")
        return value

    @field_validator("count")
    @classmethod
    def allowed_count(cls, value):
        if value not in (5, 10, 15):
            raise ValueError("Question count must be 5, 10, or 15.")
        return value

    @field_validator("job_description")
    @classmethod
    def strip_job_description(cls, value):
        value = value.strip() if value is not None else value
        return value or None


class InterviewAnswerRequest(BaseModel):
    question_id: str = Field(..., min_length=1, max_length=100)
    answer: str = Field(default="", max_length=20000)
    code: str = Field(default="", max_length=30000)
    selected_option: str | None = Field(default=None, max_length=20)
    skip: bool = False
