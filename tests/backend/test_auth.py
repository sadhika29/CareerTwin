from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


import uuid

def test_register_and_login():
    uid_suffix = uuid.uuid4().hex[:6]
    username = f"navya_auth_{uid_suffix}"
    response = client.post("/api/v1/auth/register", json={
        "full_name": "Navya Test",
        "username": username,
        "email": f"{username}@example.com",
        "password": "SecurePass1!",
        "confirm_password": "SecurePass1!",
    })
    assert response.status_code == 201
    assert response.json()["user"]["username"] == username
    assert response.json()["access_token"]

    login = client.post("/api/v1/auth/login", json={"identifier": username, "password": "SecurePass1!"})
    assert login.status_code == 200
    assert login.json()["user"]["id"] == response.json()["user"]["id"]


def test_auth_rejects_invalid_password_and_does_not_enumerate_reset_email():
    login = client.post("/api/v1/auth/login", json={"identifier": "missing-user", "password": "wrong"})
    assert login.status_code == 401
    reset = client.post("/api/v1/auth/forgot-password", json={"email": "missing@example.com"})
    assert reset.status_code == 200
    assert "If an account exists" in reset.json()["message"]
