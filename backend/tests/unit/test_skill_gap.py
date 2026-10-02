from backend.services.skill_service import SkillService


def test_unit_skill_gap_calculation():
    service = SkillService()

    matched, gaps, score = service.compare_skills(
        current_skills=["py", "FastAPI"],
        required_skills=["Python", "FastAPI", "Docker", "System Design"],
    )

    assert "Python" in matched
    assert "FastAPI" in matched
    assert "Docker" in gaps
    assert "System Design" in gaps
    assert score == 50.0
