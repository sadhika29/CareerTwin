from unittest.mock import MagicMock
from backend.services.job_service import JobService


def test_job_service_match_logic():
    mock_db = MagicMock()
    mock_db.get.return_value = {
        "job_id": "job_unit_1",
        "user_id": "u1",
        "title": "Backend Python Engineer",
        "required_skills": ["Python", "FastAPI"],
        "preferred_skills": ["Docker"],
        "experience_requirements": ["1 year"],
        "qualifications": ["Bachelor's degree"],
    }
    service = JobService(database=mock_db)

    result = service.calculate_job_match(
        job_id="job_unit_1",
        user_id="u1",
        candidate_skills=["Python", "FastAPI", "Docker"],
        education="Bachelor's degree in CS",
        experience_years=2.0,
        target_role="Backend Python Engineer",
    )

    assert result["job_match_score"] == 100.0
    assert result["eligible"] is True
    assert "Python" in result["matched_skills"]
