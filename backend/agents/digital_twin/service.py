from datetime import datetime, timezone
from typing import Any, Dict, Optional

from backend.agents.career_manager.state import CareerState
from backend.agents.digital_twin.calculator import calculate_readiness
from backend.services.firebase_service import FirebaseService


class DigitalTwinService:
	def __init__(self, firebase: FirebaseService):
		self.firebase = firebase

	async def recalculate(self, state: CareerState) -> Dict[str, Any]:
		scores = {name: getattr(state, f"{name}_score") for name in (
			"resume", "dsa", "aptitude", "communication", "technical", "interview", "job_match"
		)}
		result = calculate_readiness(scores)
		snapshot = {
			"user_id": state.user_id,
			"target_role": state.target_role,
			"target_job_id": state.target_job_id,
			"created_at": datetime.now(timezone.utc).isoformat(),
			**result,
		}
		await self.firebase.set("digital_twin_snapshots", f"{state.user_id}:{snapshot['created_at']}", snapshot)
		return snapshot

	async def history(self, user_id: str):
		return await self.firebase.list("digital_twin_snapshots", user_id=user_id)
