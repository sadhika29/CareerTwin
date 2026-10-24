"""
Tests for Himalayas Remote Jobs API integration.
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.himalayas_client import HimalayasClient
from backend.agents.jobs.agent import JobAgent

client = TestClient(app)

SAMPLE_RAW_HIMALAYAS_JOB = {
    "title": "Senior Staff Python Engineer",
    "companyName": "Distributed Cloud AI",
    "companyLogo": "https://himalayas.app/company-logo.png",
    "applicationLink": "https://himalayas.app/jobs/apply/senior-staff-python-engineer",
    "excerpt": "Build high-throughput Python microservices with FastAPI, Redis, Docker, and AWS.",
    "description": "<p>We are seeking a Senior Staff Python Engineer experienced with FastAPI, Redis, Docker, and AWS.</p>",
    "locationRestrictions": ["Worldwide"],
    "minSalary": 150000,
    "maxSalary": 195000,
    "currency": "USD",
    "salaryPeriod": "yearly",
    "employmentType": "full-time",
    "seniority": "Senior",
    "categories": ["Software Development", "Backend"],
    "guid": "himalayas_guid_test_999",
    "pubDate": 1729699200
}


def test_himalayas_client_normalization():
    """Verify raw Himalayas job payloads are properly normalized into CareerTwin format."""
    client_instance = HimalayasClient()
    norm = client_instance._normalize_job(SAMPLE_RAW_HIMALAYAS_JOB)

    assert norm["job_id"] == "himalayas_himalayas_guid_test_999"
    assert norm["title"] == "Senior Staff Python Engineer"
    assert norm["company"] == "Distributed Cloud AI"
    assert norm["employer_logo"] == "https://himalayas.app/company-logo.png"
    assert norm["is_remote"] is True
    assert "Remote" in norm["location"]
    assert norm["salary_range"] == "$150,000 - $195,000 USD/yearly"
    assert norm["job_url"] == "https://himalayas.app/jobs/apply/senior-staff-python-engineer"
    assert norm["source"] == "Himalayas Remote Jobs (Live)"
    assert norm["is_live_external"] is True

    # Check skill extraction
    extracted = [s.lower() for s in norm["required_skills"] + norm["preferred_skills"]]
    assert any(s in extracted for s in ["python", "fastapi", "docker", "redis", "aws"])


@patch.object(HimalayasClient, "search_jobs")
def test_himalayas_search_endpoint(mock_search):
    """Verify /api/v1/jobs/himalayas/search returns formatted results."""
    mock_search.return_value = [
        {
            "job_id": "himalayas_test_01",
            "title": "Remote React Engineer",
            "company": "FrontEnd Co",
            "location": "Remote (Worldwide)",
            "required_skills": ["React", "TypeScript"],
            "preferred_skills": ["Tailwind"],
            "salary_range": "$120,000 - $140,000 / yearly",
            "job_url": "https://example.com/apply",
            "source": "Himalayas Remote Jobs (Live)",
            "is_live_external": True,
        }
    ]

    response = client.get("/api/v1/jobs/himalayas/search?query=React&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "himalayas"
    assert len(data["jobs"]) == 1
    assert data["jobs"][0]["title"] == "Remote React Engineer"


@patch.object(HimalayasClient, "search_jobs")
def test_job_agent_incorporates_himalayas(mock_search):
    """Verify JobAgent includes verified Himalayas remote jobs."""
    mock_search.return_value = [
        {
            "job_id": "himalayas_ai_01",
            "title": "AI Engineer (Remote)",
            "company": "Cognitive Scale",
            "location": "Remote",
            "required_skills": ["Python", "PyTorch", "FastAPI"],
            "preferred_skills": ["LangChain"],
            "salary_range": "$160,000 - $200,000 / yearly",
            "job_url": "https://himalayas.app/jobs/test",
            "source": "Himalayas Remote Jobs (Live)",
            "is_live_external": True,
        }
    ]

    agent = JobAgent()
    results = agent.find_jobs_with_ai(
        candidate_skills=["Python", "FastAPI"],
        target_role="AI Engineer",
        location="Remote"
    )

    assert isinstance(results, list)
    assert len(results) > 0
    assert any("Cognitive Scale" in (j.get("company") or "") for j in results)
