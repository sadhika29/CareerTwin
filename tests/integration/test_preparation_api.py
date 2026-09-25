from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_preparation_plan_route_creates_plan():
    response = client.post(
        "/api/v1/preparation/plan",
        headers={"X-User-ID": "user_123"},
        json={
            "user_id": "user_123",
            "target_role": "Software Engineer",
            "target_job": "SDE-2",
            "current_skills": ["Arrays", "SQL"],
            "skill_gaps": ["Sliding Window", "Dynamic Programming"],
            "digital_twin_state": {"resume": 80},
            "previous_performance": {"weak_topics": ["Dynamic Programming"]},
            "available_time": 90,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["target_role"] == "Software Engineer"
    assert body["priority_topics"]


def test_preparation_assessment_route_requires_authentication():
    response = client.post(
        "/api/v1/preparation/assessment",
        json={
            "user_id": "user_123",
            "category": "DSA",
            "difficulty": "medium",
            "number_of_questions": 2,
            "duration": 30,
        },
    )
    assert response.status_code == 401
