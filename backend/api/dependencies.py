from typing import Dict, Optional

from fastapi import Header, HTTPException, Request, status

from backend.agents.career_manager.graph import CareerManager
from backend.services.firebase_service import FirebaseService
from backend.services.llm_service import LLMService


firebase_service = FirebaseService()
llm_service = LLMService()
career_manager = CareerManager()
career_states: Dict[str, object] = {}


async def get_current_user(
    request: Request,
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

        # Attempt Firebase Admin ID token verification
        try:
            import firebase_admin
            from firebase_admin import auth as fb_auth
            if not firebase_admin._apps:
                from backend.database.firebase import initialize_firebase
                initialize_firebase()
            if firebase_admin._apps:
                decoded = fb_auth.verify_id_token(token)
                uid = decoded.get("uid") or decoded.get("sub")
                if uid:
                    return uid
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired authentication token: {exc}",
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )

    # 2. Fallback for test/development sessions without Bearer tokens
    if x_user_id and x_user_id.strip() and x_user_id not in ("null", "undefined", "string"):
        return x_user_id.strip()

    # 3. Query param fallback if request object available
    if request:
        q_user = request.query_params.get("user_id")
        if q_user and q_user.strip() and q_user.strip() not in ("null", "undefined", "string"):
            return q_user.strip()

    # 4. Reject unauthenticated requests
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid Bearer token.",
    )


def get_firebase_service() -> FirebaseService:
	return firebase_service


def get_llm_service() -> LLMService:
	return llm_service


def get_career_manager() -> CareerManager:
	return career_manager
