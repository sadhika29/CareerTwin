from unittest.mock import patch
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_job_create_and_match_api():
    job_payload = {
        "user_id": "usr_test",
        "title": "Backend Python Developer",
        "company": "Apex Corp",
        "location": "Remote",
        "description": "We need Python and FastAPI developers.",
        "required_skills": ["Python", "FastAPI"],
        "preferred_skills": ["Docker"],
        "experience_requirements": ["1 year"],
        "qualifications": ["Bachelor's"],
    }

    with patch("backend.services.job_service.FirestoreDatabase.create") as mock_create:
        mock_create.return_value = "job_123"

        resp = client.post("/api/v1/jobs", json=job_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Backend Python Developer"

    # Match test
    with patch("backend.services.job_service.FirestoreDatabase.get") as mock_get:
        mock_get.return_value = {
            "job_id": "job_123",
            "user_id": "usr_test",
            "title": "Backend Python Developer",
            "required_skills": ["Python", "FastAPI"],
            "preferred_skills": ["Docker"],
            "experience_requirements": ["1 year"],
            "qualifications": ["Bachelor's"],
            "responsibilities": [],
            "keywords": [],
        }

        match_req = {
            "user_id": "usr_test",
            "candidate_skills": ["Python", "FastAPI", "Docker"],
            "education": "Bachelor's",
            "experience_years": 1.5,
            "target_role": "Backend Python Developer",
        }
        match_resp = client.post("/api/v1/jobs/job_123/match", json=match_req)
        assert match_resp.status_code == 200
        assert match_resp.json()["job_match_score"] == 100.0
