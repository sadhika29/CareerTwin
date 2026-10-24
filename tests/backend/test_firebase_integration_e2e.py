from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.firestore import FirestoreDatabase
from backend.services.resume_service import ResumeService
from backend.database.local_storage import LocalResumeStorage

client = TestClient(app)


def test_firebase_profile_persistence_and_no_passwords_in_db():
    """Verify registration creates a Firestore profile WITHOUT storing password hash."""
    uid = uuid4().hex[:8]
    username = f"fb_user_{uid}"
    email = f"fb_{uid}@careertwin.ai"
    password = "SecurePassword123!"

    # 1. Register user
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Firebase Test User",
        "username": username,
        "email": email,
        "password": password,
        "confirm_password": password,
    })
    assert res.status_code == 201
    auth_data = res.json()
    token = auth_data["access_token"]
    user_id = auth_data["user"]["id"]

    headers = {"Authorization": f"Bearer {token}", "X-User-ID": user_id}

    # 2. Verify profile loaded via API
    res_prof = client.get("/api/v1/profile", headers=headers)
    assert res_prof.status_code == 200
    prof = res_prof.json()["profile"]
    assert prof["email"] == email

    # 3. Direct Firestore verification
    db = FirestoreDatabase()
    firestore_doc = db.get("profiles", user_id)
    if firestore_doc:
        assert firestore_doc.get("email") == email
        # CRITICAL SECURITY CHECK: password or hash must never exist in Firestore document
        assert "password" not in firestore_doc
        assert "password_hash" not in firestore_doc
        assert "access_token" not in firestore_doc


def test_firebase_user_isolation():
    """Ensure User A cannot view or manipulate User B's resources."""
    user_a = f"user_a_{uuid4().hex[:6]}"
    user_b = f"user_b_{uuid4().hex[:6]}"

    headers_a = {"X-User-ID": user_a}
    headers_b = {"X-User-ID": user_b}

    # User A creates a job application
    app_payload = {
        "company": "Company A",
        "role": "Cloud Architect",
        "status": "Applied",
        "salary": "$150k",
    }
    res_create = client.post("/api/v1/applications", json=app_payload, headers=headers_a)
    assert res_create.status_code == 200
    app_id = res_create.json()["application"]["id"]

    # User B lists applications -> must be empty or not contain User A's application
    res_b_list = client.get("/api/v1/applications", headers=headers_b)
    assert res_b_list.status_code == 200
    b_apps = [a["id"] for a in res_b_list.json()["applications"]]
    assert app_id not in b_apps

    # User B cannot update User A's application
    res_b_update = client.patch(f"/api/v1/applications/{app_id}", json={"status": "Rejected"}, headers=headers_b)
    assert res_b_update.status_code == 404

    # User B cannot delete User A's application
    res_b_del = client.delete(f"/api/v1/applications/{app_id}", headers=headers_b)
    assert res_b_del.status_code == 404

    # Clean up with User A
    res_a_del = client.delete(f"/api/v1/applications/{app_id}", headers=headers_a)
    assert res_a_del.status_code == 200


def test_resume_chunk_persistence_and_retrieval():
    """Verify that uploading/processing a resume generates and stores durable chunks in Firestore."""
    user_id = f"user_resume_{uuid4().hex[:6]}"
    headers = {"X-User-ID": user_id}

    # Upload sample resume fixture
    sample_file_path = "tests/fixtures/sample_resume.pdf"
    with open(sample_file_path, "rb") as f:
        pdf_bytes = f.read()

    files = {"file": ("test_resume.pdf", pdf_bytes, "application/pdf")}
    data = {"user_id": user_id}

    res_upload = client.post("/resumes/upload", files=files, data=data, headers=headers)
    assert res_upload.status_code == 200
    resume_id = res_upload.json()["resume_id"]

    # Test chunk retrieval endpoint
    res_chunks = client.get(f"/resumes/{resume_id}/chunks?user_id={user_id}")
    assert res_chunks.status_code == 200
    chunk_data = res_chunks.json()
    assert chunk_data["resume_id"] == resume_id
    assert chunk_data["total_chunks"] >= 1
    assert len(chunk_data["chunks"]) >= 1

    first_chunk = chunk_data["chunks"][0]
    assert "chunk_id" in first_chunk
    assert "text" in first_chunk
    assert first_chunk["sequence_number"] == 0

    # User isolation on chunks: unauthorized user cannot access
    res_unauth = client.get(f"/resumes/{resume_id}/chunks?user_id=attacker_user")
    assert res_unauth.status_code == 400

    # Clean up resume
    res_del = client.delete(f"/resumes/{resume_id}?user_id={user_id}")
    assert res_del.status_code == 200


def test_dashboard_persisted_metrics_aggregation():
    """Verify dashboard overview aggregates metrics from persisted records."""
    user_id = f"user_dash_{uuid4().hex[:6]}"
    headers = {"X-User-ID": user_id}

    # 1. Check initial dashboard metrics
    res_initial = client.get("/api/v1/dashboard/overview", headers=headers)
    assert res_initial.status_code == 200
    d_init = res_initial.json()
    assert d_init["total_applications"] == 0

    # 2. Add application
    client.post("/api/v1/applications", json={"company": "Google", "role": "SWE", "status": "Applied"}, headers=headers)

    # 3. Check updated dashboard metrics
    res_after = client.get("/api/v1/dashboard/overview", headers=headers)
    assert res_after.status_code == 200
    d_after = res_after.json()
    assert d_after["total_applications"] == 1


def test_career_plan_persistence_and_restore_across_restarts():
    """Verify career roadmap analysis is persisted to Firestore and restores when memory state is cleared."""
    user_id = f"user_career_{uuid4().hex[:6]}"
    headers = {"X-User-ID": user_id}

    # Simulate saving directly to Firestore to represent previous session persistence
    db = FirestoreDatabase()
    plan_doc = {
        "user_id": user_id,
        "target_role": "AI Engineer",
        "readiness_score": 88.5,
        "skill_gaps": ["PyTorch", "Transformers"],
        "next_action": "Complete deep learning assessment",
        "metadata": {
            "digital_twin": {"weakest_area": "PyTorch"},
            "what_if": {"target_boost": "+15%"},
        },
    }
    db.create("career_plans", f"{user_id}_latest", plan_doc)

    # Ensure memory state does not contain this user (simulating clean server start)
    from backend.api.dependencies import career_states
    career_states.pop(user_id, None)

    # Call GET /api/v1/career/readiness -> must restore from Firestore
    res = client.get("/api/v1/career/readiness", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["target_role"] == "AI Engineer"
    assert data["readiness_score"] == 88.5
    assert "PyTorch" in data["skill_gaps"]
    assert data["weakest_area"] == "PyTorch"

    # Clean up Firestore record
    db.delete("career_plans", f"{user_id}_latest")
