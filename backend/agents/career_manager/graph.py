from typing import Any, Awaitable, Callable, Dict, Optional

from backend.agents.career_manager.nodes import (
	analyze_goal,
	apply_agent_result,
	generate_next_action,
	load_profile,
	run_what_if_planner,
	update_digital_twin,
)
from backend.agents.career_manager.routing import select_route
from backend.agents.career_manager.state import AgentRequest, CareerState


AgentRunner = Callable[[str, CareerState], Any]


class CareerManager:
	def __init__(self, agent_runner: Optional[AgentRunner] = None):
		self.agent_runner = agent_runner

	async def run(self, request: AgentRequest, initial_state: Optional[CareerState] = None) -> CareerState:
		state = initial_state or CareerState(
			user_id=request.user_id,
			target_role=request.target_role,
			target_job_id=request.target_job_id,
		)
		state = load_profile(state, request.data.get("profile"))
		state = analyze_goal(state)
		route = select_route(request.request)
		state.metadata["route"] = route
		for agent in route:
			if agent in ("digital_twin", "planner"):
				continue
			if self.agent_runner is None:
				continue
			result = self.agent_runner(agent, state)
			if hasattr(result, "__await__"):
				result = await result
			state = apply_agent_result(state, agent, result)
		if "digital_twin" in route or "planner" in route or route == ["digital_twin"]:
			state = update_digital_twin(state)
		if "planner" in route:
			state = run_what_if_planner(state)
		return generate_next_action(state)


def build_career_manager(agent_runner: Optional[AgentRunner] = None) -> CareerManager:
	return CareerManager(agent_runner=agent_runner)
