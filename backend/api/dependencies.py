from typing import Dict

from fastapi import Header, HTTPException

from backend.agents.career_manager.graph import CareerManager
from backend.services.firebase_service import FirebaseService
from backend.services.llm_service import LLMService


firebase_service = FirebaseService()
llm_service = LLMService()
career_manager = CareerManager()
career_states: Dict[str, object] = {}


async def get_current_user(x_user_id: str = Header(default=None)) -> str:
	if not x_user_id:
		raise HTTPException(status_code=401, detail="Authentication required")
	return x_user_id


def get_firebase_service() -> FirebaseService:
	return firebase_service


def get_llm_service() -> LLMService:
	return llm_service


def get_career_manager() -> CareerManager:
	return career_manager
