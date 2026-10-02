"""
Tests for OpenWebNinja JSearch live job intelligence integration.
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.jsearch_client import JSearchClient
from backend.agents.jobs.agent import JobAgent

client = TestClient(app)


SAMPLE_RAW_JSEARCH_JOB = {
    "job_id": "jsearch_test_id_123",
    "job_title": "Senior Python Backend Engineer",
    "employer_name": "Apex Cloud Systems",
    "employer_logo": "https://example.com/logo.png",
    "employer_website": "https://example.com",
    "job_apply_link": "https://careers.example.com/apply/123",
    "job_description": "We are seeking a Senior Python Engineer experienced in FastAPI, PostgreSQL, Docker, and AWS.",
    "job_is_remote": True,
    "job_location": "Bengaluru, Karnataka, India",
    "job_city": "Bengaluru",
    "job_country": "IN",
    "job_posted_at_datetime_utc": "2026-10-01T12:00:00Z",
    "job_salary_string": "₹25,00,000 - ₹35,00,000 / year",
    "job_employment_type": "Full-time",
    "job_highlights": {
        "Qualifications": ["Bachelor's in Computer Science", "4+ years software development experience"],
        "Responsibilities": ["Architect scalable APIs", "Optimize SQL queries"],
    },
}


def test_jsearch_client_normalization():
    """Verify raw JSearch job payloads are accurately normalized into CareerTwin format."""
    jsearch = JSearchClient()
    norm = jsearch._normalize_job(SAMPLE_RAW_JSEARCH_JOB)

    assert norm["job_id"] == "jsearch_test_id_123"
    assert norm["title"] == "Senior Python Backend Engineer"
    assert norm["company"] == "Apex Cloud Systems"
    assert norm["is_remote"] is True
    assert norm["salary_range"] == "₹25,00,000 - ₹35,00,000 / year"
    assert norm["job_url"] == "https://careers.example.com/apply/123"

    # Skills should be dynamically extracted from description
    extracted = [s.lower() for s in norm["required_skills"] + norm["preferred_skills"]]
    assert any(s in extracted for s in ["python", "fastapi", "docker", "postgresql", "aws"])


@patch.object(JSearchClient, "search_jobs")
def test_job_agent_uses_live_jsearch_priority(mock_search):
    """Verify JobAgent.find_jobs_with_ai prioritizes live market JSearch listings."""
    mock_search.return_value = [
        {
            "job_id": "live_job_001",
            "title": "Full Stack Python Engineer",
            "company": "Live Enterprise",
            "location": "Remote",
            "job_url": "https://live.example.com/job/1",
            "description": "Building full stack apps with React and Python",
            "required_skills": ["Python", "React", "PostgreSQL"],
            "preferred_skills": ["Docker"],
            "experience_requirements": ["2+ years"],
            "qualifications": ["B.Tech CS"],
            "responsibilities": ["Develop features"],
            "keywords": ["Python", "React"],
            "salary_range": "Market Competitive",
            "work_type": "Full-time",
            "is_remote": True,
            "posted_at": "2026-10-01T00:00:00Z",
            "source": "OpenWebNinja JSearch (Live)",
            "is_live_external": True,
        }
    ]

    agent = JobAgent(llm_client=None)
    jobs = agent.find_jobs_with_ai(
        target_role="Full Stack Python Engineer",
        candidate_skills=["Python", "React"],
        location="Remote",
        count=2,
    )

    assert len(jobs) >= 1
    assert jobs[0]["company"] == "Live Enterprise"
    assert jobs[0]["is_live_external"] is True


@patch.object(JSearchClient, "search_jobs")
def test_live_search_api_route(mock_search):
    """Verify GET /api/v1/jobs/live/search endpoint returns structured live postings."""
    mock_search.return_value = [
        {
            "job_id": "j_live_123",
            "title": "Machine Learning Engineer",
            "company": "DeepTech Labs",
            "location": "Bengaluru",
            "job_url": "https://deeptech.ai/jobs/ml",
            "description": "PyTorch, CUDA, Python experience required.",
            "required_skills": ["Python", "PyTorch"],
            "preferred_skills": ["CUDA"],
        }
    ]

    res = client.get("/api/v1/jobs/live/search?query=Machine+Learning+Engineer&location=Bengaluru")
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "Machine Learning Engineer"
    assert data["count"] == 1
    assert data["jobs"][0]["company"] == "DeepTech Labs"
