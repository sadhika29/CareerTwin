import pytest
from pydantic import ValidationError
from unittest.mock import MagicMock
from firebase_admin import firestore

from backend.schemas.skill import UserSkillCreateRequest, UserSkillUpdateRequest
from backend.services.user_skill_service import (
    SKILL_LEVEL_RANK,
    UserSkillService,
    _user_skills_cache,
    legacy_proficiency_to_level,
)


@pytest.mark.parametrize(
    ("percentage", "expected"),
    [
        (0, "Beginner"),
        (24.99, "Beginner"),
        (25, "Intermediate"),
        (49.99, "Intermediate"),
        (50, "Advanced"),
        (74.99, "Advanced"),
        (75, "Expert"),
        (100, "Expert"),
        (-1, None),
        (101, None),
        (None, None),
    ],
)
def test_legacy_percentage_mapping_is_documented_and_bounded(percentage, expected):
    assert legacy_proficiency_to_level(percentage) == expected


def test_skill_crud_persists_levels_and_rejects_unsupported_values():
    user_id = "skill-level-user-create"
    _user_skills_cache.pop(user_id, None)
    database = MagicMock()
    service = UserSkillService(database=database)

    request = UserSkillCreateRequest(
        name="Python",
        current_level="Intermediate",
        target_level="Expert",
    )
    created = service.create_skill(user_id, request.model_dump())

    assert created["current_level"] == "Intermediate"
    assert created["target_level"] == "Expert"
    assert "proficiency" not in created
    assert "target_proficiency" not in created
    assert "notes" not in created
    assert "learning_goal" not in created
    database.update.assert_called_once()

    with pytest.raises(ValidationError):
        UserSkillCreateRequest(name="Rust", current_level="Master", target_level="Expert")
    with pytest.raises(ValidationError):
        UserSkillUpdateRequest(current_level="85%")

    updated = service.update_skill(user_id, created["id"], {"current_level": "Advanced"})
    assert updated["current_level"] == "Advanced"
    assert SKILL_LEVEL_RANK[updated["current_level"]] == 2
    assert updated["target_level"] == "Expert"


def test_legacy_records_are_mapped_preserved_and_summarized_without_rewriting_source_values():
    user_id = "skill-level-user-legacy"
    _user_skills_cache.pop(user_id, None)
    database = MagicMock()
    database.list.return_value = [
        {
            "id": "skill_python",
            "user_id": user_id,
            "name": "Python",
            "category": "Programming Languages",
            "proficiency": 60,
            "target_proficiency": 90,
            "notes": "keep archived",
            "learning_goal": "keep archived",
            "created_at": "2026-01-01T00:00:00+00:00",
        },
        {
            "id": "skill_sql",
            "user_id": user_id,
            "name": "SQL",
            "category": "Databases",
            "proficiency": 20,
            "target_proficiency": 40,
            "created_at": "2026-01-02T00:00:00+00:00",
        },
    ]

    skills, summary = UserSkillService(database=database).get_user_skills(user_id)

    by_name = {skill["name"]: skill for skill in skills}
    assert by_name["Python"]["current_level"] == "Advanced"
    assert by_name["Python"]["target_level"] == "Expert"
    assert by_name["SQL"]["current_level"] == "Beginner"
    assert by_name["SQL"]["target_level"] == "Intermediate"
    assert all("proficiency" not in skill for skill in skills)
    assert all("learning_goal" not in skill and "notes" not in skill for skill in skills)
    assert summary["advanced_skills"] == 1
    assert summary["skills_to_improve"] == 2

    migration_calls = [call.args for call in database.update.call_args_list]
    assert ("user_skills", f"{user_id}_skill_python", {
        "current_level": "Advanced",
        "target_level": "Expert",
        "legacy_proficiency": 60,
        "legacy_target_proficiency": 90,
        "proficiency": firestore.DELETE_FIELD,
        "target_proficiency": firestore.DELETE_FIELD,
    }) in migration_calls
    assert database.list.return_value[0]["proficiency"] == 60
    assert database.list.return_value[0]["target_proficiency"] == 90
    assert database.list.call_args.kwargs["filters"] == {"user_id": user_id}
