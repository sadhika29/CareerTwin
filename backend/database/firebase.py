import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import auth as fb_auth, credentials

load_dotenv()

logger = logging.getLogger(__name__)

DEFAULT_CLOCK_SKEW_SECONDS = 5


def initialize_firebase():
    """Initialize the Firebase application."""

    if firebase_admin._apps:
        return firebase_admin.get_app()

    cred = None
    cred_json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if cred_json_str and cred_json_str.strip():
        import json as _json
        try:
            cred_dict = _json.loads(cred_json_str.strip())
            cred = credentials.Certificate(cred_dict)
            logger.info("Initialized Firebase credentials from FIREBASE_CREDENTIALS_JSON environment variable.")
        except Exception as e:
            logger.warning("Failed to parse FIREBASE_CREDENTIALS_JSON: %s", e)

    if cred is None:
        credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")
        if not credentials_path:
            raise ValueError("FIREBASE_CREDENTIALS_PATH is not configured.")

        if not os.path.isabs(credentials_path):
            candidates = [
                Path.cwd() / credentials_path,
                Path(__file__).resolve().parents[2] / credentials_path,
                Path(__file__).resolve().parents[1] / credentials_path,
                Path("/etc/secrets") / Path(credentials_path).name,
            ]
            for candidate in candidates:
                if candidate.exists():
                    credentials_path = str(candidate)
                    break

        if not os.path.exists(credentials_path):
            raise FileNotFoundError(
                f"Firebase credentials file not found: {credentials_path}"
            )

        cred = credentials.Certificate(credentials_path)

    storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")
    if not storage_bucket:
        project_id = os.getenv("FIREBASE_PROJECT_ID", "carrr-c4bc0")
        storage_bucket = f"{project_id}.firebasestorage.app"

    return firebase_admin.initialize_app(
        cred,
        {
            "storageBucket": storage_bucket,
        },
    )


def verify_firebase_id_token(
    id_token: str,
    check_revoked: bool = False,
    clock_skew_seconds: int = DEFAULT_CLOCK_SKEW_SECONDS,
) -> Dict[str, Any]:
    """
    Verifies a Firebase ID token with clock-skew tolerance and safe diagnostic logging.

    Security & Validation:
    - Cryptographically validates token signature using Google's public certificates.
    - Validates audience (aud) and issuer (iss) against the Firebase project.
    - Checks expiration (exp) and revocation status if check_revoked=True.
    - Applies a bounded clock-skew tolerance (0-60s, default 5s) to absorb client/server drift.
    - Logs diagnostic timing without exposing raw token strings or secrets.
    """
    if not id_token or not isinstance(id_token, str):
        raise ValueError("Firebase ID token must be a non-empty string.")

    if not firebase_admin._apps:
        initialize_firebase()

    tolerance = max(0, min(int(clock_skew_seconds), 60))

    try:
        decoded = fb_auth.verify_id_token(
            id_token,
            check_revoked=check_revoked,
            clock_skew_seconds=tolerance,
        )
        server_utc = int(time.time())
        iat = decoded.get("iat")
        exp = decoded.get("exp")
        delta = server_utc - iat if iat else 0
        logger.debug(
            "Firebase token verified: uid=%s, iat=%s, exp=%s, server_utc=%s, delta_sec=%s, skew_tol=%ss",
            decoded.get("uid"),
            iat,
            exp,
            server_utc,
            delta,
            tolerance,
        )
        return decoded
    except Exception as exc:
        server_utc = int(time.time())
        logger.warning(
            "Firebase token verification failed: %s (server_utc=%s, skew_tol=%ss)",
            exc,
            server_utc,
            tolerance,
        )
        raise
