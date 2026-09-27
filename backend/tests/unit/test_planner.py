import pytest
from backend.agents.planner.service import recommend_improvement

def test_recommend_improvement():
    scores = {
        "resume": 80,
        "dsa": 60,
        "aptitude": 90,
        "communication": 75,
        "technical": 85,
        "interview": 65,
        "job_match": 80
    }
    recommendation = recommend_improvement(scores)
    assert recommendation is not None
    assert recommendation["recommended_area"] == "dsa"
    assert "estimated_score_after_improvement" in recommendation
