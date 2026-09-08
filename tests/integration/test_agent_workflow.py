import pytest

from backend.agents.career_manager.graph import CareerManager
from backend.agents.career_manager.state import AgentRequest


@pytest.mark.asyncio
async def test_agent_failure_is_retained_without_crashing_workflow():
    async def runner(agent, state):
        if agent == "skills":
            return {"agent": agent, "status": "error", "error": "skills unavailable"}
        return {"agent": agent, "status": "success", "data": {"resume_score": 80}}

    state = await CareerManager(runner).run(AgentRequest(user_id="u1", request="What skills am I missing?"))
    assert "skills unavailable" in state.errors
    assert state.pipeline_stage == "completed"