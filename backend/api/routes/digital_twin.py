from fastapi import APIRouter, Depends, HTTPException

from backend.agents.career_manager.state import CareerState
from backend.agents.digital_twin.service import DigitalTwinService
from backend.api.dependencies import career_states, firebase_service, get_current_user

router = APIRouter(prefix="/api/v1/digital-twin", tags=["digital-twin"])


@router.get("")
async def get_digital_twin(user_id: str = Depends(get_current_user)):
	state = career_states.get(user_id)
	if state is not None and state.digital_twin_score is not None:
		return state.metadata.get("digital_twin") or {
			"overall_score": state.digital_twin_score,
			"user_id": user_id,
			"target_role": state.target_role,
		}

	history = await DigitalTwinService(firebase_service).history(user_id)
	if history:
		return history[-1]

	if state is not None:
		scores = {name: getattr(state, f"{name}_score", None) for name in (
			"resume", "dsa", "aptitude", "communication", "technical", "interview", "job_match"
		)}
		if any(v is not None for v in scores.values()):
			snapshot = await DigitalTwinService(firebase_service).recalculate(state)
			state.digital_twin_score = snapshot["overall_score"]
			return snapshot

	raise HTTPException(
		status_code=404,
		detail="Digital Twin not found. Please upload a resume or complete an assessment to initialize your twin."
	)


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

