"""Regression tests for production-safe access to privileged integrations."""

from fastapi.testclient import TestClient

from backend.main import app
from backend.services import speechify_service


client = TestClient(app)


def test_admin_routes_fail_closed_without_an_explicit_admin_configuration(monkeypatch):
    monkeypatch.delenv("ADMIN_SECRET", raising=False)
    monkeypatch.delenv("ADMIN_UIDS", raising=False)

    response = client.get("/admin/db/collections")

    assert response.status_code == 403


def test_tts_returns_a_clear_service_unavailable_response_without_a_key(monkeypatch):
    monkeypatch.delenv("SPEECHIFY_API_KEY", raising=False)
    monkeypatch.setattr(speechify_service, "_service", None)

    response = client.post("/api/v1/interview/tts", json={"text": "Hello"})

    assert response.status_code == 503
    assert response.json()["detail"] == "Speech synthesis is not configured"
