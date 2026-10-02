from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Skill:
    """Skill catalog model representing technology and domain skills."""

    skill_id: str = ""
    name: str = ""
    category: str = ""  # e.g., "Languages", "Frameworks", "Cloud", "Databases", "Concepts"
    aliases: list[str] = field(default_factory=list)
    description: str = ""
    difficulty: str = "medium"  # beginner, intermediate, advanced
    related_skills: list[str] = field(default_factory=list)
    prerequisites: list[str] = field(default_factory=list)

    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime | None = None
    updated_at: datetime | None = None
