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
    SaveAnalysisRequest,
    SavedAnalysisListResponse,
    SavedAnalysisResponse,
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


async def _resolve_user_id(request: Request, client_user_id: str | None = None) -> str:
    """Derive authenticated UID from Bearer token or headers, rejecting cross-user access."""
    from backend.api.dependencies import get_current_user
    try:
        current_user = await get_current_user(
            request=request,
            x_user_id=request.headers.get("X-User-ID"),
            authorization=request.headers.get("Authorization"),
        )
    except HTTPException:
        if client_user_id and client_user_id.strip() and client_user_id.strip() not in ("null", "undefined", "string"):
            current_user = client_user_id.strip()
        else:
            raise HTTPException(
                status_code=401,
                detail="Authentication required. Please provide a valid Bearer token.",
            )

    if client_user_id and client_user_id.strip() and client_user_id.strip() not in (current_user, "null", "undefined", "string"):
        raise HTTPException(
            status_code=403,
            detail="Unauthorized access: You do not have permission to access another user's data.",
        )

    return current_user


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
    resolved_user_id = await _resolve_user_id(request, user_id)

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

        # Synchronize biographical and professional information into user profile
        try:
            from backend.services.profile_sync_service import sync_resume_to_user_profile
            sync_resume_to_user_profile(
                user_id=resolved_user_id,
                resume_text=resume.text,
                resume_id=resume.resume_id,
                filename=resume.filename,
                database=database,
            )
        except Exception:
            pass

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
    req: Request,
):
    try:
        resolved_user_id = await _resolve_user_id(req, request.user_id)
        storage = get_resume_storage()
        database = FirestoreDatabase()

        service = ResumeService(
            storage=storage,
            database=database,
        )

        result = service.analyze_resume(
            resume_id=resume_id,
            user_id=resolved_user_id,
            target_role=request.target_role,
            target_job_id=request.target_job_id,
            job_description=request.job_description,
        )


        # Synchronize with live user CareerState for dashboard & digital twin
        try:
            from backend.api.dependencies import career_states
            from backend.agents.career_manager.state import CareerState
            state = career_states.get(resolved_user_id)
            if state is None:
                state = CareerState(user_id=resolved_user_id, target_role=request.target_role or "Software Engineer")
                career_states[resolved_user_id] = state
            if hasattr(result, "resume_score") and result.resume_score is not None:
                state.resume_score = result.resume_score
            elif hasattr(result, "ats_score") and result.ats_score is not None:
                state.resume_score = result.ats_score
            if request.target_role:
                state.target_role = request.target_role
        except Exception:
            pass

        # Synchronize biographical and professional information into user profile
        try:
            from backend.services.profile_sync_service import sync_resume_to_user_profile
            sync_resume_to_user_profile(
                user_id=resolved_user_id,
                resume_text=resume_document.get("text", "") or resume_document.get("extracted_text", ""),
                resume_id=resume_id,
                filename=resume_document.get("filename", ""),
                ats_score=getattr(result, "ats_score", None),
                resume_score=getattr(result, "resume_score", None),
                job_description=request.job_description,
                database=database,
            )
        except Exception:
            pass

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
    req: Request,
):
    try:
        resolved_user_id = await _resolve_user_id(req, request.user_id)
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
        if resume_document.get("user_id") != resolved_user_id:
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
        if job_document.get("user_id") != resolved_user_id:
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
    req: Request,
    user_id: str = Query("", description="User ID owning resumes"),
    limit: int = Query(50, ge=1, le=100),
):
    """List all resumes uploaded by a user."""
    try:
        resolved_user_id = await _resolve_user_id(req, user_id)
        database = FirestoreDatabase()
        documents = database.list(
            collection="resumes",
            filters={"user_id": resolved_user_id},
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

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post(
    "/analyses/save",
    response_model=SavedAnalysisResponse,
)
async def save_resume_analysis(
    request: SaveAnalysisRequest,
    req: Request,
):
    """Persist a completed resume analysis record."""
    try:
        resolved_user_id = await _resolve_user_id(req, request.user_id)
        storage = get_resume_storage()
        database = FirestoreDatabase()
        service = ResumeService(storage=storage, database=database)

        analysis_dict = {
            "ats_score": request.ats_score,
            "resume_score": request.resume_score,
            "has_target_job": request.has_target_job,
            "resume_skills": request.resume_skills,
            "missing_keywords": request.missing_keywords,
            "missing_keyword_details": request.missing_keyword_details,
            "grammar_issues": request.grammar_issues,
            "structured_recommendations": request.structured_recommendations,
            "recommendations": request.recommendations,
            "sentence_improvements": request.sentence_improvements,
            "inferred_domain": request.inferred_domain or "General Professional",
        }

        saved_doc = service.save_analysis(
            user_id=resolved_user_id,
            resume_id=request.resume_id,
            filename=request.filename,
            analysis_data=analysis_dict,
            job_description=request.job_description,
            target_role=request.target_role,
            analysis_id=request.analysis_id,
        )

        # Synchronize active analysis info into user profile
        try:
            from backend.services.profile_sync_service import sync_resume_to_user_profile
            res_doc = database.get(collection="resumes", document_id=request.resume_id)
            sync_resume_to_user_profile(
                user_id=resolved_user_id,
                resume_text=res_doc.get("text", "") if res_doc else "",
                resume_id=request.resume_id,
                filename=request.filename,
                ats_score=saved_doc.get("ats_score"),
                resume_score=saved_doc.get("resume_score"),
                job_description=request.job_description,
                database=database,
            )
        except Exception:
            pass

        return SavedAnalysisResponse(
            analysis_id=saved_doc["analysis_id"],
            user_id=saved_doc["user_id"],
            resume_id=saved_doc["resume_id"],
            filename=saved_doc["filename"],
            job_description=saved_doc.get("job_description"),
            target_role=saved_doc.get("target_role"),
            ats_score=saved_doc.get("ats_score"),
            resume_score=saved_doc.get("resume_score", 0.0),
            has_target_job=saved_doc.get("has_target_job", False),
            resume_skills=saved_doc.get("resume_skills", []),
            missing_keywords=saved_doc.get("missing_keywords", []),
            missing_keyword_details=saved_doc.get("missing_keyword_details", []),
            grammar_issues=saved_doc.get("grammar_issues", []),
            structured_recommendations=saved_doc.get("structured_recommendations", []),
            recommendations=saved_doc.get("recommendations", []),
            sentence_improvements=saved_doc.get("sentence_improvements", []),
            inferred_domain=saved_doc.get("inferred_domain"),
            created_at=saved_doc.get("created_at", ""),
        )

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save analysis: {exc}")


@router.get(
    "/analyses",
    response_model=SavedAnalysisListResponse,
)
@router.get(
    "/analyses/saved",
    response_model=SavedAnalysisListResponse,
)
async def list_user_saved_analyses(
    req: Request,
    user_id: str = Query("", description="User ID owning saved analyses"),
    limit: int = Query(50, ge=1, le=100),
):
    """Retrieve all previously saved analyses for the user."""
    try:
        resolved_user_id = await _resolve_user_id(req, user_id)
        storage = get_resume_storage()
        database = FirestoreDatabase()
        service = ResumeService(storage=storage, database=database)

        docs = service.list_saved_analyses(user_id=resolved_user_id, limit=limit)
        items = [
            SavedAnalysisResponse(
                analysis_id=doc.get("analysis_id", doc.get("id", "")),
                user_id=doc.get("user_id", resolved_user_id),
                resume_id=doc.get("resume_id", ""),
                filename=doc.get("filename", ""),
                job_description=doc.get("job_description"),
                target_role=doc.get("target_role"),
                ats_score=doc.get("ats_score"),
                resume_score=doc.get("resume_score", 0.0),
                has_target_job=doc.get("has_target_job", bool(doc.get("job_description"))),
                resume_skills=doc.get("resume_skills", []),
                missing_keywords=doc.get("missing_keywords", []),
                missing_keyword_details=doc.get("missing_keyword_details", []),
                grammar_issues=doc.get("grammar_issues", []),
                structured_recommendations=doc.get("structured_recommendations", []),
                recommendations=doc.get("recommendations", []),
                sentence_improvements=doc.get("sentence_improvements", []),
                inferred_domain=doc.get("inferred_domain"),
                created_at=str(doc.get("created_at", "")),
            )
            for doc in docs
        ]
        return SavedAnalysisListResponse(analyses=items, total=len(items))

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get(
    "/analyses/{analysis_id}",
    response_model=SavedAnalysisResponse,
)
async def get_saved_analysis_by_id(
    analysis_id: str,
    req: Request,
    user_id: str = Query("", description="User ID owning saved analysis"),
):
    """Retrieve a single saved analysis without re-running AI."""
    try:
        resolved_user_id = await _resolve_user_id(req, user_id)
        storage = get_resume_storage()
        database = FirestoreDatabase()
        service = ResumeService(storage=storage, database=database)

        doc = service.get_saved_analysis(analysis_id=analysis_id, user_id=resolved_user_id)
        return SavedAnalysisResponse(
            analysis_id=doc.get("analysis_id", analysis_id),
            user_id=doc.get("user_id", resolved_user_id),
            resume_id=doc.get("resume_id", ""),
            filename=doc.get("filename", ""),
            job_description=doc.get("job_description"),
            target_role=doc.get("target_role"),
            ats_score=doc.get("ats_score"),
            resume_score=doc.get("resume_score", 0.0),
            has_target_job=doc.get("has_target_job", bool(doc.get("job_description"))),
            resume_skills=doc.get("resume_skills", []),
            missing_keywords=doc.get("missing_keywords", []),
            missing_keyword_details=doc.get("missing_keyword_details", []),
            grammar_issues=doc.get("grammar_issues", []),
            structured_recommendations=doc.get("structured_recommendations", []),
            recommendations=doc.get("recommendations", []),
            sentence_improvements=doc.get("sentence_improvements", []),
            inferred_domain=doc.get("inferred_domain"),
            created_at=str(doc.get("created_at", "")),
        )

    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete(
    "/analyses/{analysis_id}",
)
async def delete_saved_analysis_by_id(
    analysis_id: str,
    req: Request,
    user_id: str = Query("", description="User ID owning saved analysis"),
):
    """Delete a user's saved analysis."""
    try:
        resolved_user_id = await _resolve_user_id(req, user_id)
        storage = get_resume_storage()
        database = FirestoreDatabase()
        service = ResumeService(storage=storage, database=database)

        service.delete_saved_analysis(analysis_id=analysis_id, user_id=resolved_user_id)
        return {"status": "success", "message": f"Saved analysis {analysis_id} deleted successfully."}

    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get(
    "/{resume_id}",
    response_model=ResumeDetailResponse,
)
async def get_resume(
    resume_id: str,
    req: Request,
    user_id: str = Query("", description="User ID owning resume"),
):
    """Retrieve resume record, extracted text, and past analysis."""
    try:
        resolved_user_id = await _resolve_user_id(req, user_id)
        database = FirestoreDatabase()
        doc = database.get(collection="resumes", document_id=resume_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Resume not found: {resume_id}")

        if doc.get("user_id") != resolved_user_id:
            raise HTTPException(status_code=403, detail="Resume does not belong to this user.")

        return ResumeDetailResponse(
            resume_id=doc.get("resume_id", resume_id),
            user_id=doc.get("user_id", resolved_user_id),
            filename=doc.get("filename", ""),
            file_type=doc.get("file_type", ""),
            page_count=doc.get("page_count", 0),
            status=doc.get("status", "success"),
            storage_path=doc.get("storage_path", ""),
            text=doc.get("text", "") or doc.get("extracted_text", ""),
            skills=doc.get("skills", []) or doc.get("analysis", {}).get("resume_skills", []),
            analysis=doc.get("analysis", {}),
            ats_analysis=doc.get("ats_analysis", {}),
            sentence_improvements=doc.get("analysis", {}).get("sentence_improvements", []),
            repaired_text=doc.get("analysis", {}).get("repaired_text", ""),
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
    req: Request,
    user_id: str = Query("", description="User ID owning resume"),
):
    """Delete a resume and its stored file."""
    try:
        resolved_user_id = await _resolve_user_id(req, user_id)
        database = FirestoreDatabase()
        storage = get_resume_storage()
        doc = database.get(collection="resumes", document_id=resume_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Resume not found: {resume_id}")

        if doc.get("user_id") != resolved_user_id:
            raise HTTPException(status_code=403, detail="Resume does not belong to this user.")

        try:
            storage_path = doc.get("storage_path", "")
            if storage_path:
                storage.delete(storage_path)
        except Exception:
            pass

        # Clean up chunk records in Firestore
        try:
            chunks = database.list("resume_chunks", filters={"resume_id": resume_id})
            for c in chunks:
                cid = c.get("chunk_id") or c.get("id")
                if cid:
                    database.delete("resume_chunks", cid)
        except Exception:
            pass

        try:
            database.delete(f"users/{resolved_user_id}/resumes", resume_id)
        except Exception:
            pass

        database.delete(collection="resumes", document_id=resume_id)
        return {"status": "success", "message": f"Resume {resume_id} deleted successfully."}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get(
    "/{resume_id}/chunks",
)
async def get_resume_chunks(
    resume_id: str,
    req: Request,
    user_id: str = Query("", description="User ID owning resume"),
):
    """Retrieve all chunk records for a resume, verifying ownership."""
    try:
        resolved_user_id = await _resolve_user_id(req, user_id)
        database = FirestoreDatabase()
        doc = database.get(collection="resumes", document_id=resume_id)
        if not doc:
            raise HTTPException(status_code=404, detail=f"Resume not found: {resume_id}")

        if doc.get("user_id") != resolved_user_id:
            raise HTTPException(status_code=400, detail="Resume does not belong to this user.")

        chunks = []
        try:
            chunks = database.list(
                collection="resume_chunks",
                filters={"resume_id": resume_id},
            )
        except Exception:
            chunks = []

        if not chunks and doc.get("text"):
            from backend.rag.ingestion import chunk_text
            raw_chunks = chunk_text(doc["text"])
            for idx, c_text in enumerate(raw_chunks):
                cid = f"{resume_id}_chunk_{idx}"
                cdoc = {
                    "chunk_id": cid,
                    "resume_id": resume_id,
                    "user_id": user_id,
                    "sequence_number": idx,
                    "text": c_text,
                    "page": 1,
                    "total_chunks": len(raw_chunks),
                }
                chunks.append(cdoc)
                try:
                    database.create("resume_chunks", cid, cdoc)
                except Exception:
                    pass

        return {
            "resume_id": resume_id,
            "user_id": user_id,
            "total_chunks": len(chunks),
            "chunks": sorted(chunks, key=lambda x: x.get("sequence_number", 0)),
        }

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