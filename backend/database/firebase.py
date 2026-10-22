import os
from pathlib import Path

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials


load_dotenv()


def initialize_firebase():
    """Initialize the Firebase application."""

    if firebase_admin._apps:
        return firebase_admin.get_app()

    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-service-account.json")
    storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")

    if not credentials_path:
        raise ValueError(
            "FIREBASE_CREDENTIALS_PATH is not configured."
        )

    if not os.path.isabs(credentials_path):
        for candidate in [
            Path.cwd() / credentials_path,
            Path(__file__).resolve().parents[2] / credentials_path,
            Path(__file__).resolve().parents[1] / credentials_path,
        ]:
            if candidate.exists():
                credentials_path = str(candidate)
                break

    if not os.path.exists(credentials_path):
        raise FileNotFoundError(
            f"Firebase credentials file not found: {credentials_path}"
        )

    if not storage_bucket:
        raise ValueError(
            "FIREBASE_STORAGE_BUCKET is not configured."
        )

    cred = credentials.Certificate(credentials_path)

    return firebase_admin.initialize_app(
        cred,
        {
            "storageBucket": storage_bucket,
        },
    )