from __future__ import annotations

from typing import Any, Dict, List, Optional


ROLE_TOPIC_MAP = {
    "software engineer": [
        "Arrays",
        "Strings",
        "Hashing",
        "Sliding Window",
        "SQL",
        "System Design",
        "JavaScript",
        "React",
    ],
    "frontend developer": ["HTML", "CSS", "JavaScript", "React", "State Management", "APIs"],
    "data analyst": ["SQL", "Python", "Statistics", "Power BI", "Excel", "Data Visualization"],
    "backend developer": ["SQL", "APIs", "System Design", "Java", "Data Structures", "Caching"],
}

GENERIC_TOPICS = [
    "Arrays",
    "Strings",
    "Hashing",
    "SQL",
    "Dynamic Programming",
    "Communication",
    "Problem Solving",
]


def build_preparation_recommendation(
    *,
    target_role: str,
    skill_gaps: Optional[List[str]] = None,
    current_skills: Optional[List[str]] = None,
    previous_performance: Optional[Dict[str, Any]] = None,
    available_time: int = 60,
    target_job: Optional[str] = None,
) -> Dict[str, Any]:
    """Return a role-aware preparation recommendation with rationale and next steps."""
    gaps = [topic for topic in (skill_gaps or []) if topic]
    if not gaps:
        gaps = list(ROLE_TOPIC_MAP.get(target_role.lower(), {})) if isinstance(ROLE_TOPIC_MAP.get(target_role.lower(), {}), list) else []
        if not gaps:
            gaps = list(GENERIC_TOPICS)
    combined = list(dict.fromkeys(gaps + (current_skills or []) + (previous_performance or {}).get("weak_topics", [])))
    role_topics = ROLE_TOPIC_MAP.get(target_role.lower(), [])
    topics = [
        topic
        for topic in (role_topics + combined + GENERIC_TOPICS)
        if topic and topic not in {"", None}
    ]
    ordered = list(dict.fromkeys(topics))[:6]
    planned_time = max(30, min(available_time, 180))
    return {
        "target_role": target_role,
        "priority_topics": ordered,
        "daily_plan": [
            {
                "day": 1,
                "tasks": [
                    f"Complete {ordered[0]} review and solve 3 focused problems",
                    f"Practice {ordered[1] if len(ordered) > 1 else ordered[0]} in timed mode",
                ],
            },
            {
                "day": 2,
                "tasks": [
                    f"Revisit {ordered[2] if len(ordered) > 2 else ordered[0]} and record weak points",
                    "Prepare a short verbal explanation for your current strength area",
                ],
            },
            {
                "day": 3,
                "tasks": [
                    f"Solve a mixed set of questions covering {', '.join(ordered[:3])}",
                    "Complete a 15-minute reflection on speed, clarity, and mistakes",
                ],
            },
        ],
        "reason": (
            f"{target_role} preparation should prioritize the largest skill gaps and the topics most relevant to the target job "
            f"({target_job or 'current role'}), while keeping the plan realistic for a {planned_time}-minute study block."
        ),
        "estimated_time": planned_time,
        "practice_types": ["Coding drills", "Timed problem sessions", "Communication rehearsal"],
        "expected_outcomes": [
            "Faster recall of core concepts",
            "Stronger accuracy on weak topics",
            "More confidence in interviews and tests",
        ],
    }
