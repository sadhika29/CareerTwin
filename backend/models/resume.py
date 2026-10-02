from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Resume:
    """Resume data stored for a career profile."""

    resume_id: str = ""
    user_id: str = ""
    filename: str = ""
    file_type: str = ""
    text: str = ""
    page_count: int = 0
    status: str = "pending"
    storage_path: str = ""
    skills: list[str] = field(default_factory=list)
    education: list[str] = field(default_factory=list)
    experience: list[str] = field(default_factory=list)
    projects: list[str] = field(default_factory=list)
    certifications: list[str] = field(default_factory=list)
    resume_score: float = 0.0
    ats_score: float = 0.0
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime | None = None
    updated_at: datetime | None = None