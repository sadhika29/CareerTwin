"""
Test suite verifying the Skill Level model (Beginner, Intermediate, Advanced, Expert)
and migration mapping from legacy numeric percentages.
"""
from uuid import uuid4
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.user_skill_service import (
    normalize_skill_level,
    SKILL_LEVEL_RANKS,
    SKILL_LEVEL_TO_PERCENTAGE,
)

client = TestClient(app)


def test_normalize_skill_level_mapping():
    """Verify legacy numeric percentages map accurately to skill levels."""
    assert normalize_skill_level(15) == "Beginner"
    assert normalize_skill_level(39) == "Beginner"
    assert normalize_skill_level(40) == "Intermediate"
    assert normalize_skill_level(65) == "Intermediate"
    assert normalize_skill_level(70) == "Advanced"
    assert normalize_skill_level(85) == "Advanced"
    assert normalize_skill_level(90) == "Expert"
    assert normalize_skill_level(100) == "Expert"
    # Case insensitivity & string passthrough
    assert normalize_skill_level("beginner") == "Beginner"
    assert normalize_skill_level("INTERMEDIATE") == "Intermediate"
    assert normalize_skill_level("advanced") == "Advanced"
    assert normalize_skill_level("expert") == "Expert"


def test_create_and_update_skill_with_levels():
    """Verify skills can be created and updated using dropdown level strings."""
    user_id = f"user_lvl_{uuid4().hex[:8]}"
    headers = {"X-User-ID": user_id}

    # 1. Create skill with current_level=Beginner, target_level=Advanced
    res_create = client.post(
        "/api/v1/skills/user",
        json={
            "name": "TypeScript",
            "category": "Programming Languages",
            "current_level": "Beginner",
            "target_level": "Advanced",
        },
        headers=headers,
    )
    assert res_create.status_code == 201
    data = res_create.json()
    assert data["name"] == "TypeScript"
    assert data["current_level"] == "Beginner"
    assert data["target_level"] == "Advanced"
    assert data["proficiency"] == SKILL_LEVEL_TO_PERCENTAGE["Beginner"]
    assert data["target_proficiency"] == SKILL_LEVEL_TO_PERCENTAGE["Advanced"]
    skill_id = data["id"]

    # 2. Update skill to Intermediate -> Expert
    res_update = client.patch(
        f"/api/v1/skills/user/{skill_id}",
        json={
            "current_level": "Intermediate",
            "target_level": "Expert",
        },
        headers=headers,
    )
    assert res_update.status_code == 200
    updated = res_update.json()
    assert updated["current_level"] == "Intermediate"
    assert updated["target_level"] == "Expert"

    # 3. Retrieve user skills and verify levels persist
    res_get = client.get("/api/v1/skills/user", headers=headers)
    assert res_get.status_code == 200
    fetched_skills = res_get.json()["skills"]
    assert len(fetched_skills) == 1
    assert fetched_skills[0]["current_level"] == "Intermediate"
    assert fetched_skills[0]["target_level"] == "Expert"


def test_reject_unsupported_skill_levels():
    """Verify that unsupported skill levels are rejected."""
    user_id = f"user_rej_{uuid4().hex[:8]}"
    headers = {"X-User-ID": user_id}

    res_invalid_current = client.post(
        "/api/v1/skills/user",
        json={
            "name": "Rust",
            "current_level": "GodMode",
            "target_level": "Advanced",
        },
        headers=headers,
    )
    assert res_invalid_current.status_code in (400, 422)

    res_invalid_target = client.post(
        "/api/v1/skills/user",
        json={
            "name": "Rust",
            "current_level": "Beginner",
            "target_level": "SuperNinja",
        },
        headers=headers,
    )
    assert res_invalid_target.status_code in (400, 422)

