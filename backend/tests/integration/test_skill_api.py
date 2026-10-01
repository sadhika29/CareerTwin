from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_skills_catalog_endpoint():
    resp = client.get("/api/v1/skills")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] > 0
    assert any(s["name"] == "Python" for s in data["skills"])


def test_skills_gap_detection_endpoint():
    req = {
        "user_id": "usr_test",
        "current_skills": ["py", "FastAPI"],
        "job_required_skills": ["Python", "FastAPI", "Kubernetes", "System Design"],
        "target_role": "Backend Architect",
    }
    resp = client.post("/api/v1/skills/gaps", json=req)
    assert resp.status_code == 200
    data = resp.json()
    assert "Python" in data["matched_skills"]
    assert "System Design" in data["skill_gaps"]
    assert data["skill_gap_score"] == 50.0
