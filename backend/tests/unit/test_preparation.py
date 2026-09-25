from backend.agents.preparation.recommendation import build_preparation_recommendation


def test_preparation_recommendation_is_role_aware():
    result = build_preparation_recommendation(
        target_role="Software Engineer",
        skill_gaps=["Sliding Window", "Dynamic Programming"],
        current_skills=["Arrays", "SQL"],
        previous_performance={"weak_topics": ["Dynamic Programming", "System Design"]},
        available_time=90,
        target_job="SDE-2",
    )
    assert result["target_role"] == "Software Engineer"
    assert "Sliding Window" in result["priority_topics"]
    assert result["estimated_time"] <= 90
    assert result["reason"]
    assert result["practice_types"]
