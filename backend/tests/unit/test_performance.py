from backend.agents.preparation.performance import analyze_performance


def test_performance_analysis_identifies_weak_and_strong_topics():
    attempts = [
        {"score": 80, "topic_scores": {"Arrays": 80, "SQL": 85}},
        {"score": 60, "topic_scores": {"Arrays": 60, "Dynamic Programming": 50}},
        {"score": 70, "topic_scores": {"Arrays": 75, "Dynamic Programming": 65}},
    ]
    result = analyze_performance(attempts)
    assert "Arrays" in result["strong_topics"]
    assert "Dynamic Programming" in result["weak_topics"] or "Dynamic Programming" in result["slow_topics"]
    assert result["trend"] in {"improving", "stable", "declining"}
