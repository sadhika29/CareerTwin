from __future__ import annotations

from typing import Any, Dict, List


APTITUDE_TOPICS = [
    "Quantitative Aptitude",
    "Logical Reasoning",
    "Data Interpretation",
    "Probability",
    "Percentages",
    "Ratios",
    "Profit and Loss",
    "Time and Work",
    "Time, Speed and Distance",
    "Permutations and Combinations",
    "Number Systems",
]


def recommend_aptitude_topics(weak_topics: List[str] | None = None) -> List[Dict[str, Any]]:
    weak = {topic.strip() for topic in (weak_topics or []) if topic and topic.strip()}
    recommendations: List[Dict[str, Any]] = []
    for topic in APTITUDE_TOPICS:
        base = {
            "topic": topic,
            "difficulty": "medium",
            "reason": "Essential for aptitude rounds and problem-solving speed.",
            "estimated_time": 40,
            "practice_count": 3,
        }
        if topic in weak or topic in {"Percentages", "Ratios", "Probability", "Time and Work"}:
            base["difficulty"] = "medium"
            base["reason"] = "This topic appears in recent performance gaps and is frequently tested in hiring rounds."
            base["estimated_time"] = 50
            base["practice_count"] = 4
        recommendations.append(base)
    return recommendations[:5]
