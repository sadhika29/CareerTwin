
"""
Interview API routes — powered by InterviewAgent (LLM) and session state tracking.
The AI generates role-specific questions, evaluates answers, provides detailed coaching feedback,
and tracks session scores for placement readiness analytics.
"""
from __future__ import annotations

import uuid
import logging
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from backend.agents.interview.agent import InterviewAgent
from backend.api.dependencies import get_current_user
from backend.database.firestore import FirestoreDatabase
from backend.agents.interview.question_catalog import matching_patterns
from backend.schemas.interview import InterviewAnswerRequest, InterviewStartRequest
from backend.services.speechify_service import get_speechify_service

router = APIRouter(prefix="/api/v1/interview", tags=["interview"])

_agent: InterviewAgent | None = None
_sessions: Dict[str, Dict[str, Any]] = {}
_firestore_db: FirestoreDatabase | None = None
logger = logging.getLogger(__name__)


def _get_firestore() -> FirestoreDatabase | None:
    global _firestore_db
    if _firestore_db is None:
        try:
            _firestore_db = FirestoreDatabase()
        except Exception:
            _firestore_db = None
    return _firestore_db


def _get_agent() -> InterviewAgent:
    global _agent
    if _agent is None:
        _agent = InterviewAgent()
    return _agent


def _public_question(question: Dict[str, Any]) -> Dict[str, Any]:
    """Keep answer keys on the server until the candidate submits."""
    return {key: value for key, value in question.items() if key not in {"correct_option", "explanation"}}


# ---------------------------------------------------------------------------
# START INTERVIEW — AI generates contextual questions
# ---------------------------------------------------------------------------

