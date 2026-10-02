from typing import Dict, Optional

from fastapi import Header, HTTPException, status

from backend.agents.career_manager.graph import CareerManager
from backend.services.firebase_service import FirebaseService
from backend.services.llm_service import LLMService


firebase_service = FirebaseService()
llm_service = LLMService()
career_manager = CareerManager()
career_states: Dict[str, object] = {}


async def get_current_user(
    x_user_id: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
) -> str:
    # 1. Bearer Token Check
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        from backend.api.routes.auth import _tokens
        user_id = _tokens.get(token)
        if user_id:
            return user_id

    # 2. X-User-ID Header Check (explicitly supplied)
    if x_user_id and x_user_id.strip() and x_user_id not in ("null", "undefined", "string"):
        return x_user_id.strip()

    # 3. Reject unauthenticated requests
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid Bearer token or X-User-ID header.",
    )


def get_firebase_service() -> FirebaseService:
	return firebase_service


def get_llm_service() -> LLMService:
	return llm_service


def get_career_manager() -> CareerManager:
	return career_manager
