from __future__ import annotations

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from backend.agents.interview.agent import InterviewAgent
from backend.agents.interview.question_catalog import matching_patterns
from backend.api.routes import interview as interview_routes
from backend.schemas.interview import InterviewStartRequest


def valid_start_payload(**overrides):
    values = {
        "type": "technical",
        "target_role": "Backend Developer",
        "count": 5,
        "difficulty": "medium",
        "experience_level": "fresher",
    }
    values.update(overrides)
    return InterviewStartRequest(**values)


@pytest.mark.parametrize(
    "changes",
    [
        {"type": "not_a_format"},
        {"difficulty": "extreme"},
        {"experience_level": "expert"},
        {"count": 7},
        {"target_role": "   "},
    ],
)
def test_interview_configuration_rejects_unsupported_values(changes):
    with pytest.raises(ValidationError):
        valid_start_payload(**changes)


def test_interview_configuration_requires_company_and_resume_for_personalized_modes():
    request = valid_start_payload(type="company_specific")
    with pytest.raises(HTTPException) as company_error:
        interview_routes.start_interview(request, user_id="owner")
    assert company_error.value.status_code == 422

    request = valid_start_payload(type="resume_based")
    with pytest.raises(HTTPException) as resume_error:
        interview_routes.start_interview(request, user_id="owner")
    assert resume_error.value.status_code == 422


def test_public_question_catalog_is_attributed_and_reports_retrieval_time():
    patterns = matching_patterns("Backend Developer", "technical")
    assert patterns
    assert all(pattern["source_url"].startswith("https://") for pattern in patterns)
    assert all(pattern["source_platform"] for pattern in patterns)
    assert all(pattern["catalog_researched_at"] for pattern in patterns)
    assert all(pattern["catalog_matched_at"] for pattern in patterns)
    assert all("generated questions are original" in pattern["attribution"] for pattern in patterns)


def test_fallback_questions_are_contextual_and_multiple_choice_has_options():
    agent = InterviewAgent(llm_client=None)
    scenario = agent.generate_questions(
        target_role="Python Backend Developer", round_type="scenario", count=1,
        difficulty="hard", experience_level="experienced",
        previous_answer="I would inspect the API error logs first.",
        asked_questions=["old question"],
    )[0]
    assert "previous answer" in scenario["question"].lower()
    assert scenario["origin"] == "CareerTwin fallback original practice question"

    mcq = agent.generate_questions(
        target_role="Backend Developer", round_type="multiple_choice", count=1,
    )[0]
    assert len(mcq["options"]) == 4
    assert mcq["correct_option"] == "A"


class FakeDatabase:
    def __init__(self):
        self.records = {}

    def create(self, collection, document_id, data):
        self.records[(collection, document_id)] = dict(data)

    def update(self, collection, document_id, data):
        self.records.setdefault((collection, document_id), {}).update(data)

    def get(self, collection, document_id):
        record = self.records.get((collection, document_id))
        return dict(record) if record else None

    def list(self, collection, filters=None, limit=50):
        return [dict(record) for (name, _), record in self.records.items()
                if name == collection and all(record.get(key) == value for key, value in (filters or {}).items())][:limit]


class FakeAgent:
    def __init__(self):
        self.last_generate_kwargs = None

    def generate_questions(self, **kwargs):
        self.last_generate_kwargs = kwargs
        return [{
            "question_id": "generated-id",
            "question": f"How would you approach this {kwargs['target_role']} problem?",
            "options": [], "expected_key_points": ["constraints"],
            "correct_option": "", "explanation": "internal key",
        }]

    def evaluate_answer(self, **kwargs):
        return {
            "overall_score": 82.0,
            "accuracy_score": 80.0,
            "completeness_score": 84.0,
            "clarity_score": 82.0,
            "strengths": ["Clear approach"],
            "areas_to_improve": ["Discuss edge cases"],
            "feedback_summary": "Good response.",
            "ideal_answer": "A concise response.",
        }


def test_resume_based_interview_uses_only_the_authenticated_users_saved_resume(monkeypatch):
    database = FakeDatabase()
    database.records[("resumes", "resume-1")] = {
        "resume_id": "resume-1",
        "user_id": "account-a",
        "filename": "candidate.pdf",
        "text": "Built a FastAPI service and optimized PostgreSQL queries.",
        "skills": ["Python", "PostgreSQL"],
        "analysis": {"projects": ["CareerTwin API"]},
    }
    agent = FakeAgent()
    monkeypatch.setattr(interview_routes, "_sessions", {})
    monkeypatch.setattr(interview_routes, "_get_firestore", lambda: database)
    monkeypatch.setattr(interview_routes, "_get_agent", lambda: agent)

    request = valid_start_payload(type="resume_based", resume_id="resume-1")
    started = interview_routes.start_interview(request, user_id="account-a")
    assert started["persistence"] == "firestore"
    assert "FastAPI service" in agent.last_generate_kwargs["resume_context"]
    assert "CareerTwin API" in agent.last_generate_kwargs["resume_context"]

    with pytest.raises(HTTPException) as ownership_error:
        interview_routes.start_interview(request, user_id="account-b")
    assert ownership_error.value.status_code == 404


def test_interview_session_persists_adapts_and_is_user_scoped(monkeypatch):
    database = FakeDatabase()
    monkeypatch.setattr(interview_routes, "_sessions", {})
    monkeypatch.setattr(interview_routes, "_get_firestore", lambda: database)
    monkeypatch.setattr(interview_routes, "_get_agent", lambda: FakeAgent())

    started = interview_routes.start_interview(
        valid_start_payload(job_description="Build reliable REST APIs"), user_id="account-a"
    )
    assert started["persistence"] == "firestore"
    assert "correct_option" not in started["questions"][0]
    assert "explanation" not in started["questions"][0]

    with pytest.raises(HTTPException) as ownership_error:
        interview_routes.get_interview_session(started["session_id"], user_id="account-b")
    assert ownership_error.value.status_code == 404

    for index in range(5):
        session = interview_routes._sessions[started["session_id"]]
        active_question = session["questions"][-1]
        answer = interview_routes.submit_answer(
            started["session_id"],
            interview_routes.InterviewAnswerRequest(question_id=active_question["question_id"], answer="I would define constraints and test edge cases."),
            user_id="account-a",
        )
        assert answer["question_index"] == index + 1
        if index < 4:
            assert answer["next_question"]
        else:
            assert answer["next_question"] is None
            assert answer["status"] == "completed"

    session_id = started["session_id"]
    monkeypatch.setattr(interview_routes, "_sessions", {})
    restored = interview_routes.get_interview_session(session_id, user_id="account-a")
    assert restored["question_index"] == 5
    assert len(restored["answers"]) == 5
    assert restored["status"] == "completed"
    final_result = interview_routes.get_interview_result(session_id, user_id="account-a")
    assert final_result["overall_score"] == 82.0
