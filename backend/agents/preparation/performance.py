from __future__ import annotations

from typing import Any, Dict, List


def analyze_performance(attempts: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not attempts:
        return {
            "strong_topics": [],
            "weak_topics": [],
            "slow_topics": [],
            "trend": "stable",
        }

    scores_by_topic: Dict[str, List[float]] = {}
    for attempt in attempts:
        topic_scores = attempt.get("topic_scores") or {}
        for topic, score in topic_scores.items():
            scores_by_topic.setdefault(topic, []).append(float(score))

    strong_topics = [
        topic for topic, values in scores_by_topic.items() if values and sum(values) / len(values) >= 70
    ]
    weak_topics = [
        topic for topic, values in scores_by_topic.items() if values and sum(values) / len(values) < 60
    ]
    slow_topics = weak_topics[:3]

    recent = [float(attempt.get("score", 0) or 0) for attempt in attempts[-3:]]
    previous = [float(attempt.get("score", 0) or 0) for attempt in attempts[:-3]] if len(attempts) > 3 else recent
    trend = "stable"
    if previous:
        trend = "improving" if sum(recent) / len(recent) > sum(previous) / len(previous) else "declining"

    return {
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
        "slow_topics": slow_topics,
        "trend": trend,
    }
