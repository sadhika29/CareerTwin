from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from backend.database.firestore import FirestoreDatabase
from backend.database.storage import ResumeStorage
from backend.models.resume import Resume
from backend.services.resume_parser import parse_resume
from backend.agents.resume.agent import ResumeAgent
from backend.services.llm_service import LLMService


class ResumeService:
    def __init__(self, storage: ResumeStorage, database: FirestoreDatabase):
        self.storage = storage
        self.database = database

    def process_resume(
        self,
        file_path: str,
        user_id: str,
        original_filename: str | None = None,
    ) -> Resume:
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty.")

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(f"Resume file not found: {file_path}")

        # Preserve the filename uploaded by the user.
        filename = Path(original_filename or path.name).name

        # Parse the temporary file.
        resume_data = parse_resume(str(path))

        resume_id = str(uuid4())

        destination_path = (
            f"users/{user_id}/resumes/{resume_id}/{filename}"
        )

        # Store the actual uploaded file.
        storage_path = self.storage.upload(
            file_path=str(path),
            destination_path=destination_path,
        )

        now = datetime.now(timezone.utc)

        resume = Resume(
            resume_id=resume_id,
            user_id=user_id,
            filename=filename,
            file_type=resume_data["file_type"],
            text=resume_data["text"],
            page_count=resume_data["page_count"] or 0,
            status=resume_data["status"],
            storage_path=storage_path,
            metadata={
                "original_filename": filename,
            },
            created_at=now,
            updated_at=now,
        )

        resume_document = {
            "resume_id": resume.resume_id,
            "user_id": resume.user_id,
            "filename": resume.filename,
            "file_type": resume.file_type,
            "storage_path": resume.storage_path,
            "text": resume.text,
            "page_count": resume.page_count,
            "status": resume.status,
            "metadata": resume.metadata,
            "created_at": resume.created_at,
            "updated_at": resume.updated_at,
        }

        self.database.create(
            collection="resumes",
            document_id=resume.resume_id,
            data=resume_document,
        )

        return resume
    def analyze_resume(
        self,
        resume_id: str,
        user_id: str,
        target_role: str | None = None,
        target_job_id: str | None = None,
    ):
        if not resume_id or not resume_id.strip():
            raise ValueError("resume_id cannot be empty.")

        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty.")

        resume_document = self.database.get(
            collection="resumes",
            document_id=resume_id,
        )

        if resume_document is None:
            raise FileNotFoundError(
                f"Resume not found: {resume_id}"
            )

        if resume_document.get("user_id") != user_id:
            raise ValueError("Resume does not belong to this user.")

        resume_text = resume_document.get("text", "")

        if not resume_text.strip():
            raise ValueError("Resume has no extracted text.")

        agent = ResumeAgent(
            llm_client=LLMService()
        )

        result = agent.analyze(
            resume_text=resume_text,
            profile=resume_document.get("metadata", {}),
            target_role=target_role,
            target_job=target_job_id,
        )

        now = datetime.now(timezone.utc)

        analysis_data = result.model_dump()

        self.database.update(
            collection="resumes",
            document_id=resume_id,
            data={
                "analysis": analysis_data,
                "updated_at": now,
            },
        )

        return result