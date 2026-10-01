from abc import ABC, abstractmethod


class ResumeStorage(ABC):
    """Interface for storing and retrieving resume files."""

    @abstractmethod
    def upload(
        self,
        file_path: str,
        destination_path: str,
    ) -> str:
        """
        Upload a resume file.

        Returns:
            The storage path or URL of the uploaded file.
        """
        pass

    @abstractmethod
    def delete(
        self,
        storage_path: str,
    ) -> None:
        """Delete a stored resume file."""
        pass

    @abstractmethod
    def exists(
        self,
        storage_path: str,
    ) -> bool:
        """Check whether a resume exists in storage."""
        pass