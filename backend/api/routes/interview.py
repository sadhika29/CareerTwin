
"""
Interview API routes — powered by InterviewAgent (LLM) and session state tracking.
The AI generates role-specific questions, evaluates answers, provides detailed coaching feedback,
and tracks session scores for placement readiness analytics.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from backend.agents.interview.agent import InterviewAgent
from backend.api.dependencies import get_current_user
from backend.database.firestore import FirestoreDatabase
from backend.services.speechify_service import get_speechify_service

router = APIRouter(prefix="/api/v1/interview", tags=["interview"])

_agent: InterviewAgent | None = None
_sessions: Dict[str, Dict[str, Any]] = {}
_firestore_db: FirestoreDatabase | None = None


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


# ---------------------------------------------------------------------------
# START INTERVIEW — AI generates contextual questions
# ---------------------------------------------------------------------------

@router.post("/start")
async def start_interview(
    payload: Dict[str, Any],
    user_id: str = Depends(get_current_user),
):
    """
    User provides round type (technical/project/HR) and target role.
    The AI generates fresh, role-specific interview questions.
    """
    round_type = str(payload.get("type") or payload.get("round_type") or "technical")
    target_role = str(payload.get("target_role") or "Software Engineer")
    count = int(payload.get("count") or 5)
    difficulty = str(payload.get("difficulty") or "medium")
    skills = payload.get("skills") or []

    try:
        agent = _get_agent()
        questions = agent.generate_questions(
            target_role=target_role,
            round_type=round_type,
            count=count,
            skills=skills,
            difficulty=difficulty,
        )
        session_id = f"iv-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc).isoformat()
        session_record = {
            "session_id": session_id,
            "user_id": user_id,
            "target_role": target_role,
            "round_type": round_type,
            "difficulty": difficulty,
            "questions": questions,
            "answers": {},
            "evaluations": {},
            "status": "in_progress",
            "created_at": now,
            "updated_at": now,
        }
        _sessions[session_id] = session_record

        # Persist session in Firestore
        db = _get_firestore()
        if db:
            try:
                db.create("interviews", session_id, session_record)
            except Exception:
                pass

        return {
            "session_id": session_id,
            "user_id": user_id,
            "target_role": target_role,
            "round_type": round_type,
            "questions": questions,
            "status": "in_progress",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI interview generation failed: {str(e)}")


# ---------------------------------------------------------------------------
# SUBMIT ANSWER — AI evaluates and gives coaching feedback
# ---------------------------------------------------------------------------

@router.post("/{session_id}/answer")
async def submit_answer(
    session_id: str,
    payload: Dict[str, Any],
    user_id: str = Depends(get_current_user),
):
    """
    Student submits an answer to an interview question.
    The AI evaluates it and returns detailed coaching feedback.
    """
    question = payload.get("question", "")
    question_type = payload.get("question_type", "technical")
    candidate_answer = payload.get("answer", "")
    target_role = str(payload.get("target_role") or "Software Engineer")
    expected_key_points = payload.get("expected_key_points")
    selected_option = payload.get("selected_option")
    correct_option = payload.get("correct_option")
    explanation = payload.get("explanation")

    if not candidate_answer and not selected_option:
        raise HTTPException(status_code=400, detail="answer or selected_option is required")

    effective_answer = candidate_answer or (f"Selected option: {selected_option}" if selected_option else "")

    try:
        agent = _get_agent()
        evaluation = agent.evaluate_answer(
            question=question,
            candidate_answer=effective_answer,
            target_role=target_role,
            question_type=question_type,
            expected_key_points=expected_key_points,
            correct_option=correct_option,
            selected_option=selected_option,
            explanation=explanation,
        )

        # Store in session state if session exists
        if session_id in _sessions:
            sess = _sessions[session_id]
            q_key = question[:60] if question else f"q_{len(sess['answers'])+1}"
            sess["answers"][q_key] = candidate_answer
            sess["evaluations"][q_key] = evaluation
            sess["updated_at"] = datetime.now(timezone.utc).isoformat()

        return {
            "session_id": session_id,
            "user_id": user_id,
            "evaluation": evaluation,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI answer evaluation failed: {str(e)}")


# ---------------------------------------------------------------------------
# INTERVIEW RESULT — aggregate session score + narrative feedback
# ---------------------------------------------------------------------------

@router.get("/{session_id}/result")
async def get_interview_result(
    session_id: str,
    user_id: str = Depends(get_current_user),
):
    """
    Returns an aggregated summary of the interview session including overall score,
    accuracy, completeness, and coaching feedback.
    """
    session = _sessions.get(session_id)
    if not session:
        return {
            "session_id": session_id,
            "user_id": user_id,
            "status": "completed",
            "overall_score": 75.0,
            "message": "Interview session completed.",
        }

    evals = list(session.get("evaluations", {}).values())
    if evals:
        overall = round(sum(e.get("overall_score", 70.0) for e in evals) / len(evals), 1)
        accuracy = round(sum(e.get("accuracy_score", 70.0) for e in evals) / len(evals), 1)
        completeness = round(sum(e.get("completeness_score", 70.0) for e in evals) / len(evals), 1)
        clarity = round(sum(e.get("clarity_score", 70.0) for e in evals) / len(evals), 1)
        all_strengths = []
        all_improvements = []
        for e in evals:
            all_strengths.extend(e.get("strengths", []))
            all_improvements.extend(e.get("areas_to_improve", []))
    else:
        overall = 70.0
        accuracy = 70.0
        completeness = 70.0
        clarity = 70.0
        all_strengths = ["Structured approach to questions"]
        all_improvements = ["Provide detailed implementation examples"]

    session["status"] = "completed"
    session["overall_score"] = overall

    # Update in Firestore
    db = _get_firestore()
    if db:
        try:
            db.update("interviews", session_id, {
                "status": "completed",
                "overall_score": overall,
                "accuracy_score": accuracy,
                "completeness_score": completeness,
                "clarity_score": clarity,
                "answers": session.get("answers", {}),
                "evaluations": session.get("evaluations", {}),
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
        "feedback_summary": f"Candidate achieved an overall interview readiness score of {overall}%.",
    }


# ---------------------------------------------------------------------------
# INTERVIEW HISTORY
# ---------------------------------------------------------------------------

@router.get("/history")
async def get_interview_history(user_id: str = Depends(get_current_user)):
    """Returns past interview sessions for the user from Firestore & cache."""
    db = _get_firestore()
    firestore_sessions = []
    if db:
        try:
            records = db.list("interviews", filters={"user_id": user_id})
            for r in records:
                _sessions[r["session_id"]] = r
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
            "answers_count": len(s.get("answers", {})),
        }
        for s in _sessions.values()
        if s.get("user_id") == user_id
    ]

    return {
        "user_id": user_id,
        "sessions": sorted(user_sessions, key=lambda x: str(x.get("created_at", "")), reverse=True),
    }


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
async def synthesize_speech_post(payload: Dict[str, Any]):
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
                "Cache-Control": "public, max-age=3600",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")


@router.get("/tts")
async def synthesize_speech_get(text: str, voice_id: Optional[str] = None):
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
                "Cache-Control": "public, max-age=3600",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")
