import os
import tempfile

from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile


from backend.agents.resume.agent import ResumeAgent
from backend.database.firestore import FirestoreDatabase
from backend.database.local_storage import LocalResumeStorage
from backend.schemas.resume import (
    ATSAnalysisRequest,
    ATSAnalysisResponse,
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    ResumeDetailResponse,
    ResumeListResponse,
    ResumeUploadResponse,
)
from backend.services.resume_service import ResumeService


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


def get_resume_storage():
    """Select storage backend dynamically based on STORAGE_TYPE environment variable."""
    storage_type = os.getenv("STORAGE_TYPE", "local").lower()
    if storage_type == "firebase":
        try:
            from backend.database.firebase_storage import FirebaseResumeStorage
            return FirebaseResumeStorage()
        except Exception:
            return LocalResumeStorage()
    return LocalResumeStorage()


@router.post(
    "/upload",
    response_model=ResumeUploadResponse,
)
async def upload_resume(
    request: Request,
    user_id: str = Form(default=""),
    file: UploadFile = File(...),
):
    """Upload, parse, store, and persist a resume."""
    resolved_user_id = user_id.strip() if user_id and user_id.strip() else request.headers.get("X-User-ID", "").strip()
    if not resolved_user_id:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1].strip()
            from backend.api.routes.auth import _tokens
            resolved_user_id = _tokens.get(token, "")

    if not resolved_user_id or resolved_user_id in ("null", "undefined", "string"):
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please provide a valid user_id or authentication token.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required.",
        )


    allowed_extensions = {".pdf", ".docx"}

    extension = ""

    if "." in file.filename:
        extension = "." + file.filename.rsplit(".", 1)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported.",
        )

    temporary_path = None

    try:
        contents = await file.read()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension,
        ) as temporary_file:
            temporary_file.write(contents)
            temporary_path = temporary_file.name

        storage = get_resume_storage()
        database = FirestoreDatabase()

        service = ResumeService(
            storage=storage,
            database=database,
        )

        resume = service.process_resume(
            file_path=temporary_path,
            user_id=resolved_user_id,
            original_filename=file.filename,
        )

        return {
            "resume_id": resume.resume_id,
            "user_id": resume.user_id,
            "filename": resume.filename,
            "file_type": resume.file_type,
            "page_count": resume.page_count,
            "status": resume.status,
            "storage_path": resume.storage_path,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Resume processing failed: {exc}",
        ) from exc

    finally:
        if temporary_path and os.path.exists(temporary_path):
            try:
                os.remove(temporary_path)
            except Exception:
                pass

@router.post(
    "/{resume_id}/analyze",
    response_model=ResumeAnalysisResponse,
)
async def analyze_resume(
    resume_id: str,
    request: ResumeAnalysisRequest,
):
    try:
        storage = get_resume_storage()
        database = FirestoreDatabase()

        service = ResumeService(
            storage=storage,
            database=database,
        )

        result = service.analyze_resume(
            resume_id=resume_id,
            user_id=request.user_id,
            target_role=request.target_role,
            target_job_id=request.target_job_id,
        )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {exc}",
        ) from exc
        

@router.post(
    "/{resume_id}/ats",
    response_model=ATSAnalysisResponse,
)
async def analyze_resume_ats(
    resume_id: str,
    request: ATSAnalysisRequest,
):
    try:
        database = FirestoreDatabase()

        # Fetch resume
        resume_document = database.get(
            collection="resumes",
            document_id=resume_id,
        )

        if resume_document is None:
            raise FileNotFoundError(
                f"Resume not found: {resume_id}"
            )

        # Verify resume ownership
        if resume_document.get("user_id") != request.user_id:
            raise ValueError(
                "Resume does not belong to this user."
            )

        # Fetch job
        job_document = database.get(
            collection="jobs",
            document_id=request.job_id,
        )

        if job_document is None:
            raise FileNotFoundError(
                f"Job not found: {request.job_id}"
            )

        # Verify job ownership
        if job_document.get("user_id") != request.user_id:
            raise ValueError(
                "Job does not belong to this user."
            )

        # Resume text
        resume_text = resume_document.get("text", "")
        if not resume_text:
            resume_text = resume_document.get("extracted_text", "")

        if not resume_text:
            raise ValueError(
                "Resume does not contain extracted text."
            )

        # Resume skills
        resume_skills = (
            resume_document.get("skills")
            or resume_document.get("analysis", {}).get("resume_skills", [])
            or []
        )

        # Job requirements
        job_keywords = job_document.get("keywords", [])
        required_skills = job_document.get("required_skills", [])
        experience_keywords = job_document.get(
            "experience_requirements",
            [],
        )

        required_sections = (
            request.required_sections
            if request.required_sections is not None
            else [
                "education",
                "experience",
                "projects",
                "skills",
            ]
        )

        # Run deterministic ATS analysis
        agent = ResumeAgent(llm_client=None)

        result = agent.analyze_ats(
            resume_text=resume_text,
            resume_skills=resume_skills,
            job_keywords=job_keywords,
            required_skills=required_skills,
            experience_keywords=experience_keywords,
            required_sections=required_sections,
            weights=request.weights,
        )

        database.update(
            collection="resumes",
            document_id=resume_id,
            data={
                "ats_analysis": result.model_dump(),
            },
        )

        return result

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"ATS analysis failed: {exc}",
        ) from exc


