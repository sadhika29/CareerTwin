import time
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
from firebase_admin.auth import ExpiredIdTokenError, InvalidIdTokenError

from backend.api.dependencies import get_current_user
from backend.database.firebase import verify_firebase_id_token, DEFAULT_CLOCK_SKEW_SECONDS


class DummyRequest:
    def __init__(self, query_params=None):
        self.query_params = query_params or {}


def test_verify_firebase_id_token_valid():
    """Verify that a valid token returns decoded claims and uid."""
    mock_decoded = {
        "uid": "usr_test_12345",
        "sub": "usr_test_12345",
        "email": "test@careertwin.ai",
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
        "aud": "carrr-c4bc0",
        "iss": "https://securetoken.google.com/carrr-c4bc0",
    }

    with patch("firebase_admin.auth.verify_id_token", return_value=mock_decoded) as mock_verify:
        claims = verify_firebase_id_token("mock_token_abc", clock_skew_seconds=5)
        assert claims["uid"] == "usr_test_12345"
        mock_verify.assert_called_once_with(
            "mock_token_abc",
            check_revoked=False,
            clock_skew_seconds=5,
        )


def test_verify_firebase_id_token_tolerates_clock_skew():
    """Verify that verify_id_token is called with the requested clock_skew_seconds parameter."""
    now = int(time.time())
    # Simulated token where iat is 2 seconds ahead of server clock
    mock_decoded = {
        "uid": "usr_skewed_clock",
        "iat": now + 2,
        "exp": now + 3602,
    }

    with patch("firebase_admin.auth.verify_id_token", return_value=mock_decoded) as mock_verify:
        claims = verify_firebase_id_token("mock_skewed_token", clock_skew_seconds=5)
        assert claims["uid"] == "usr_skewed_clock"
        assert mock_verify.call_args[1]["clock_skew_seconds"] == 5


def test_verify_firebase_id_token_rejects_empty():
    """Verify that empty or non-string tokens are immediately rejected."""
    with pytest.raises(ValueError, match="must be a non-empty string"):
        verify_firebase_id_token("")

    with pytest.raises(ValueError, match="must be a non-empty string"):
        verify_firebase_id_token(None)


def test_verify_firebase_id_token_rejects_expired():
    """Verify that expired tokens raise ExpiredIdTokenError."""
    with patch(
        "firebase_admin.auth.verify_id_token",
        side_effect=ExpiredIdTokenError("Token has expired", "raw_token"),
    ):
        with pytest.raises(ExpiredIdTokenError):
            verify_firebase_id_token("expired_token", clock_skew_seconds=5)


def test_verify_firebase_id_token_rejects_invalid_signature():
    """Verify that tampered or invalid tokens raise InvalidIdTokenError."""
    with patch(
        "firebase_admin.auth.verify_id_token",
        side_effect=InvalidIdTokenError("Token is malformed or signature is invalid"),
    ):
        with pytest.raises(InvalidIdTokenError):
            verify_firebase_id_token("tampered_token", clock_skew_seconds=5)


def test_clock_skew_bounded_limits():
    """Verify that clock skew is safely clamped to 0-60 range per Firebase specification."""
    with patch("firebase_admin.auth.verify_id_token", return_value={"uid": "u1"}) as mock_verify:
        # Negative skew should be clamped to 0
        verify_firebase_id_token("tok", clock_skew_seconds=-10)
        assert mock_verify.call_args[1]["clock_skew_seconds"] == 0

        # Excessive skew (>60) should be clamped to 60
        verify_firebase_id_token("tok", clock_skew_seconds=120)
        assert mock_verify.call_args[1]["clock_skew_seconds"] == 60


@pytest.mark.asyncio
async def test_get_current_user_with_valid_bearer():
    """Verify get_current_user dependency extracts UID from valid Bearer token."""
    mock_decoded = {"uid": "usr_auth_success_777"}
    with patch("backend.database.firebase.verify_firebase_id_token", return_value=mock_decoded):
        req = DummyRequest()
        uid = await get_current_user(request=req, authorization="Bearer valid_firebase_token")
        assert uid == "usr_auth_success_777"


@pytest.mark.asyncio
async def test_get_current_user_with_clock_skew_error():
    """Verify that when token verification fails, a 401 HTTPException is raised."""
    with patch(
        "backend.database.firebase.verify_firebase_id_token",
        side_effect=InvalidIdTokenError("Token used too early, 1793459027 < 1793459028"),
    ):
        req = DummyRequest()
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(request=req, authorization="Bearer skewed_token")
        assert exc_info.value.status_code == 401
        assert "Invalid or expired authentication token" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_user_no_credentials():
    """Verify that an unauthenticated request raises 401."""
    req = DummyRequest()
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(request=req, authorization=None, x_user_id=None)
    assert exc_info.value.status_code == 401

