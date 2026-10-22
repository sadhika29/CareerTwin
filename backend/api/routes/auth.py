import hashlib
import hmac
import json
import secrets
from pathlib import Path
from typing import Dict
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

STORAGE_FILE = Path(__file__).resolve().parents[3] / "storage" / "users.json"


def _load_users() -> Dict[str, dict]:
	try:
		if STORAGE_FILE.exists():
			with open(STORAGE_FILE, "r", encoding="utf-8") as f:
				return json.load(f)
	except Exception:
		pass
	return {}


def _save_users():
	try:
		STORAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
		with open(STORAGE_FILE, "w", encoding="utf-8") as f:
			json.dump(_users, f, indent=2)
	except Exception:
		pass


_users: Dict[str, dict] = _load_users()
_tokens: Dict[str, str] = {}


class RegisterRequest(BaseModel):
	full_name: str = Field(min_length=1, max_length=100)
	username: str = Field(min_length=2, max_length=60)
	email: str = Field(min_length=3, max_length=160)
	password: str = Field(min_length=6, max_length=128)
	confirm_password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
	identifier: str = Field(min_length=1, max_length=160)
	password: str = Field(min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
	email: str = Field(min_length=3, max_length=160)


def _key(value: str) -> str:
	return value.strip().lower()


def _hash_password(password: str, salt: bytes | None = None) -> str:
	salt = salt or secrets.token_bytes(16)
	digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
	return f"{salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
	try:
		salt_hex, digest_hex = stored.split("$", 1)
		actual = _hash_password(password, bytes.fromhex(salt_hex)).split("$", 1)[1]
		return hmac.compare_digest(actual, digest_hex)
	except Exception:
		return False


def _session(user: dict) -> dict:
	token = secrets.token_urlsafe(32)
	_tokens[token] = user["id"]
	return {"user": {key: value for key, value in user.items() if key != "password_hash"}, "access_token": token, "token_type": "bearer"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
	if payload.password != payload.confirm_password:
		raise HTTPException(status_code=400, detail="Passwords do not match.")
	if len(payload.password) < 6:
		raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
	username = _key(payload.username)
	email = _key(payload.email)
	if username in _users or any(user.get("email") == email for user in _users.values()):
		raise HTTPException(status_code=409, detail="An account with this email or username already exists. Please login instead.")
	user = {
		"id": f"user_{uuid4().hex[:12]}",
		"full_name": payload.full_name.strip(),
		"username": username,
		"email": email,
		"password_hash": _hash_password(payload.password),
	}
	_users[username] = user
	_save_users()
	return _session(user)


@router.post("/login")
async def login(payload: LoginRequest):
	identifier = _key(payload.identifier)
	user = _users.get(identifier) or next((candidate for candidate in _users.values() if candidate["email"] == identifier), None)
	if user is None or not _verify_password(payload.password, user["password_hash"]):
		raise HTTPException(status_code=401, detail="Invalid username or password.")
	return _session(user)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
	# Always return the same response so account existence is not disclosed.
	return {"message": "If an account exists for that email, reset instructions have been sent."}


@router.post("/google", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def google_login():
	raise HTTPException(status_code=501, detail="Google authentication is not configured yet.")
