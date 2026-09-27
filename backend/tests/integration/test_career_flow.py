from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_readiness_endpoint():
    response = client.get("/api/v1/career/readiness", headers={"x-user-id": "test_user"})
    assert response.status_code == 200
    assert response.json()["user_id"] == "test_user"

def test_digital_twin_endpoint_not_found():
    # If the user has no state, it should return 404
    response = client.get("/api/v1/digital-twin", headers={"x-user-id": "unknown_user"})
    assert response.status_code == 404
