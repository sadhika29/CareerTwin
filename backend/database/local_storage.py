import os
from pathlib import Path
import shutil

from backend.database.storage import ResumeStorage


class LocalResumeStorage(ResumeStorage):
    """Local filesystem implementation of resume storage."""

    def __init__(self, base_directory: str | None = None):
        target_dir = base_directory or os.getenv("LOCAL_STORAGE_DIR", "storage/resumes")
        self.base_directory = Path(target_dir)
        self.base_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

    def upload(
        self,
        file_path: str,
        destination_path: str,
    ) -> str:
        source = Path(file_path)

        if not source.exists():
            raise FileNotFoundError(
                f"Resume file not found: {file_path}"
            )

        destination = self.base_directory / destination_path

        destination.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        shutil.copy2(source, destination)

        return str(destination)

    def delete(
        self,
        storage_path: str,
    ) -> None:
        path = Path(storage_path)

        if path.exists():
            path.unlink()

    def exists(
        self,
        storage_path: str,
    ) -> bool:
        return Path(storage_path).exists()