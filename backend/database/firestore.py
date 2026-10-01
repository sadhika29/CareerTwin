from firebase_admin import firestore

from backend.database.firebase import initialize_firebase


class FirestoreDatabase:
    """Firestore database interface."""

    def __init__(self):
        initialize_firebase()
        self.db = firestore.client()

    def create(
        self,
        collection: str,
        document_id: str,
        data: dict,
    ) -> str:
        """Create a Firestore document."""

        document_ref = (
            self.db
            .collection(collection)
            .document(document_id)
        )

        document_ref.set(data)

        return document_id

    def get(
        self,
        collection: str,
        document_id: str,
    ) -> dict | None:
        """Retrieve a Firestore document."""

        document_ref = (
            self.db
            .collection(collection)
            .document(document_id)
        )

        document = document_ref.get()

        if not document.exists:
            return None

        return document.to_dict()

    def update(
        self,
        collection: str,
        document_id: str,
        data: dict,
    ) -> None:
        """Update a Firestore document."""

        document_ref = (
            self.db
            .collection(collection)
            .document(document_id)
        )

        document_ref.update(data)

    def delete(
        self,
        collection: str,
        document_id: str,
    ) -> None:
        """Delete a Firestore document."""

        document_ref = (
            self.db
            .collection(collection)
            .document(document_id)
        )

        document_ref.delete()

    def list(
        self,
        collection: str,
        filters: dict | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """List documents in a collection with optional filters."""
        query = self.db.collection(collection)
        if filters:
            for field_name, value in filters.items():
                query = query.where(field_name, "==", value)
        if limit:
            query = query.limit(limit)
        docs = query.stream()
        return [doc.to_dict() for doc in docs]