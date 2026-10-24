from fastapi import APIRouter, Depends, HTTPException

from backend.agents.career_manager.graph import CareerManager
from backend.agents.career_manager.state import AgentRequest, CareerState
from backend.agents.digital_twin.calculator import calculate_readiness
from backend.agents.planner.service import recommend_improvement
from backend.api.dependencies import career_states, get_career_manager, get_current_user
from backend.schemas.career import CareerAnalyzeRequest, CareerResponse, WhatIfRequest

router = APIRouter(prefix="/api/v1/career", tags=["career"])


def _response(state: CareerState) -> CareerResponse:
	twin = state.metadata.get("digital_twin", {})
	return CareerResponse(user_id=state.user_id, target_role=state.target_role, target_job_id=state.target_job_id,
						  readiness_score=state.digital_twin_score, skill_gaps=state.skill_gaps,
						  weakest_area=twin.get("weakest_area"), next_action=state.next_action,
						  what_if=state.metadata.get("what_if"))


@router.post("/analyze", response_model=CareerResponse)
async def analyze(payload: CareerAnalyzeRequest, user_id: str = Depends(get_current_user), manager: CareerManager = Depends(get_career_manager)):
	state = CareerState(user_id=user_id, target_role=payload.target_role, target_job_id=payload.target_job_id, profile=payload.profile)
	for name, value in payload.scores.items():
		if hasattr(state, f"{name}_score"):
			setattr(state, f"{name}_score", value)
	result = await manager.run(AgentRequest(user_id=user_id, target_role=payload.target_role, target_job_id=payload.target_job_id, request="full career analysis", data={"profile": payload.profile}), state)
	career_states[user_id] = result

	# Persist career plan to Firestore
	try:
		from datetime import datetime, timezone
		from backend.database.firestore import FirestoreDatabase
		db = FirestoreDatabase()
		plan_doc = {
			"user_id": user_id,
			"target_role": result.target_role,
			"target_job_id": result.target_job_id,
			"readiness_score": result.digital_twin_score,
			"skill_gaps": result.skill_gaps,
			"next_action": result.next_action,
			"metadata": result.metadata,
			"updated_at": datetime.now(timezone.utc).isoformat(),
		}
		db.create("career_plans", f"{user_id}_latest", plan_doc)
		db.create(f"users/{user_id}/careerPlans", "latest", plan_doc)
	except Exception:
		pass

	return _response(result)


@router.get("/readiness", response_model=CareerResponse)
async def readiness(user_id: str = Depends(get_current_user)):
	state = career_states.get(user_id)
	if state is None:
		# Attempt restore from Firestore
		try:
			from backend.database.firestore import FirestoreDatabase
			db = FirestoreDatabase()
			plan = db.get("career_plans", f"{user_id}_latest")
			if plan:
				twin = plan.get("metadata", {}).get("digital_twin", {})
				return CareerResponse(
					user_id=user_id,
					target_role=plan.get("target_role", "Software Engineer"),
					target_job_id=plan.get("target_job_id"),
					readiness_score=plan.get("readiness_score", 0.0),
					skill_gaps=plan.get("skill_gaps", []),
					weakest_area=twin.get("weakest_area"),
					next_action=plan.get("next_action"),
					what_if=plan.get("metadata", {}).get("what_if"),
				)
		except Exception:
			pass
		return CareerResponse(user_id=user_id)
	return _response(state)


@router.post("/what-if")
async def what_if(payload: WhatIfRequest, user_id: str = Depends(get_current_user)):
	state = career_states.get(user_id)
	scores = payload.scores or ({name: getattr(state, f"{name}_score") for name in ("resume", "dsa", "aptitude", "communication", "technical", "interview", "job_match")} if state else {})
	try:
		return recommend_improvement(scores)
	except ValueError as exc:
		raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/next-action", response_model=CareerResponse)
async def next_action(user_id: str = Depends(get_current_user)):
	return await readiness(user_id)


@router.post("/reassess", response_model=CareerResponse)
async def reassess(payload: CareerAnalyzeRequest, user_id: str = Depends(get_current_user), manager: CareerManager = Depends(get_career_manager)):
	return await analyze(payload, user_id, manager)
