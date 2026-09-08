import pytest
from fastapi.testclient import TestClient

from backend.agents.career_manager.routing import select_route
from backend.agents.digital_twin.calculator import calculate_readiness
from backend.agents.planner.service import recommend_improvement
from backend.main import app


def test_routing_avoids_unnecessary_agents():
    assert select_route("What skills am I missing?") == ["skills"]
    assert select_route("Help me prepare for an interview") == ["interview"]


def test_readiness_renormalizes_available_scores():
    result = calculate_readiness({"resume": 80, "dsa": 60})
    assert result["overall_score"] == 70.0
    assert result["weakest_area"] == "dsa"


def test_planner_uses_configured_impact():
    result = recommend_improvement({"resume": 80, "dsa": 60, "technical": 78})
    assert result["recommended_area"] == "technical"


def test_api_requires_authentication_and_handles_empty_planner_input():
    client = TestClient(app)
    assert client.get("/api/v1/career/readiness").status_code == 401
    assert client.post("/api/v1/career/what-if", headers={"X-User-ID": "new"}, json={}).status_code == 400