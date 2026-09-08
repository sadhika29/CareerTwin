from typing import Any, Dict, Optional

from backend.agents.career_manager.state import CareerState
from backend.agents.digital_twin.calculator import calculate_readiness
from backend.agents.planner.service import recommend_improvement


def load_profile(state: CareerState, profile: Optional[Dict[str, Any]] = None) -> CareerState:
	state.profile = profile or state.profile
	state.pipeline_stage = "profile_loaded"
	if not state.profile:
		state.errors.append("Profile data is missing")
	return state


def analyze_goal(state: CareerState) -> CareerState:
	if not state.target_role and state.profile.get("target_role"):
		state.target_role = state.profile["target_role"]
	state.pipeline_stage = "goal_identified"
	return state


def apply_agent_result(state: CareerState, agent: str, result: Dict[str, Any]) -> CareerState:
	"""Map one agent's stable output into only its designated state fields."""
	if result.get("status", "success") != "success":
		state.errors.append(result.get("error", f"{agent} failed"))
		return state
	data = result.get("data", result)
	mappings = {
		"resume": ("resume_score", "resume_analysis"),
		"jobs": ("job_match_score", "job_analysis"),
		"skills": ("skills", "skill_gaps"),
		"preparation": ("dsa_score", "aptitude_score", "communication_score", "technical_score"),
		"interview": ("interview_score",),
	}
	for field in mappings.get(agent, ()):
		if field in data:
			setattr(state, field, data[field])
	return state


def update_digital_twin(state: CareerState) -> CareerState:
	scores = {name: getattr(state, f"{name}_score") for name in (
		"resume", "dsa", "aptitude", "communication", "technical", "interview", "job_match"
	)}
	if not any(value is not None for value in scores.values()):
		state.errors.append("No performance data is available for readiness calculation")
		return state
	twin = calculate_readiness(scores)
	state.digital_twin_score = twin["overall_score"]
	state.recommendations = [str(twin["recommended_action"])]
	state.metadata["digital_twin"] = twin
	state.pipeline_stage = "digital_twin_updated"
	return state


def run_what_if_planner(state: CareerState) -> CareerState:
	scores = {name: getattr(state, f"{name}_score") for name in (
		"resume", "dsa", "aptitude", "communication", "technical", "interview", "job_match"
	)}
	if any(value is not None for value in scores.values()):
		state.metadata["what_if"] = recommend_improvement(scores)
	return state


def generate_next_action(state: CareerState) -> CareerState:
	twin = state.metadata.get("digital_twin", {})
	weakest = twin.get("weakest_area")
	state.next_action = state.recommendations[0] if state.recommendations else (
		f"Improve {weakest.replace('_', ' ')} performance by 10 points" if weakest else "Complete a career assessment"
	)
	state.pipeline_stage = "completed"
	return state
