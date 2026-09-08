import pytest

from backend.agents.career_manager.graph import CareerManager
from backend.agents.career_manager.state import AgentRequest


@pytest.mark.asyncio
async def test_mocked_multi_agent_career_flow():
    async def runner(agent, state):
        outputs = {
            "resume": {"resume_score": 80},
            "jobs": {"job_match_score": 82},
            "skills": {"skills": ["Python"], "skill_gaps": ["System Design"]},
            "preparation": {"dsa_score": 60, "aptitude_score": 75, "communication_score": 70, "technical_score": 78},
            "interview": {"interview_score": 65},
        }
        return {"agent": agent, "status": "success", "data": outputs[agent]}

    state = await CareerManager(runner).run(AgentRequest(user_id="u1", request="full career analysis"))
    assert state.digital_twin_score == 73.15
    assert state.metadata["what_if"]["recommended_area"] == "technical"
    assert state.next_action