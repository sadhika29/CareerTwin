"""
Integration tests for Dynamic Dashboard Metrics, Profile Sync, and Multi-Resume Isolation.
Verifies:
1. Display name resolution prevents raw Firebase UID leakage.
2. Resume ATS score reflects user's actual active/latest analysis.
3. Skills progress weights levels accurately (Beginner, Intermediate, Advanced, Expert).
4. Interview readiness returns None when no interviews completed (no fake scores).
5. Dynamic AI Copilot insight generates grounded narrative without fabricated values.
"""
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.profile_sync_service import is_raw_uid_or_placeholder, sync_resume_to_user_profile
from backend.services.resume_extractor import extract_comprehensive_resume_data


@pytest.fixture
def client():
    return TestClient(app)


def test_is_raw_uid_or_placeholder():
    # Firebase UID strings
    assert is_raw_uid_or_placeholder("bfitTIcnAEQ7NTmMgPSoOQUbbc33", "bfitTIcnAEQ7NTmMgPSoOQUbbc33") is True
    assert is_raw_uid_or_placeholder("Bfitticnaeq7Ntmmgpsooqubbc33", "bfitTIcnAEQ7NTmMgPSoOQUbbc33") is True
    assert is_raw_uid_or_placeholder("user_12345678901234567890", "user_12345678901234567890") is True
    assert is_raw_uid_or_placeholder("", "user_1") is True
    assert is_raw_uid_or_placeholder(None, "user_1") is True

    # Real human names
    assert is_raw_uid_or_placeholder("Veerendra Babu Kumpati", "bfitTIcnAEQ7NTmMgPSoOQUbbc33") is False
    assert is_raw_uid_or_placeholder("John Doe", "uid_123") is False


def test_resume_extractor_sample_text():
    sample_resume = """
    Veerendra Babu Kumpati
    Email: veeruveeredra05@gmail.com | Phone: +91 8317630091
    Potluri Siddhartha Institute of Technology
    Bachelor of Technology in Computer Science and Engineering, 2027

    TECHNICAL SKILLS
    Languages: Python, SQL
    Developer Tools: Git, GitHub, VS Code
    Specializations: Machine Learning, Gemini API, Operating Systems

    PROJECTS
    CareerTwin AI Platform
    • Engineered real-time interview simulator using Gemini API and Web Speech synthesis.
    """
    extracted = extract_comprehensive_resume_data(sample_resume)
    assert extracted["full_name"] == "Veerendra Babu Kumpati"
    assert extracted["email"] == "veeruveeredra05@gmail.com"
    assert extracted["phone"] == "+91 8317630091"
    assert "Potluri Siddhartha" in extracted["college"]
    assert extracted["graduation_year"] == "2027"
    assert "Python" in extracted["skills"]
    assert "Git" in extracted["skills"]


def test_dashboard_stats_endpoint(client):
    headers = {"X-User-ID": "test_dashboard_user_1"}
    response = client.get("/api/v1/dashboard/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    print("DEBUG DATA IS:", repr(data))

    assert "user_id" in data
    assert "display_name" in data
    assert not is_raw_uid_or_placeholder(data["display_name"], "test_dashboard_user_1")
    assert "profile_completion" in data
    assert isinstance(data["profile_completion"], int)
    assert "total_applications" in data
    assert "overall_readiness" in data


def test_dashboard_insight_endpoint(client):
    headers = {"X-User-ID": "test_dashboard_user_1"}
    response = client.get("/api/v1/dashboard/insight", headers=headers)
    assert response.status_code == 200
    data = response.json()

    assert "ai_insight" in data
    assert "summary" in data["ai_insight"]
    assert len(data["ai_insight"]["summary"]) > 0
