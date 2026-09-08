from fastapi import APIRouter, Depends, HTTPException

from backend.agents.digital_twin.service import DigitalTwinService
from backend.api.dependencies import career_states, firebase_service, get_current_user

router = APIRouter(prefix="/api/v1/digital-twin", tags=["digital-twin"])


@router.get("")
async def get_digital_twin(user_id: str = Depends(get_current_user)):
	state = career_states.get(user_id)
	if state is None or state.digital_twin_score is None:
		raise HTTPException(status_code=404, detail="Digital Twin not found")
	return state.metadata["digital_twin"]


@router.get("/history")
async def history(user_id: str = Depends(get_current_user)):
	return await DigitalTwinService(firebase_service).history(user_id)


@router.post("/recalculate")
async def recalculate(user_id: str = Depends(get_current_user)):
	state = career_states.get(user_id)
	if state is None:
		raise HTTPException(status_code=404, detail="Career state not found")
	return await DigitalTwinService(firebase_service).recalculate(state)
