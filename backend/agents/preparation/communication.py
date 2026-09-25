from __future__ import annotations

from typing import Any, Dict, List


COMMUNICATION_TOPICS = [
    "Grammar",
    "Vocabulary",
    "Reading comprehension",
    "Speaking",
    "Professional communication",
    "Email writing",
    "Group discussion",
    "HR communication",
]


def recommend_communication_topics() -> List[Dict[str, Any]]:
    return [
        {
            "topic": topic,
            "goal": "Build clarity and confidence in structured communication.",
            "suggestion": "Practice 5-minute speaking drills, read aloud, and summarize ideas in a single paragraph.",
            "estimated_time": 20,
        }
        for topic in COMMUNICATION_TOPICS
    ][:6]
