from copy import deepcopy
from typing import Any, Dict, List, Optional


class FirebaseService:
	"""Shared persistence boundary; persists directly to Cloud Firestore with in-memory cache."""

	def __init__(self):
		self._collections: Dict[str, Dict[str, Dict[str, Any]]] = {}
		self._firestore = None
		try:
			from backend.database.firestore import FirestoreDatabase
			self._firestore = FirestoreDatabase()
		except Exception:
			self._firestore = None

	async def get(self, collection: str, document_id: str) -> Optional[Dict[str, Any]]:
		value = self._collections.get(collection, {}).get(document_id)
		if value is not None:
			return deepcopy(value)
		if self._firestore:
			try:
				doc = self._firestore.get(collection, document_id)
				if doc is not None:
					self._collections.setdefault(collection, {})[document_id] = doc
					return deepcopy(doc)
			except Exception:
				pass
		return None

	async def set(self, collection: str, document_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
		self._collections.setdefault(collection, {})[document_id] = deepcopy(data)
		if self._firestore:
			try:
				self._firestore.create(collection, document_id, data)
			except Exception:
				pass
		return deepcopy(data)

	async def list(self, collection: str, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
		if self._firestore:
			try:
				filters = {"user_id": user_id} if user_id else None
				records = self._firestore.list(collection, filters=filters)
				if records:
					for r in records:
						did = r.get("id") or r.get("document_id") or f"{r.get('user_id')}_{r.get('created_at')}"
						self._collections.setdefault(collection, {})[did] = r
					return deepcopy(records)
			except Exception:
				pass
		values = list(self._collections.get(collection, {}).values())
		if user_id is not None:
			values = [value for value in values if value.get("user_id") == user_id]
		return deepcopy(values)
