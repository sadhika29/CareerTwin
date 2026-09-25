from __future__ import annotations

from typing import Any, Dict, List


DSA_TOPICS = [
    "Arrays",
    "Strings",
    "Hashing",
    "Two Pointers",
    "Sliding Window",
    "Stack",
    "Queue",
    "Linked List",
    "Binary Search",
    "Trees",
    "Graphs",
    "Recursion",
    "Backtracking",
    "Dynamic Programming",
    "Greedy",
]


def recommend_dsa_topics(skill_gaps: List[str] | None = None, target_role: str = "Software Engineer") -> List[Dict[str, Any]]:
    gaps = {topic.strip() for topic in (skill_gaps or []) if topic and topic.strip()}
    recommended: List[Dict[str, Any]] = []
    for topic in DSA_TOPICS:
        priority = "high" if topic in gaps or topic in {"Arrays", "Strings", "Hashing", "Sliding Window", "Dynamic Programming"} else "medium"
        recommended.append({
            "topic": topic,
            "difficulty": "medium" if topic not in {"Dynamic Programming", "Graphs", "Trees"} else "hard",
            "reason": "Core interview and coding skill relevant to the target role and current weak areas." if priority == "high" else "Supports broader problem-solving depth and interview readiness.",
            "estimated_time": 60 if priority == "high" else 45,
            "prerequisites": ["Basic arrays and loops", "Pattern recognition"] if topic in {"Sliding Window", "Two Pointers"} else ["Core fundamentals"],
            "practice_count": 5 if priority == "high" else 3,
        })
    return recommended[:6]
