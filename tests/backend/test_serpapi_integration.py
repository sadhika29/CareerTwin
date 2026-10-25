"""
Tests for SerpApi Google Jobs integration.
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.serpapi_client import SerpApiClient

client = TestClient(app)

SAMPLE_RAW_SERPAPI_JOB = {
    "title": "Cloud Solutions Architect",
    "company_name": "NextGen Systems",
    "location": "San Francisco, CA",
    "via": "via LinkedIn",
    "share_link": "https://www.google.com/search?ibp=htl;jobs#sample",
    "thumbnail": "https://serpapi.com/images/sample-logo.png",
    "extensions": ["3 days ago", "Full-time"],
    "description": "Seeking an expert in Python, AWS, Docker, Kubernetes, and FastAPI.",
    "detected_extensions": {
        "posted_at": "3 days ago",
        "schedule_type": "Full-time",
        "work_from_home": True,
        "salary": "$170,000–$210,000 a year"
    },
    "apply_options": [
        {
            "title": "LinkedIn",
            "link": "https://linkedin.com/jobs/view/123456"
        }
    ],
    "job_id": "google_jobs_raw_id_xyz_789"
}


def test_serpapi_client_normalization():
    """Verify raw SerpApi Google Jobs are normalized into CareerTwin schema."""
    s_client = SerpApiClient()
    norm = s_client._normalize_job(SAMPLE_RAW_SERPAPI_JOB)

    assert norm["title"] == "Cloud Solutions Architect"
    assert norm["company"] == "NextGen Systems"
    assert norm["employer_logo"] == "https://serpapi.com/images/sample-logo.png"
    assert norm["is_remote"] is True
    assert norm["employment_type"] == "Full-time"
    assert norm["salary_range"] == "$170,000–$210,000 a year"
    assert norm["job_url"] == "https://linkedin.com/jobs/view/123456"
    assert "Google Jobs" in norm["source"]
    assert norm["source_badge"] == "Google Jobs"
    assert norm["is_live_external"] is True

    # Check skill extraction
    extracted = [s.lower() for s in norm["required_skills"] + norm["preferred_skills"]]
    assert any(s in extracted for s in ["python", "aws", "docker", "kubernetes", "fastapi"])


@patch.object(SerpApiClient, "search_jobs")
def test_serpapi_search_endpoint(mock_search):
    """Verify GET /api/v1/jobs/serpapi/search returns properly formatted jobs."""
    mock_search.return_value = [
        {
            "job_id": "google_jobs_mock_01",
            "title": "Senior Backend Developer",
            "company": "ScaleTech",
            "location": "Bengaluru",
            "job_url": "https://example.com/apply",
            "required_skills": ["Python", "FastAPI"],
            "preferred_skills": ["PostgreSQL"],
            "source": "Google Jobs via SerpApi (LinkedIn)",
            "source_badge": "Google Jobs",
            "is_live_external": True,
        }
    ]

    res = client.get("/api/v1/jobs/serpapi/search?query=Backend+Developer&location=Bengaluru")
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "serpapi"
    assert data["provider"] == "Google Jobs (SerpApi)"
    assert data["count"] == 1
    assert data["jobs"][0]["company"] == "ScaleTech"


@patch.object(SerpApiClient, "search_jobs")
def test_live_search_aggregates_serpapi(mock_search):
    """Verify GET /api/v1/jobs/live/search?source=serpapi returns SerpApi jobs."""
    mock_search.return_value = [
        {
            "job_id": "google_jobs_mock_02",
            "title": "Data Engineer",
            "company": "DataCorp",
            "location": "Remote",
            "required_skills": ["Python", "Spark"],
            "preferred_skills": ["Kafka"],
            "source": "Google Jobs via SerpApi",
            "is_live_external": True,
        }
    ]

    res = client.get("/api/v1/jobs/live/search?query=Data+Engineer&source=serpapi")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 1
    assert data["jobs"][0]["title"] == "Data Engineer"
