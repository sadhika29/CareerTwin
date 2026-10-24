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
    def __init__(
        self,
        storage: ResumeStorage,
        database: FirestoreDatabase,
        agent: ResumeAgent | None = None,
    ):
        self.storage = storage
        self.database = database
        self.agent = agent


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

        from backend.rag.ingestion import chunk_text
        chunks = chunk_text(resume.text) if resume.text else []

        resume_document = {
            "resume_id": resume.resume_id,
            "user_id": resume.user_id,
            "filename": resume.filename,
            "file_type": resume.file_type,
            "storage_path": resume.storage_path,
            "text": resume.text,
            "page_count": resume.page_count,
            "chunk_count": len(chunks),
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

        try:
            self.database.create(
                collection=f"users/{user_id}/resumes",
                document_id=resume.resume_id,
                data=resume_document,
            )
        except Exception:
            pass

        # Persist chunks in Firestore subcollections and collection
        for idx, chunk_str in enumerate(chunks):
            cid = f"{resume.resume_id}_chunk_{idx}"
            chunk_doc = {
                "chunk_id": cid,
                "resume_id": resume.resume_id,
                "user_id": user_id,
                "sequence_number": idx,
                "text": chunk_str,
                "page": 1,
                "total_chunks": len(chunks),
                "created_at": now.isoformat(),
            }
            try:
                self.database.create(
                    collection=f"users/{user_id}/resumes/{resume.resume_id}/chunks",
                    document_id=cid,
                    data=chunk_doc,
                )
            except Exception:
                pass
            try:
                self.database.create(
                    collection="resume_chunks",
                    document_id=cid,
                    data=chunk_doc,
                )
            except Exception:
                pass

        # Ingest chunks into VectorStore for semantic retrieval
        try:
            from backend.rag.ingestion import ingest_text_document
            from backend.rag.vector_store import VectorStore
            vstore = VectorStore(collection_name="resume_knowledge")
            ingest_text_document(
                content=resume.text,
                metadata={
                    "source": f"resume_{resume.resume_id}",
                    "resume_id": resume.resume_id,
                    "user_id": user_id,
                    "filename": filename,
                    "document_type": "resume",
                },
                vector_store=vstore,
            )
            vstore.save()
        except Exception:
            pass

        return resume
    def analyze_resume(
        self,
        resume_id: str,
        user_id: str,
        target_role: str | None = None,
        target_job_id: str | None = None,
        job_description: str | None = None,
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

        agent = self.agent or ResumeAgent(
            llm_client=LLMService()
        )


        result = agent.analyze(
            resume_text=resume_text,
            profile=resume_document.get("metadata", {}),
            target_role=target_role,
            target_job=target_job_id,
            job_description=job_description,
        )

        now = datetime.now(timezone.utc)

        analysis_data = result.model_dump()

        self.database.update(
            collection="resumes",
            document_id=resume_id,
            data={
                "analysis": analysis_data,
                "skills": analysis_data.get("resume_skills", []),
                "resume_score": analysis_data.get("resume_score", 0.0),
                "ats_score": analysis_data.get("ats_score"),
                "job_description": job_description or "",
                "updated_at": now,
            },
        )

        return result

    def save_analysis(
        self,
        user_id: str,
        resume_id: str,
        filename: str,
        analysis_data: dict,
        job_description: str | None = None,
        target_role: str | None = None,
        analysis_id: str | None = None,
    ) -> dict:
        """Persist a completed resume analysis record to Firestore."""
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty.")
        if not resume_id or not resume_id.strip():
            raise ValueError("resume_id cannot be empty.")

        # Verify resume ownership
        resume_doc = self.database.get(collection="resumes", document_id=resume_id)
        if resume_doc and resume_doc.get("user_id") != user_id:
            raise ValueError("Resume does not belong to this user.")

        aid = analysis_id
        if not aid:
            # Check for existing saved analysis of this resume with the same JD for idempotency
            try:
                existing_analyses = self.database.list(collection="analyses", filters={"user_id": user_id})
                cleaned_jd = (job_description or "").strip()
                for ea in existing_analyses:
                    if ea.get("resume_id") == resume_id and (ea.get("job_description") or "").strip() == cleaned_jd:
                        aid = ea.get("analysis_id") or ea.get("id")
                        break
            except Exception:
                pass

        if not aid:
            aid = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()

        doc_data = {
            "analysis_id": aid,
            "user_id": user_id,
            "resume_id": resume_id,
            "filename": filename or (resume_doc.get("filename") if resume_doc else "resume.pdf"),
            "job_description": job_description or "",
            "target_role": target_role or "",
            "ats_score": analysis_data.get("ats_score"),
            "resume_score": float(analysis_data.get("resume_score", 0.0)),
            "has_target_job": bool(analysis_data.get("has_target_job") or (job_description and job_description.strip())),
            "resume_skills": analysis_data.get("resume_skills", []),
            "missing_keywords": analysis_data.get("missing_keywords", []),
            "missing_keyword_details": analysis_data.get("missing_keyword_details", []),
            "grammar_issues": analysis_data.get("grammar_issues", []),
            "structured_recommendations": analysis_data.get("structured_recommendations", []),
            "recommendations": analysis_data.get("recommendations", []),
            "sentence_improvements": analysis_data.get("sentence_improvements", []),
            "inferred_domain": analysis_data.get("inferred_domain", "General Professional"),
            "status": "saved",
            "created_at": now,
            "updated_at": now,
        }

        # Store in top-level analyses collection
        self.database.create(collection="analyses", document_id=aid, data=doc_data)

        # Mirror in user's subcollection
        try:
            self.database.create(collection=f"users/{user_id}/analyses", document_id=aid, data=doc_data)
        except Exception:
            pass

        return doc_data

    def list_saved_analyses(self, user_id: str, limit: int = 50) -> list[dict]:
        """List saved analyses for a user ordered by timestamp descending."""
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty.")
        results = self.database.list(collection="analyses", filters={"user_id": user_id}, limit=limit)
        return sorted(results, key=lambda x: str(x.get("created_at", "")), reverse=True)

    def get_saved_analysis(self, analysis_id: str, user_id: str) -> dict:
        """Retrieve a specific saved analysis, ensuring ownership."""
        if not analysis_id:
            raise ValueError("analysis_id cannot be empty.")
        doc = self.database.get(collection="analyses", document_id=analysis_id)
        if not doc:
            doc = self.database.get(collection=f"users/{user_id}/analyses", document_id=analysis_id)
        if not doc:
            raise FileNotFoundError(f"Analysis not found: {analysis_id}")
        if doc.get("user_id") != user_id:
            raise ValueError("Analysis does not belong to this user.")
        return doc

    def delete_saved_analysis(self, analysis_id: str, user_id: str) -> bool:
        """Delete a saved analysis document."""
        self.get_saved_analysis(analysis_id, user_id)
        self.database.delete(collection="analyses", document_id=analysis_id)
        try:
            self.database.delete(collection=f"users/{user_id}/analyses", document_id=analysis_id)
        except Exception:
            pass
        return True