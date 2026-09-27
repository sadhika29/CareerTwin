import pytest
from backend.agents.digital_twin.calculator import calculate_readiness
from backend.agents.career_manager.state import CareerState

def test_calculate_readiness():
    state = CareerState(user_id="user_123")
    state.resume_score = 80
    state.dsa_score = 70
    state.aptitude_score = 90
    
    twin = calculate_readiness(state)
    assert twin is not None
    assert twin["overall_score"] > 0
    assert twin["weakest_area"] == "DSA"  # Because dsa is 70 and aptitude is 90
