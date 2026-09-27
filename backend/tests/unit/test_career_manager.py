import pytest
from backend.agents.career_manager.graph import build_career_manager
from backend.agents.career_manager.state import AgentRequest, CareerState

@pytest.mark.asyncio
async def test_career_manager_initialization():
    manager = build_career_manager()
    assert manager is not None

@pytest.mark.asyncio
async def test_career_manager_run():
    manager = build_career_manager()
    request = AgentRequest(user_id="user_123", target_role="Software Engineer", request="career update")
    # Using the manager without actual agent_runner will just test routing and twin/planner
    result = await manager.run(request)
    assert result.user_id == "user_123"
    assert result.target_role == "Software Engineer"
    assert "route" in result.metadata