@router.post("/start")
def start_interview(
    payload: InterviewStartRequest,
    user_id: str = Depends(get_current_user),
):
    """
    User provides round type (technical/project/HR) and target role.
    The AI generates fresh, role-specific interview questions.
    """
    config = payload.model_dump(mode="json")
    round_type = config["type"]
    target_role = config["target_role"]
    count = config["count"]
    difficulty = config["difficulty"]
    experience_level = config["experience_level"]
    company = config.get("target_company")
    if round_type == "company_specific" and not company:
        raise HTTPException(status_code=422, detail="Target company is required for a company-specific interview.")
    if round_type == "resume_based" and not config.get("resume_id"):
        raise HTTPException(status_code=422, detail="Select a saved resume for a resume-based interview.")

    resume_context = ""
    if config.get("resume_id"):
        db = _get_firestore()
        if not db:
            raise HTTPException(status_code=503, detail="Resume storage is unavailable.")
        try:
            resume = db.get("resumes", config["resume_id"])
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"Could not load the selected resume: {exc}")
        if not resume or resume.get("user_id") != user_id:
            raise HTTPException(status_code=404, detail="Selected resume was not found for this account.")
        analysis = resume.get("analysis") or {}
        resume_context = "\n".join(filter(None, [
            str(resume.get("text") or "")[:9000],
            "Projects: " + "; ".join(map(str, analysis.get("projects", [])[:8])) if isinstance(analysis.get("projects"), list) else "",
            "Skills: " + ", ".join(map(str, resume.get("skills") or analysis.get("resume_skills") or [])),
        ]))[:12000]

    patterns = matching_patterns(target_role, round_type)
    asked_questions: list[str] = []

    try:
        agent = _get_agent()
        questions = agent.generate_questions(
            target_role=target_role,
            round_type=round_type,
            count=1,
            skills=[],
            difficulty=difficulty,
            company=company,
            experience_level=experience_level,
            job_description=config.get("job_description"),
            resume_context=resume_context,
            research_patterns=patterns,
        )
        questions[0]["question_id"] = f"q_{uuid.uuid4().hex[:10]}"
        session_id = f"iv-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc).isoformat()
        session_record = {
            "session_id": session_id,
            "user_id": user_id,
            "target_role": target_role,
            "round_type": round_type,
            "difficulty": difficulty,
            "experience_level": experience_level,
            "target_company": company,
            "resume_id": config.get("resume_id"),
            "resume_context": resume_context,
            "job_description": config.get("job_description"),
            "question_count": count,
            "question_index": 0,
            "questions": questions,
            "answers": [],
            "evaluations": [],
            "research_sources": patterns,
            "persistence": "memory_fallback",
            "status": "in_progress",
            "created_at": now,
            "updated_at": now,
        }
        _sessions[session_id] = session_record

        persistence = "memory_fallback"
        db = _get_firestore()
        if db:
            try:
                db.create("interviews", session_id, session_record)
                persistence = "firestore"
                session_record["persistence"] = persistence
                db.update("interviews", session_id, {"persistence": persistence})
            except Exception:
                logger.exception("Could not persist interview session %s", session_id)

        return {
            "session_id": session_id,
            "user_id": user_id,
            "target_role": target_role,
            "round_type": round_type,
            "questions": [_public_question(question) for question in questions],
            "question_count": count,
            "difficulty": difficulty,
            "experience_level": experience_level,
            "target_company": company,
            "sources": patterns,
            "persistence": persistence,
            "status": "in_progress",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI interview generation failed: {str(e)}")


# ---------------------------------------------------------------------------
# SUBMIT ANSWER — AI evaluates and gives coaching feedback
# ---------------------------------------------------------------------------

@router.post("/{session_id}/answer")
def submit_answer(
    session_id: str,
    payload: InterviewAnswerRequest,
    user_id: str = Depends(get_current_user),
):
    """
    Student submits an answer to an interview question.
    The AI evaluates it and returns detailed coaching feedback.
    """
    data = payload.model_dump()
    sess = _get_owned_session(session_id, user_id, active_only=True)
    previous_session = deepcopy(sess)
    question = next((q for q in sess.get("questions", []) if q.get("question_id") == data["question_id"]), None)
    active_index = sess.get("question_index", 0)
    active_question = sess.get("questions", [])[active_index] if active_index < len(sess.get("questions", [])) else None
    if not question or active_question is None or data["question_id"] != active_question.get("question_id"):
        raise HTTPException(status_code=409, detail="This question is not the active question for the session.")
    candidate_answer = data["answer"].strip()
    code = data["code"].strip()
    selected_option = data.get("selected_option")
    if not data["skip"] and not candidate_answer and not code and not selected_option:
        raise HTTPException(status_code=400, detail="Answer, code, or a selected option is required.")
    effective_answer = "\n\nCode submitted:\n" + code if code else candidate_answer
    if candidate_answer and code:
        effective_answer = candidate_answer + "\n\nCode submitted:\n" + code

    try:
        agent = _get_agent()
        evaluation = None if data["skip"] else agent.evaluate_answer(
            question=question.get("question", ""),
            candidate_answer=effective_answer,
            target_role=sess["target_role"],
            question_type=sess["round_type"],
            expected_key_points=question.get("expected_key_points"),
            correct_option=question.get("correct_option"),
            selected_option=selected_option,
            explanation=question.get("explanation"),
        )

        sess["answers"].append({"question_id": data["question_id"], "answer": candidate_answer, "code": code, "selected_option": selected_option, "skipped": data["skip"]})
        if evaluation is not None:
            evaluation["score"] = evaluation.get("overall_score", evaluation.get("score", 0))
            evaluation["max_score"] = 100
            evaluation["feedback"] = evaluation.get("feedback_summary", evaluation.get("feedback", ""))
            evaluation["improvements"] = evaluation.get("areas_to_improve", evaluation.get("improvements", []))
            evaluation["suggested_answer"] = evaluation.get("ideal_answer", evaluation.get("suggested_answer", ""))
        sess["evaluations"].append({"question_id": data["question_id"], "evaluation": evaluation})
        sess["question_index"] = len(sess["answers"])
        sess["updated_at"] = datetime.now(timezone.utc).isoformat()

        next_question = None
        if len(sess["answers"]) < sess["question_count"]:
            previously_asked = [item.get("question", "") for item in sess.get("questions", [])]
            if sess.get("question_index", 0) < len(sess.get("questions", [])):
                next_question = sess["questions"][sess["question_index"]]
            else:
                generated = agent.generate_questions(
                    target_role=sess["target_role"], round_type=sess["round_type"], count=1,
                    difficulty=sess["difficulty"], company=sess.get("target_company"),
                    experience_level=sess.get("experience_level", "intermediate"),
                    job_description=sess.get("job_description"),
                    resume_context=sess.get("resume_context"),
                    research_patterns=sess.get("research_sources", []),
                    asked_questions=previously_asked,
                    previous_answer=effective_answer,
                )
                next_question = generated[0]
                next_question["question_id"] = f"q_{uuid.uuid4().hex[:10]}"
                sess["questions"].append(next_question)
        else:
            sess["status"] = "completed"
            sess["completed_at"] = datetime.now(timezone.utc).isoformat()

        db = _get_firestore()
        if db:
            try:
                db.update("interviews", session_id, sess)
            except Exception as exc:
                _sessions[session_id] = previous_session
                raise HTTPException(status_code=503, detail=f"Could not save your answer to Firebase: {exc}") from exc

        return {
            "session_id": session_id,
            "user_id": user_id,
            "evaluation": evaluation,
            "next_question": _public_question(next_question) if next_question else None,
            "status": sess["status"],
            "question_index": sess["question_index"],
            "question_count": sess["question_count"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI answer evaluation failed: {str(e)}")


# ---------------------------------------------------------------------------
# INTERVIEW RESULT — aggregate session score + narrative feedback
# ---------------------------------------------------------------------------

@router.get("/{session_id}/result")
def get_interview_result(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Returns an aggregated summary of the interview session including overall score,
    accuracy, completeness, and coaching feedback.
    """
    session = _get_owned_session(session_id, user_id, active_only=False)
    if session.get("status") != "completed":
        raise HTTPException(status_code=409, detail="Complete the interview before requesting its final result.")

    evals = [item.get("evaluation") or {} for item in session.get("evaluations", []) if item.get("evaluation")]
    if evals:
        overall = round(sum(e.get("overall_score", 0.0) for e in evals) / len(evals), 1)
        accuracy = round(sum(e.get("accuracy_score", 0.0) for e in evals) / len(evals), 1)
        completeness = round(sum(e.get("completeness_score", 0.0) for e in evals) / len(evals), 1)
        clarity = round(sum(e.get("clarity_score", 0.0) for e in evals) / len(evals), 1)
        all_strengths = []
        all_improvements = []
        for e in evals:
            all_strengths.extend(e.get("strengths", []))
            all_improvements.extend(e.get("areas_to_improve", []))
    else:
        overall = accuracy = completeness = clarity = 0.0
        all_strengths = []
        all_improvements = []

    session["status"] = "completed"
    session["overall_score"] = overall

    # Update in Firestore
    session["completed_at"] = session.get("completed_at") or datetime.now(timezone.utc).isoformat()
    db = _get_firestore()
    if db:
        try:
            db.update("interviews", session_id, {
                "status": "completed",
                "overall_score": overall,
                "accuracy_score": accuracy,
                "completeness_score": completeness,
                "clarity_score": clarity,
                "answers": session.get("answers", []),
                "evaluations": session.get("evaluations", []),
                "completed_at": session.get("completed_at"),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception:
            pass

    # Sync into active CareerState
    try:
        from backend.api.dependencies import career_states
        from backend.agents.career_manager.state import CareerState
        state = career_states.get(user_id)
        if state is None:
            state = CareerState(user_id=user_id, target_role=session.get("target_role", "Software Engineer"))
            career_states[user_id] = state
        state.interview_score = overall
    except Exception:
        pass

    return {
        "session_id": session_id,
        "user_id": user_id,
        "target_role": session.get("target_role", "Software Engineer"),
        "status": "completed",
        "overall_score": overall,
        "accuracy_score": accuracy,
        "completeness_score": completeness,
        "clarity_score": clarity,
        "total_questions_answered": len(evals),
        "strengths": list(dict.fromkeys(all_strengths))[:4],
        "areas_to_improve": list(dict.fromkeys(all_improvements))[:4],
        "feedback_summary": (
            f"Candidate achieved an overall interview readiness score of {overall}%."
            if evals else "No responses were scored, so no overall interview score is available."
        ),
    }


# ---------------------------------------------------------------------------
# INTERVIEW HISTORY
# ---------------------------------------------------------------------------

@router.get("/history")
def get_interview_history(user_id: str = Depends(get_current_user)):
    """Returns past interview sessions for the user from Firestore & cache."""
    db = _get_firestore()
    firestore_sessions = []
    if db:
        try:
            records = db.list("interviews", filters={"user_id": user_id})
            for r in records:
                sid = r.get("session_id") or r.get("id") or r.get("document_id")
                if sid:
                    _sessions[sid] = r
        except Exception:
            pass

    user_sessions = [
        {
            "session_id": s["session_id"],
            "target_role": s.get("target_role", ""),
            "round_type": s.get("round_type", "technical"),
            "difficulty": s.get("difficulty", "medium"),
            "overall_score": s.get("overall_score"),
            "status": s.get("status", "in_progress"),
            "created_at": s.get("created_at"),
            "answers_count": len(s.get("answers", [])),
        }
        for s in _sessions.values()
        if s.get("user_id") == user_id
    ]

    return {
        "user_id": user_id,
        "sessions": sorted(user_sessions, key=lambda x: str(x.get("created_at", "")), reverse=True),
    }


@router.get("/{session_id}/session")
def get_interview_session(session_id: str, user_id: str = Depends(get_current_user)):
    """Restore an interview room from the authenticated user's saved session."""
    session = _get_owned_session(session_id, user_id, active_only=False)
    return {
        "session_id": session_id,
        "user_id": user_id,
        "target_role": session.get("target_role"),
        "round_type": session.get("round_type"),
        "difficulty": session.get("difficulty"),
        "experience_level": session.get("experience_level"),
        "target_company": session.get("target_company"),
        "question_count": session.get("question_count", len(session.get("questions", []))),
        "question_index": session.get("question_index", 0),
        "questions": [_public_question(question) for question in session.get("questions", [])],
        "answers": session.get("answers", []),
        "evaluations": session.get("evaluations", []),
        "status": session.get("status"),
        "persistence": session.get("persistence", "unknown"),
    }


def _get_owned_session(session_id: str, user_id: str, active_only: bool = False) -> Dict[str, Any]:
    session = _sessions.get(session_id)
    if not session:
        db = _get_firestore()
        if db:
            try:
                session = db.get("interviews", session_id)
            except Exception as exc:
                raise HTTPException(status_code=503, detail=f"Could not load interview session: {exc}")
            if session:
                session.setdefault("persistence", "firestore")
                _sessions[session_id] = session
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    if session.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    if active_only and session.get("status") != "in_progress":
        raise HTTPException(status_code=409, detail="Interview session is already complete.")
    _normalize_legacy_interview_session(session)
    return session


def _normalize_legacy_interview_session(session: Dict[str, Any]) -> None:
    """Keep older sessions resumable while the new flow generates one question per turn."""
    questions = session.get("questions", [])
    if isinstance(questions, dict):
        questions = list(questions.values())
        session["questions"] = questions
    if not isinstance(questions, list):
        session["questions"] = []
        questions = session["questions"]

    answers = session.get("answers", [])
    if isinstance(answers, dict):
        converted = []
        for key, value in answers.items():
            match = next((q for q in questions if str(q.get("question", "")).startswith(str(key))), None)
            if match:
                converted.append({"question_id": match.get("question_id"), "answer": value, "code": "", "selected_option": None, "skipped": False})
        session["answers"] = answers = converted
    elif not isinstance(answers, list):
        session["answers"] = answers = []

    evaluations = session.get("evaluations", [])
    if isinstance(evaluations, dict):
        converted = []
        for key, value in evaluations.items():
            match = next((q for q in questions if str(q.get("question", "")).startswith(str(key))), None)
            if match:
                converted.append({"question_id": match.get("question_id"), "evaluation": value})
        session["evaluations"] = converted
    elif not isinstance(evaluations, list):
        session["evaluations"] = []

    session.setdefault("question_count", len(questions))
    session.setdefault("question_index", len(answers))
    for index, question in enumerate(questions):
        question.setdefault("question_id", f"legacy_q_{index + 1}")


# ---------------------------------------------------------------------------
# SPEECHIFY AI TEXT-TO-SPEECH (TTS) ENDPOINTS
# ---------------------------------------------------------------------------

@router.get("/voices")
async def get_interview_voices():
    """Returns curated & available Speechify AI voices for VeriBot."""
    service = get_speechify_service()
    return {
        "provider": "Speechify AI (Simba 3.2)",
        "voices": service.get_voices(),
    }


@router.post("/tts")
async def synthesize_speech_post(payload: Dict[str, Any], user_id: str = Depends(get_current_user)):
    """Streams MP3 audio generated by Speechify AI for interview questions."""
    text = payload.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    voice_id = payload.get("voice_id")
    model = payload.get("model")

    service = get_speechify_service()
    try:
        return StreamingResponse(
            service.stream_speech(text, voice_id=voice_id, model=model),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": 'inline; filename="veribot_speech.mp3"',
                "Cache-Control": "private, no-store",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")


@router.get("/tts")
async def synthesize_speech_get(text: str, voice_id: Optional[str] = None, user_id: str = Depends(get_current_user)):
    """GET endpoint for direct audio streaming in <audio> elements or Audio() in browser."""
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    service = get_speechify_service()
    try:
        return StreamingResponse(
            service.stream_speech(text, voice_id=voice_id),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": 'inline; filename="veribot_speech.mp3"',
                "Cache-Control": "private, no-store",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")
