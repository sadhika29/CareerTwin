import pytest
from backend.agents.career_manager.routing import select_route

def test_routing_logic():
    # Test that different requests route to correct agents
    route_resume = select_route("resume analysis")
    assert "resume" in route_resume
    
    route_skills = select_route("skill gap")
    assert "skills" in route_resume or "skills" in select_route("skill gap")
    
    route_full = select_route("full career analysis")
    assert len(route_full) > 1
