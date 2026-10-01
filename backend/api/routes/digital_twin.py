from fastapi import APIRouter, Depends, HTTPException

from backend.agents.career_manager.state import CareerState
from backend.agents.digital_twin.service import DigitalTwinService
from backend.api.dependencies import career_states, firebase_service, get_current_user

router = APIRouter(prefix="/api/v1/digital-twin", tags=["digital-twin"])


@router.get("")
async def get_digital_twin(user_id: str = Depends(get_current_user)):
	state = career_states.get(user_id)
	if state is None or state.digital_twin_score is None:
		history = await DigitalTwinService(firebase_service).history(user_id)
		if history:
			return history[-1]
		if user_id != "demo-student":
			raise HTTPException(status_code=404, detail="Digital Twin not found")
		# Create baseline state
		default_state = CareerState(
			user_id=user_id,
			target_role=state.target_role if state else "Software Engineer",
			resume_score=getattr(state, "resume_score", None) or 75.0,
			job_match_score=getattr(state, "job_match_score", None) or 70.0,
			dsa_score=getattr(state, "dsa_score", None) or 65.0,
			aptitude_score=getattr(state, "aptitude_score", None) or 70.0,
			technical_score=getattr(state, "technical_score", None) or 70.0,
			communication_score=getattr(state, "communication_score", None) or 75.0,
			interview_score=getattr(state, "interview_score", None) or 68.0,
		)
		career_states[user_id] = default_state
		snapshot = await DigitalTwinService(firebase_service).recalculate(default_state)
		return snapshot
	return state.metadata.get("digital_twin") or {
		"overall_score": state.digital_twin_score,
		"user_id": user_id,
		"target_role": state.target_role,
	}


@router.get("/history")
async def history(user_id: str = Depends(get_current_user)):
	return await DigitalTwinService(firebase_service).history(user_id)


@router.post("/recalculate")
async def recalculate(user_id: str = Depends(get_current_user)):
	state = career_states.get(user_id)
	if state is None:
		state = CareerState(user_id=user_id, target_role="Software Engineer")
		career_states[user_id] = state
	return await DigitalTwinService(firebase_service).recalculate(state)

