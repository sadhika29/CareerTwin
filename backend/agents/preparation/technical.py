from __future__ import annotations

from typing import Any, Dict, List

ROLE_TOPIC_MAP = {
    "software engineer": ["Data Structures", "Algorithms", "SQL", "System Design", "CS Fundamentals", "OOP"],
    "frontend developer": ["HTML", "CSS", "JavaScript", "React", "APIs", "State Management"],
    "backend developer": ["SQL", "APIs", "System Design", "Java", "Python", "Distributed Systems"],
    "data analyst": ["SQL", "Excel", "Statistics", "Python", "Power BI", "Data Visualization"],
}


def recommend_technical_topics(target_role: str, skill_gaps: List[str] | None = None) -> List[Dict[str, Any]]:
    gaps = {topic.strip() for topic in (skill_gaps or []) if topic and topic.strip()}
    base = ROLE_TOPIC_MAP.get(target_role.lower(), ROLE_TOPIC_MAP["software engineer"])
    topics: List[Dict[str, Any]] = []
    for topic in base:
        topics.append({
            "topic": topic,
            "reason": "Directly relevant to the target role and likely interview scope." if topic in gaps or topic in base[:3] else "Useful for improving role-specific depth.",
            "priority": "high" if topic in gaps or topic in base[:3] else "medium",
            "estimated_time": 60 if topic in gaps or topic in base[:3] else 45,
        })
    return topics[:5]
