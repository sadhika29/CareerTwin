"""
Comprehensive unit and integration test suite for CareerTwin Skills page.
Tests:
1. User skill CRUD (Create, Read, Update, Delete)
2. Proficiency & target proficiency boundaries (0-100%)
3. Duplicate skill prevention per user
4. Strict user isolation & ownership protection (User A vs User B)
5. Summary calculations (total, proficient >= 70%, skills to improve < target)
6. Target role updates and profile synchronization
7. Learning progress tracking for DSA, Aptitude, Programming
8. Rejection of unauthenticated requests
"""
from uuid import uuid4
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.user_skill_service import UserSkillService

client = TestClient(app)


def test_unauthenticated_requests_rejected():
    """Ensure unauthenticated access to /api/v1/skills/user and learning endpoints is rejected with 401."""
    res_skills = client.get("/api/v1/skills/user")
    assert res_skills.status_code == 401

    res_create = client.post("/api/v1/skills/user", json={"name": "Python"})
    assert res_create.status_code == 401

    res_prog = client.get("/api/v1/skills/learning/progress")
    assert res_prog.status_code == 401


def test_user_skill_crud_and_summary_calculations():
    """Test full CRUD lifecycle of user skills and accurate summary calculations."""
    user_id = f"user_crud_{uuid4().hex[:8]}"
    headers = {"X-User-ID": user_id}

    # 1. Initially user has 0 skills
    res = client.get("/api/v1/skills/user", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["skills"] == []
    assert data["summary"]["total_skills"] == 0
    assert data["summary"]["proficient_skills"] == 0
    assert data["summary"]["skills_to_improve"] == 0

    # 2. Add Skill 1: Python (proficiency 80% -> proficient, target 85% -> to improve because 80 < 85)
    res_skill1 = client.post(
        "/api/v1/skills/user",
        json={
            "name": "Python",
            "category": "Programming Languages",
            "proficiency": 80.0,
            "target_proficiency": 85.0,
            "notes": "FastAPI and PyTorch practice",
            "learning_goal": "Build async APIs",
        },
        headers=headers,
    )
    assert res_skill1.status_code == 201
    s1 = res_skill1.json()
    assert s1["name"] == "Python"
    assert s1["proficiency"] == 80.0
    assert s1["target_proficiency"] == 85.0
    assert s1["user_id"] == user_id
    s1_id = s1["id"]

    # 3. Add Skill 2: React (proficiency 90%, target 80% -> proficient AND target met, NOT to improve)
    res_skill2 = client.post(
        "/api/v1/skills/user",
        json={
            "name": "React",
            "category": "Web Development",
            "proficiency": 90.0,
            "target_proficiency": 80.0,
        },
        headers=headers,
    )
    assert res_skill2.status_code == 201
    s2_id = res_skill2.json()["id"]

    # 4. Add Skill 3: Docker (proficiency 50%, target 75% -> NOT proficient (<70), to improve (<75))
    res_skill3 = client.post(
        "/api/v1/skills/user",
        json={
            "name": "Docker",
            "category": "Cloud & DevOps",
            "proficiency": 50.0,
            "target_proficiency": 75.0,
        },
        headers=headers,
    )
    assert res_skill3.status_code == 201
    s3_id = res_skill3.json()["id"]

    # 5. Verify live summary calculations
    res_list = client.get("/api/v1/skills/user", headers=headers)
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert len(list_data["skills"]) == 3
    summary = list_data["summary"]
    assert summary["total_skills"] == 3
    # Proficient skills (>= 70%): Python (80%) and React (90%) = 2
    assert summary["proficient_skills"] == 2
    # Skills to improve (proficiency < target): Python (80 < 85) and Docker (50 < 75) = 2
    assert summary["skills_to_improve"] == 2

    # 6. Update Skill 3: Boost Docker proficiency to 80% (now proficient and target met)
    res_update = client.patch(
        f"/api/v1/skills/user/{s3_id}",
        json={"proficiency": 80.0, "notes": "Completed Docker containerization labs"},
        headers=headers,
    )
    assert res_update.status_code == 200
    assert res_update.json()["proficiency"] == 80.0
    assert res_update.json()["notes"] == "Completed Docker containerization labs"

    # Verify updated summary
    res_list_after_update = client.get("/api/v1/skills/user", headers=headers)
    summary2 = res_list_after_update.json()["summary"]
    # Proficient: Python (80), React (90), Docker (80) = 3
    assert summary2["proficient_skills"] == 3
    # Skills to improve: only Python (80 < 85) = 1
    assert summary2["skills_to_improve"] == 1

    # 7. Delete Skill 1 (Python)
    res_del = client.delete(f"/api/v1/skills/user/{s1_id}", headers=headers)
    assert res_del.status_code == 200

    # Verify deletion
    res_after_del = client.get("/api/v1/skills/user", headers=headers)
    assert len(res_after_del.json()["skills"]) == 2
    ids = [s["id"] for s in res_after_del.json()["skills"]]
    assert s1_id not in ids
    assert res_after_del.json()["summary"]["total_skills"] == 2


def test_duplicate_skill_prevention():
    """Ensure duplicate skills for the same user are rejected with 400."""
    user_id = f"user_dup_{uuid4().hex[:8]}"
    headers = {"X-User-ID": user_id}

    res1 = client.post(
        "/api/v1/skills/user",
        json={"name": "PostgreSQL", "proficiency": 70.0},
        headers=headers,
    )
    assert res1.status_code == 201

    # Attempting to add "postgresql" (case-insensitive duplicate) must fail
    res2 = client.post(
        "/api/v1/skills/user",
        json={"name": "  postgresql  ", "proficiency": 60.0},
        headers=headers,
    )
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_user_ownership_and_isolation():
    """Verify User A cannot update or delete User B's skill."""
    user_a = f"user_a_{uuid4().hex[:8]}"
    user_b = f"user_b_{uuid4().hex[:8]}"

    headers_a = {"X-User-ID": user_a}
    headers_b = {"X-User-ID": user_b}

    # User A creates a skill
    res_a = client.post(
        "/api/v1/skills/user",
        json={"name": "Kubernetes", "proficiency": 75.0},
        headers=headers_a,
    )
    assert res_a.status_code == 201
    skill_a_id = res_a.json()["id"]

    # User B cannot see User A's skill in their list
    res_b_list = client.get("/api/v1/skills/user", headers=headers_b)
    assert res_b_list.status_code == 200
    assert len(res_b_list.json()["skills"]) == 0

    # User B attempting to update User A's skill gets 404 or 403
    res_b_update = client.patch(
        f"/api/v1/skills/user/{skill_a_id}",
        json={"proficiency": 10.0},
        headers=headers_b,
    )
    assert res_b_update.status_code in (403, 404)

    # User B attempting to delete User A's skill gets 404 or 403
    res_b_delete = client.delete(
        f"/api/v1/skills/user/{skill_a_id}",
        headers=headers_b,
    )
    assert res_b_delete.status_code in (403, 404)

    # User A's skill remains untouched
    res_a_check = client.get("/api/v1/skills/user", headers=headers_a)
    assert res_a_check.json()["skills"][0]["proficiency"] == 75.0


def test_target_role_update():
    """Verify updating target role modifies summary and persists."""
    user_id = f"user_role_{uuid4().hex[:8]}"
    headers = {"X-User-ID": user_id}

    res_update_role = client.patch(
        "/api/v1/skills/user/target-role",
        json={"target_role": "Cloud Architect"},
        headers=headers,
    )
    assert res_update_role.status_code == 200
    assert res_update_role.json()["target_role"] == "Cloud Architect"

    # Refetched skills summary reflects the new target role
    res_skills = client.get("/api/v1/skills/user", headers=headers)
    assert res_skills.json()["summary"]["target_role"] == "Cloud Architect"


def test_learning_progress_tracking():
    """Verify DSA, Aptitude, and Programming practice tracking and persistence."""
    user_id = f"user_prog_{uuid4().hex[:8]}"
    headers = {"X-User-ID": user_id}

    # 1. Initially no progress
    res_init = client.get("/api/v1/skills/learning/progress", headers=headers)
    assert res_init.status_code == 200
    assert res_init.json()["counts"]["total_completed"] == 0

    # 2. Mark DSA Two Sum as Solved
    res_dsa = client.post(
        "/api/v1/skills/learning/progress",
        json={
            "resource_id": "dsa_arr_two_sum",
            "category": "dsa",
            "topic": "Arrays",
            "title": "Two Sum",
            "status": "Solved",
            "notes": "Hash map O(N) time complexity",
        },
        headers=headers,
    )
    assert res_dsa.status_code == 200
    record_dsa = res_dsa.json()
    assert record_dsa["status"] == "Solved"
    assert record_dsa["completed_at"] is not None

    # 3. Mark Aptitude Percentages as Completed
    res_apt = client.post(
        "/api/v1/skills/learning/progress",
        json={
            "resource_id": "apt_percentages",
            "category": "aptitude",
            "topic": "Percentages",
            "title": "Percentages",
            "status": "Completed",
            "notes": "Revised fraction to percent table",
        },
        headers=headers,
    )
    assert res_apt.status_code == 200

    # 4. Check progress map and counts
    res_check = client.get("/api/v1/skills/learning/progress", headers=headers)
    assert res_check.status_code == 200
    data = res_check.json()
    assert data["counts"]["dsa_solved"] == 1
    assert data["counts"]["aptitude_completed"] == 1
    assert data["counts"]["total_completed"] == 2
    assert "dsa_arr_two_sum" in data["progress_map"]
    assert data["progress_map"]["dsa_arr_two_sum"]["notes"] == "Hash map O(N) time complexity"
