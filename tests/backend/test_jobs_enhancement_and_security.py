"""
Integration and security tests for CareerTwin Jobs enhancements:
- Real-time synchronization (/jobs/sync and /jobs/sync/status)
- Resume matching authorization (403 for unauthorized resume access)
- Resume matching success with authorized user resume
- AI Fit Intelligence endpoint integration
- Shared catalog integrity
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.firestore import FirestoreDatabase

client = TestClient(app)


def test_sync_status_endpoint():
    """Verify GET /api/v1/jobs/sync/status returns provider metadata and sync timestamp."""
    res = client.get("/api/v1/jobs/sync/status")
    assert res.status_code == 200
    data = res.json()
    assert "status" in data
    assert "last_sync_time" in data or "provider_counts" in data


@patch("backend.services.job_catalog_service.JobCatalogService.sync_jobs")
def test_sync_jobs_endpoint(mock_sync):
    """Verify POST /api/v1/jobs/sync triggers job synchronization and returns summary."""
    mock_sync.return_value = {
        "status": "success",
        "total_synced": 15,
        "sync_time": "2026-10-23T18:00:00Z",
        "provider_counts": {"Himalayas": 10, "JSearch": 5},
    }

    res = client.post("/api/v1/jobs/sync?query=Software+Engineer&limit_per_provider=5")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total_synced"] == 15
    mock_sync.assert_called_once()


@patch.object(FirestoreDatabase, "get")
def test_match_rejects_unauthorized_resume_access(mock_get_doc):
    """Verify POST /api/v1/jobs/{job_id}/match rejects user trying to use someone else's resume (403)."""
    # Victim's resume belongs to 'victim_user_123'
    def mock_get(collection, document_id):
        if collection == "resumes" and document_id == "victim_resume_abc":
            return {
                "id": "victim_resume_abc",
                "user_id": "victim_user_123",
                "filename": "confidential_resume.pdf",
                "skills": ["Python", "Django"],
                "text": "Experienced Python developer...",
            }
        return None

    mock_get_doc.side_effect = mock_get

    payload = {
        "user_id": "attacker_user_999",  # Attacker attempting to match with victim's resume
        "resume_id": "victim_resume_abc",
        "title": "Backend Engineer",
        "company": "Acme Inc",
        "required_skills": ["Python", "FastAPI"],
    }

    res = client.post("/api/v1/jobs/job_test_001/match", json=payload)
    assert res.status_code == 403
    data = res.json()
    assert "Unauthorized" in data["detail"] or "access" in data["detail"].lower()


