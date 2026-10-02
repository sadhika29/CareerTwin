from firebase_admin import firestore

from backend.database.firebase import initialize_firebase


class FirestoreDatabase:
    """Firestore database interface with resilient local fallback."""

    _shared_memory: dict[str, dict[str, dict]] = {}

    def __init__(self):
        self.db = None
        try:
            initialize_firebase()
            self.db = firestore.client()
        except Exception:
            self.db = None

    def create(
        self,
        collection: str,
        document_id: str,
        data: dict,
    ) -> str:
        """Create a Firestore document."""
        if self.db is not None:
            document_ref = (
                self.db
                .collection(collection)
                .document(document_id)
            )
            document_ref.set(data)
        else:
            self._shared_memory.setdefault(collection, {})[document_id] = dict(data)

        return document_id

    def get(
        self,
        collection: str,
        document_id: str,
    ) -> dict | None:
        """Retrieve a Firestore document."""
        if self.db is not None:
            document_ref = (
                self.db
                .collection(collection)
                .document(document_id)
            )
            document = document_ref.get()
            if not document.exists:
                return None
            return document.to_dict()
        else:
            return self._shared_memory.get(collection, {}).get(document_id)

    def update(
        self,
        collection: str,
        document_id: str,
        data: dict,
    ) -> None:
        """Update a Firestore document."""
        if self.db is not None:
            document_ref = (
                self.db
                .collection(collection)
                .document(document_id)
            )
            document_ref.update(data)
        else:
            if collection in self._shared_memory and document_id in self._shared_memory[collection]:
                self._shared_memory[collection][document_id].update(data)
            else:
                self._shared_memory.setdefault(collection, {})[document_id] = dict(data)

    def delete(
        self,
        collection: str,
        document_id: str,
    ) -> None:
        """Delete a Firestore document."""
        if self.db is not None:
            document_ref = (
                self.db
                .collection(collection)
                .document(document_id)
            )
            document_ref.delete()
        else:
            self._shared_memory.get(collection, {}).pop(document_id, None)

    def list(
        self,
        collection: str,
        filters: dict | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """List documents in a collection with optional filters."""
        if self.db is not None:
            query = self.db.collection(collection)
            if filters:
                for field_name, value in filters.items():
                    query = query.where(field_name, "==", value)
            if limit:
                query = query.limit(limit)
            docs = query.stream()
            return [doc.to_dict() for doc in docs]
        else:
            items = list(self._shared_memory.get(collection, {}).values())
            if filters:
                items = [
                    item for item in items
                    if all(item.get(k) == v for k, v in filters.items())
                ]
            return items[:limit]