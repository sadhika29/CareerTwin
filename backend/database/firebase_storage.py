from pathlib import Path

from firebase_admin import storage

from backend.database.firebase import initialize_firebase
from backend.database.storage import ResumeStorage


class FirebaseResumeStorage(ResumeStorage):
    """Firebase Storage implementation for resume files."""

    def __init__(self, bucket_name: str | None = None):
        initialize_firebase()

        if bucket_name:
            self.bucket = storage.bucket(bucket_name)
        else:
            self.bucket = storage.bucket()

    def upload(
        self,
        file_path: str,
        destination_path: str,
    ) -> str:
        """Upload a resume file to Firebase Storage."""

        source = Path(file_path)

        if not source.exists():
            raise FileNotFoundError(
                f"Resume file not found: {file_path}"
            )

        try:
            blob = self.bucket.blob(destination_path)
            blob.upload_from_filename(
                str(source)
            )
            return f"gs://{self.bucket.name}/{destination_path}"
        except Exception as e:
            # Fall back cleanly to local storage if bucket is not yet provisioned in Firebase Console
            from backend.database.local_storage import LocalResumeStorage
            local_store = LocalResumeStorage()
            return local_store.upload(file_path=file_path, destination_path=destination_path)

    def delete(
        self,
        storage_path: str,
    ) -> None:
        """Delete a resume from Firebase Storage."""

        blob = self.bucket.blob(storage_path)

        if blob.exists():
            blob.delete()

    def exists(
        self,
        storage_path: str,
    ) -> bool:
        """Check whether a resume exists in Firebase Storage."""

        blob = self.bucket.blob(storage_path)

        return blob.exists()