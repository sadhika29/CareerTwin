from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Job:
    """Job posting data used for career and resume analysis."""

    job_id: str = ""
    user_id: str = ""

    title: str = ""
    company: str = ""
    location: str = ""

    job_url: str = ""
    description: str = ""

    required_skills: list[str] = field(default_factory=list)
    preferred_skills: list[str] = field(default_factory=list)

    experience_requirements: list[str] = field(default_factory=list)
    qualifications: list[str] = field(default_factory=list)
    responsibilities: list[str] = field(default_factory=list)

    keywords: list[str] = field(default_factory=list)

    eligibility: dict[str, Any] = field(default_factory=dict)
    source: str = ""
    source_url: str = ""

    metadata: dict[str, Any] = field(default_factory=dict)


    created_at: datetime | None = None
    updated_at: datetime | None = None