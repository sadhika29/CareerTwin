import pytest
from unittest.mock import MagicMock

from backend.services.job_parser import parse_job_description
from backend.services.job_service import JobService


@pytest.fixture
def mock_job_service():
    mock_db = MagicMock()
    service = JobService(database=mock_db)
    return service, mock_db


def test_parse_job_description_basic():
    description = """
    Software Engineer at TechCorp.
    Required Skills:
    - Python
    - FastAPI
    - PostgreSQL
    Preferred Skills:
    - Docker
    - AWS
    Experience:
    - 2+ years of experience
    Qualifications:
    - B.Tech in Computer Science
    """
    parsed = parse_job_description(description, title="Software Engineer", company="TechCorp")

    assert parsed["title"] == "Software Engineer"
    assert parsed["company"] == "TechCorp"
    assert "Python" in parsed["required_skills"]
    assert "FastAPI" in parsed["required_skills"]
    assert "Docker" in parsed["preferred_skills"]
    assert len(parsed["experience_requirements"]) > 0
    assert len(parsed["qualifications"]) > 0


def test_parse_empty_job_description():
    with pytest.raises(ValueError, match="cannot be empty"):
        parse_job_description("")


def test_job_service_check_eligibility(mock_job_service):
    service, mock_db = mock_job_service

    mock_db.get.return_value = {
        "job_id": "job_101",
        "user_id": "user_1",
        "title": "Backend Engineer",
        "required_skills": ["Python", "FastAPI", "SQL"],
        "preferred_skills": ["Docker"],
        "experience_requirements": ["2+ years of experience"],
        "qualifications": ["B.Tech in Computer Science"],
    }

    # Case 1: Fully eligible candidate
    res1 = service.check_eligibility(
        job_id="job_101",
        user_id="user_1",
        education="B.Tech Computer Science",
        experience_years=3.0,
        candidate_skills=["Python", "FastAPI", "SQL", "Git"],
    )
    assert res1["eligible"] is True
    assert len(res1["missing_requirements"]) == 0
    assert len(res1["matched_requirements"]) >= 2

    # Case 2: Ineligible due to insufficient experience
    res2 = service.check_eligibility(
        job_id="job_101",
        user_id="user_1",
        education="B.Tech Computer Science",
        experience_years=0.5,
        candidate_skills=["Python", "FastAPI", "SQL"],
    )
    assert res2["eligible"] is False
    assert any("Experience" in m for m in res2["missing_requirements"])


def test_calculate_job_match_score(mock_job_service):
    service, mock_db = mock_job_service

    mock_db.get.return_value = {
        "job_id": "job_101",
        "user_id": "user_1",
        "title": "Backend Engineer",
        "required_skills": ["Python", "FastAPI", "SQL", "Docker"],
        "preferred_skills": ["Kubernetes", "Redis"],
        "experience_requirements": ["2 years"],
        "qualifications": ["B.Tech in Computer Science"],
    }

    # Candidate matches 3 of 4 required skills (75%), 1 of 2 preferred (50%), 100% education, 100% exp
    result = service.calculate_job_match(
        job_id="job_101",
        user_id="user_1",
        candidate_skills=["Python", "FastAPI", "SQL", "Kubernetes"],
        education="B.Tech Computer Science",
        experience_years=2.5,
        target_role="Backend Engineer",
    )

    assert result["job_id"] == "job_101"
    assert result["skill_match"] == 75.0
    assert result["education_match"] == 100.0
    assert result["experience_match"] == 100.0
    assert result["role_alignment"] == 100.0
    assert "Python" in result["matched_skills"]
    assert "Docker" in result["missing_skills"]
    assert result["job_match_score"] > 70.0
