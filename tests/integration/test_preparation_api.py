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


def test_submit_assessment_returns_test_report():
    response = client.post(
        "/api/v1/preparation/assessment/submit",
        json={
            "assessment_id": "asmt_dsa_1",
            "user_id": "user_123",
            "answers": {
                "dsa-1": "Kadane's algorithm",
                "dsa-2": "Wrong answer",
            },
            "time_taken": 120,
        },
    )
    assert response.status_code == 200
    report = response.json()
    assert report["total_questions"] >= 2
    assert report["correct_answers"] >= 1
    assert "question_results" in report
    assert "weak_topics" in report


def test_reattempt_incomplete_questions():
    response = client.post(
        "/api/v1/preparation/assessment/reattempt-incomplete",
        json={
            "user_id": "user_123",
            "assessment_id": "asmt_dsa_1",
            "category": "DSA",
            "include_skipped": True,
            "include_failed": True,
            "specific_question_ids": ["dsa-2", "dsa-3"],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) == 2


def test_get_test_reports():
    response = client.get(
        "/api/v1/preparation/reports",
        headers={"X-User-ID": "user_123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    assert len(data["reports"]) >= 1
    assert "correct_answers" in data["reports"][0]
    assert "incorrect_answers" in data["reports"][0]
    assert "unattempted" in data["reports"][0]