@router.get(
    "",
    response_model=ResumeListResponse,
)
async def list_resumes(
    user_id: str = Query(..., description="User ID owning resumes"),
    limit: int = Query(50, ge=1, le=100),
):
    """List all resumes uploaded by a user."""
    try:
        database = FirestoreDatabase()
        documents = database.list(
            collection="resumes",
            filters={"user_id": user_id},
            limit=limit,
        )

        resumes = [
            ResumeUploadResponse(
                resume_id=doc.get("resume_id", ""),
                user_id=doc.get("user_id", ""),
                filename=doc.get("filename", ""),
                file_type=doc.get("file_type", ""),
                page_count=doc.get("page_count", 0),
                status=doc.get("status", "success"),
                storage_path=doc.get("storage_path", ""),
            )
            for doc in documents
        ]
        return ResumeListResponse(resumes=resumes, total=len(resumes))

    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get(
    "/{resume_id}",
    response_model=ResumeDetailResponse,
)
async def get_resume(
    resume_id: str,
    user_id: str = Query(..., description="User ID owning resume"),
):
    """Retrieve resume record, extracted text, and past analysis."""
    try:
        database = FirestoreDatabase()
        doc = database.get(collection="resumes", document_id=resume_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Resume not found: {resume_id}")

        if doc.get("user_id") != user_id:
            raise HTTPException(status_code=400, detail="Resume does not belong to this user.")

        return ResumeDetailResponse(
            resume_id=doc.get("resume_id", resume_id),
            user_id=doc.get("user_id", user_id),
            filename=doc.get("filename", ""),
            file_type=doc.get("file_type", ""),
            page_count=doc.get("page_count", 0),
            status=doc.get("status", "success"),
            storage_path=doc.get("storage_path", ""),
            text=doc.get("text", "") or doc.get("extracted_text", ""),
            skills=doc.get("skills", []) or doc.get("analysis", {}).get("resume_skills", []),
            analysis=doc.get("analysis", {}),
            ats_analysis=doc.get("ats_analysis", {}),
            created_at=str(doc.get("created_at")) if doc.get("created_at") else None,
            updated_at=str(doc.get("updated_at")) if doc.get("updated_at") else None,
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete(
    "/{resume_id}",
)
async def delete_resume(
    resume_id: str,
    user_id: str = Query(..., description="User ID owning resume"),
):
    """Delete a resume and its stored file."""
    try:
        database = FirestoreDatabase()
        storage = LocalResumeStorage()
        doc = database.get(collection="resumes", document_id=resume_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Resume not found: {resume_id}")

        if doc.get("user_id") != user_id:
            raise HTTPException(status_code=400, detail="Resume does not belong to this user.")

        storage_path = doc.get("storage_path", "")
        if storage_path:
            try:
                storage.delete(storage_path)
            except Exception:
                pass

        database.delete(collection="resumes", document_id=resume_id)
        return {"status": "success", "message": f"Resume {resume_id} deleted successfully."}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/ats-score",
    response_model=ATSAnalysisResponse,
)
async def calculate_ats_score_endpoint(
    request: ATSAnalysisRequest,
    resume_id: str = Query(..., description="Resume ID to evaluate"),
):
    """Direct alias for ATS evaluation matching Section 29."""
    return await analyze_resume_ats(resume_id=resume_id, request=request)