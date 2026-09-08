from copy import deepcopy
from typing import Any, Dict, List, Optional


class FirebaseService:
	"""Shared persistence boundary; uses memory until Firebase is configured."""

	def __init__(self):
		self._collections: Dict[str, Dict[str, Dict[str, Any]]] = {}

	async def get(self, collection: str, document_id: str) -> Optional[Dict[str, Any]]:
		value = self._collections.get(collection, {}).get(document_id)
		return deepcopy(value) if value is not None else None

	async def set(self, collection: str, document_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
		self._collections.setdefault(collection, {})[document_id] = deepcopy(data)
		return deepcopy(data)

	async def list(self, collection: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
		values = list(self._collections.get(collection, {}).values())
		if user_id is not None:
			values = [value for value in values if value.get("user_id") == user_id]
		return deepcopy(values)