@patch.object(FirestoreDatabase, "get")
@patch("backend.services.job_service.JobService.get_job")
def test_match_succeeds_for_authorized_resume(mock_get_job, mock_get_doc):
    """Verify POST /api/v1/jobs/{job_id}/match computes match for authenticated user's own resume."""
    def mock_get(collection, document_id):
        if collection == "resumes" and document_id == "resume_user_123":
            return {
                "id": "resume_user_123",
                "user_id": "user_123",
                "filename": "my_resume.pdf",
                "skills": ["Python", "React", "PostgreSQL", "Docker"],
                "text": "Full stack engineer with Python and React expertise",
            }
        return None

    mock_get_doc.side_effect = mock_get

    mock_job = MagicMock()
    mock_job.job_id = "job_456"
    mock_job.title = "Full Stack Engineer"
    mock_job.company = "TechVentures"
    mock_job.location = "Remote"
    mock_job.description = "We need Python and React developers with Docker knowledge."
    mock_job.required_skills = ["Python", "React"]
    mock_job.preferred_skills = ["Docker", "Kubernetes"]
    mock_get_job.return_value = mock_job

    payload = {
        "user_id": "user_123",
        "resume_id": "resume_user_123",
        "title": "Full Stack Engineer",
        "company": "TechVentures",
        "required_skills": ["Python", "React"],
    }

    res = client.post("/api/v1/jobs/job_456/match", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["job_id"] == "job_456"
    assert data["resume_id"] == "resume_user_123"
    assert data["resume_filename"] == "my_resume.pdf"
    assert "job_match_score" in data
    assert data["job_match_score"] > 0
    assert "Python" in data["matched_skills"] or "React" in data["matched_skills"]


@patch("backend.services.job_service.JobService.delete_job")
def test_delete_job_requires_ownership(mock_delete):
    """Verify DELETE /api/v1/jobs/{job_id} enforces ownership check."""
    mock_delete.side_effect = ValueError("Job does not belong to this user.")

    res = client.delete("/api/v1/jobs/shared_catalog_job_1?user_id=random_user")
    assert res.status_code == 400
    assert "does not belong to this user" in res.json()["detail"]


def test_record_job_view_and_deduplication():
    """Verify viewed jobs are recorded and unique view counts are deduplicated."""
    user = "test_view_user_1"
    headers = {"X-User-ID": user}

    # First view
    res1 = client.post("/api/v1/jobs/job_view_001/view", json={"title": "Cloud Engineer", "company": "SkyCorp"}, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["viewed"] is True

    # Repeated view of the same job
    res2 = client.post("/api/v1/jobs/job_view_001/view", json={"title": "Cloud Engineer", "company": "SkyCorp"}, headers=headers)
    assert res2.status_code == 200

    # Summary check
    res_summary = client.get("/api/v1/jobs/interactions/summary", headers=headers)
    assert res_summary.status_code == 200
    data = res_summary.json()
    assert "job_view_001" in data["viewed_job_ids"]
    assert data["viewed_count"] == 1


def test_toggle_save_and_unsave_job():
    """Verify saving updates count, and unsaving decreases count while preserving history."""
    user = "test_save_user_2"
    headers = {"X-User-ID": user}

    # Save job
    res_save = client.post("/api/v1/jobs/job_save_002/save", json={"saved": True, "title": "AI Researcher"}, headers=headers)
    assert res_save.status_code == 200
    assert res_save.json()["saved"] is True

    res_sum1 = client.get("/api/v1/jobs/interactions/summary", headers=headers)
    assert "job_save_002" in res_sum1.json()["saved_job_ids"]
    assert res_sum1.json()["saved_count"] == 1

    # Unsave job
    res_unsave = client.post("/api/v1/jobs/job_save_002/save", json={"saved": False}, headers=headers)
    assert res_unsave.status_code == 200
    assert res_unsave.json()["saved"] is False

    res_sum2 = client.get("/api/v1/jobs/interactions/summary", headers=headers)
    assert "job_save_002" not in res_sum2.json()["saved_job_ids"]
    assert res_sum2.json()["saved_count"] == 0


def test_confirm_job_application_and_deduplication():
    """Verify confirming application updates Applied Jobs and prevents duplicates."""
    user = "test_apply_user_3"
    headers = {"X-User-ID": user}

    payload = {
        "title": "Staff Backend Architect",
        "company": "Apex Dynamics",
        "location": "Bengaluru",
        "url": "https://apex.example.com/apply",
    }

    # Confirm application
    res1 = client.post("/api/v1/jobs/job_apply_003/apply-confirm", json=payload, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["status"] == "success"

    # Confirm again (e.g. repeated click)
    res2 = client.post("/api/v1/jobs/job_apply_003/apply-confirm", json=payload, headers=headers)
    assert res2.status_code == 200

    # Summary check
    res_sum = client.get("/api/v1/jobs/interactions/summary", headers=headers)
    data = res_sum.json()
    assert "job_apply_003" in data["applied_job_ids"]
    assert data["applied_count"] == 1


def test_user_interaction_isolation():
    """Verify one user's private views, saves, and applications cannot leak to another user."""
    user_a = "user_alpha_99"
    user_b = "user_beta_88"

    client.post("/api/v1/jobs/job_secret_01/save", json={"saved": True, "title": "Private Role"}, headers={"X-User-ID": user_a})

    # User B queries summary
    res_b = client.get("/api/v1/jobs/interactions/summary", headers={"X-User-ID": user_b})
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert "job_secret_01" not in data_b["saved_job_ids"]
    assert data_b["saved_count"] == 0

