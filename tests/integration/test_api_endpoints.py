import io
from unittest.mock import patch
from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_get_skills_catalog():
    response = client.get("/api/v1/skills")
    assert response.status_code == 200
    data = response.json()
    assert "skills" in data
    assert data["total"] > 0
    names = [s["name"] for s in data["skills"]]
    assert "Python" in names
    assert "System Design" in names


def test_analyze_skills_endpoint():
    payload = {
        "user_id": "test_user_1",
        "current_skills": ["Python", "FastAPI"],
        "job_required_skills": ["Python", "FastAPI", "Docker", "System Design"],
        "target_role": "Backend Engineer",
    }
    response = client.post("/api/v1/skills/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "matched_skills" in data
    assert "skill_gaps" in data
    assert "Python" in data["matched_skills"]
    assert "System Design" in data["skill_gaps"]
    assert data["skill_gap_score"] == 50.0
    assert len(data["priority_skills"]) >= 2


def test_detect_skill_gaps_endpoint():
    payload = {
        "user_id": "test_user_1",
        "current_skills": ["js", "react"],
        "job_required_skills": ["JavaScript", "React", "TypeScript", "Node.js"],
        "target_role": "Frontend Developer",
    }
    response = client.post("/api/v1/skills/gaps", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "matched_skills" in data
    assert "JavaScript" in data["matched_skills"]
    assert "React" in data["matched_skills"]
    assert "TypeScript" in data["skill_gaps"]


def test_parse_job_endpoint():
    payload = {
        "user_id": "test_user_1",
        "title": "Software Engineer",
        "company": "Enterprise Corp",
        "location": "Remote",
        "description": "Responsibilities: Develop backend systems. Requirements: Python, FastAPI, SQL. Preferred: Docker. Experience: 2 years.",
    }
    with patch("backend.services.job_service.FirestoreDatabase.create") as mock_create:
        mock_create.return_value = "job_mock_id"
        response = client.post("/api/v1/jobs/parse", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Software Engineer"
        assert "Python" in data["required_skills"]
        assert "Docker" in data["preferred_skills"]


def test_job_match_and_eligibility_endpoints():
    mock_job_doc = {
        "job_id": "job_sample_1",
        "user_id": "test_user_1",
        "title": "Backend Software Engineer",
        "company": "Tech Corp",
        "location": "Remote",
        "job_url": "",
        "description": "Backend role",
        "required_skills": ["Python", "FastAPI", "SQL"],
        "preferred_skills": ["Docker"],
        "experience_requirements": ["2 years"],
        "qualifications": ["B.Tech Computer Science"],
        "responsibilities": [],
        "keywords": ["Python", "FastAPI"],
    }

    with patch("backend.services.job_service.FirestoreDatabase.get") as mock_get:
        mock_get.return_value = mock_job_doc

        # Test Match
        match_payload = {
            "user_id": "test_user_1",
            "candidate_skills": ["Python", "FastAPI", "SQL", "Docker"],
            "education": "B.Tech Computer Science",
            "experience_years": 2.0,
            "target_role": "Backend Software Engineer",
        }
        resp_match = client.post("/api/v1/jobs/job_sample_1/match", json=match_payload)
        assert resp_match.status_code == 200
        data_match = resp_match.json()
        assert data_match["job_match_score"] == 100.0
        assert data_match["eligible"] is True

        # Test Eligibility
        resp_elig = client.post("/api/v1/jobs/job_sample_1/eligibility", json=match_payload)
        assert resp_elig.status_code == 200
        data_elig = resp_elig.json()
        assert data_elig["eligible"] is True
        assert len(data_elig["matched_requirements"]) >= 2
