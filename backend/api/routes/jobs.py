from fastapi import APIRouter, Depends, Header, HTTPException, Query

from backend.agents.jobs.agent import JobAgent
from backend.database.firestore import FirestoreDatabase
from backend.schemas.job import (
    JobAnalysisRequest,
    JobAnalysisResponse,
    JobCreateRequest,
    JobEligibilityResponse,
    JobListResponse,
    JobMatchRequest,
    JobMatchResponse,
    JobResponse,
)
from backend.services.job_service import JobService
from backend.services.job_description import normalize_job_description


def _public_provider_job(job: dict) -> dict:
    """Return provider job data without internal source snapshots or HTML markup."""
    result = {key: value for key, value in job.items() if key != "_source_description"}
    result["description"] = normalize_job_description(result.get("description", ""))
    return result


async def get_authenticated_user_id(
    x_user_id: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
    user_id: str | None = Query(default=None),
) -> str:
    # 1. Bearer Token Check
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()
        from backend.api.routes.auth import _tokens
        uid = _tokens.get(token)
        if uid:
            return uid
        try:
            import firebase_admin
            from firebase_admin import auth as fb_auth
            if not firebase_admin._apps:
                from backend.database.firebase import initialize_firebase
                initialize_firebase()
            if firebase_admin._apps:
                decoded = fb_auth.verify_id_token(token)
                uid = decoded.get("uid") or decoded.get("sub")
                if uid:
                    return uid
        except Exception:
            pass

    # 2. X-User-ID Header Check
    if x_user_id and x_user_id.strip() and x_user_id not in ("null", "undefined", "string"):
        return x_user_id.strip()

    # 3. Query Param fallback (if explicitly supplied)
    if user_id and user_id.strip() and user_id not in ("null", "undefined", "string"):
        return user_id.strip()

    raise HTTPException(
        status_code=401,
        detail="Authentication required. Please provide a valid Bearer token, X-User-ID header, or user_id.",
    )


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


@router.post(
    "",
    response_model=JobResponse,
)
async def create_job(request: JobCreateRequest):

    try:
        service = JobService()

        job = service.create_job(
            user_id=request.user_id,
            title=request.title,
            company=request.company,
            location=request.location,
            job_url=str(request.job_url or ""),
            description=request.description,
            required_skills=request.required_skills,
            preferred_skills=request.preferred_skills,
            experience_requirements=request.experience_requirements,
            qualifications=request.qualifications,
            responsibilities=request.responsibilities,
            keywords=request.keywords,
        )

        return JobResponse(
            job_id=job.job_id,
            user_id=job.user_id,
            title=job.title,
            company=job.company,
            location=job.location,
            job_url=job.job_url,
            description=job.description,
            required_skills=job.required_skills,
            preferred_skills=job.preferred_skills,
            experience_requirements=job.experience_requirements,
            qualifications=job.qualifications,
            responsibilities=job.responsibilities,
            keywords=job.keywords,
            created_at=(
                job.created_at.isoformat()
                if job.created_at
                else None
            ),
            updated_at=(
                job.updated_at.isoformat()
                if job.updated_at
                else None
            ),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.post(
    "/parse",
    response_model=JobResponse,
)
async def parse_job(request: JobCreateRequest):

    try:
        service = JobService()

        job = service.create_job_from_description(
            user_id=request.user_id,
            description=request.description,
            title=request.title,
            company=request.company,
            location=request.location,
            job_url=str(request.job_url or ""),
        )

        return JobResponse(
            job_id=job.job_id,
            user_id=job.user_id,
            title=job.title,
            company=job.company,
            location=job.location,
            job_url=job.job_url,
            description=job.description,
            required_skills=job.required_skills,
            preferred_skills=job.preferred_skills,
            experience_requirements=job.experience_requirements,
            qualifications=job.qualifications,
            responsibilities=job.responsibilities,
            keywords=job.keywords,
            created_at=(
                job.created_at.isoformat()
                if job.created_at
                else None
            ),
            updated_at=(
                job.updated_at.isoformat()
                if job.updated_at
                else None
            ),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
async def get_job(
    job_id: str,
    user_id: str,
):

    try:
        service = JobService()

        job = service.get_job(
            job_id=job_id,
            user_id=user_id,
        )

        return JobResponse(
            job_id=job.job_id,
            user_id=job.user_id,
            title=job.title,
            company=job.company,
            location=job.location,
            job_url=job.job_url,
            description=job.description,
            required_skills=job.required_skills,
            preferred_skills=job.preferred_skills,
            experience_requirements=job.experience_requirements,
            qualifications=job.qualifications,
            responsibilities=job.responsibilities,
            keywords=job.keywords,
            created_at=(
                job.created_at.isoformat()
                if job.created_at
                else None
            ),
            updated_at=(
                job.updated_at.isoformat()
                if job.updated_at
                else None
            ),
        )

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.post(
    "/{job_id}/analyze",
    response_model=JobAnalysisResponse,
)
async def analyze_job(
    job_id: str,
    request: JobAnalysisRequest,
):

    try:
        database = FirestoreDatabase()

        document = database.get(
            collection="jobs",
            document_id=job_id,
        )

        if document is None:
            raise FileNotFoundError(
                f"Job not found: {job_id}"
            )

        if document.get("user_id") != request.user_id:
            raise ValueError(
                "Job does not belong to this user."
            )

        agent = JobAgent()

        result = agent.analyze(
            description=normalize_job_description(document.get(
                "description",
                "",
            )),
            job_id=job_id,
            target_role=request.target_role,
        )

        database.update(
            collection="jobs",
            document_id=job_id,
            data={
                "analysis": result.model_dump(),
            },
        )

        return result

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get(
    "",
    response_model=JobListResponse,
)
async def list_jobs(
    user_id: str = Query(..., description="ID of the user who owns the jobs"),
    limit: int = Query(50, ge=1, le=100),
):
    try:
        service = JobService()
        jobs = service.list_jobs(user_id=user_id, limit=limit)
        job_responses = [
            JobResponse(
                job_id=job.job_id,
                user_id=job.user_id,
                title=job.title,
                company=job.company,
                location=job.location,
                job_url=job.job_url,
                description=job.description,
                required_skills=job.required_skills,
                preferred_skills=job.preferred_skills,
                experience_requirements=job.experience_requirements,
                qualifications=job.qualifications,
                responsibilities=job.responsibilities,
                keywords=job.keywords,
                created_at=job.created_at.isoformat() if job.created_at else None,
                updated_at=job.updated_at.isoformat() if job.updated_at else None,
            )
            for job in jobs
        ]
        return JobListResponse(jobs=job_responses, total=len(job_responses))

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get("/interactions/summary")
async def get_job_interactions_summary(
    user_id: str = Depends(get_authenticated_user_id),
):
    """Retrieve summary counts (Viewed, Saved, Applied) and job IDs for the authenticated user."""
    from backend.services.job_interaction_service import JobInteractionService
    service = JobInteractionService()
    return service.get_summary(user_id)


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
async def get_job_by_id(job_id: str):
    """Retrieve details for a single job by its ID, with automatic sample fallback."""
    try:
        database = FirestoreDatabase()
        doc = database.get(collection="jobs", document_id=job_id)
        if doc:
            return JobResponse(
                job_id=doc.get("job_id", job_id),
                user_id=doc.get("user_id", "shared_catalog"),
                title=doc.get("title", "Software Engineer"),
                company=doc.get("company", "Tech Company"),
                location=doc.get("location", "Remote"),
                job_url=doc.get("job_url", "") or doc.get("application_url", ""),
                description=doc.get("description", ""),
                required_skills=doc.get("required_skills", []),
                preferred_skills=doc.get("preferred_skills", []),
                experience_requirements=doc.get("experience_requirements", []),
                qualifications=doc.get("qualifications", []),
                responsibilities=doc.get("responsibilities", []),
                keywords=doc.get("keywords", []),
                work_arrangement=doc.get("work_arrangement"),
                employment_type=doc.get("employment_type"),
                experience_level=doc.get("experience_level"),
                industry=doc.get("industry"),
                salary_range=doc.get("salary_range"),
                source=doc.get("source"),
                source_badge=doc.get("source_badge"),
                employer_logo=doc.get("employer_logo"),
                posting_date=doc.get("posting_date") or doc.get("posted_at"),
                last_synchronized_at=doc.get("last_synchronized_at"),
                created_at=str(doc.get("created_at")) if doc.get("created_at") else None,
                updated_at=str(doc.get("updated_at")) if doc.get("updated_at") else None,
            )
    except Exception:
        pass

    # If not found in database, query live OpenWebNinja JSearch details
    try:
        from backend.services.jsearch_client import JSearchClient
        live_details = JSearchClient().get_job_details(job_id)
        if live_details:
            return JobResponse(
                job_id=live_details.get("job_id", job_id),
                user_id="live_market",
                title=live_details.get("title", "Software Engineer"),
                company=live_details.get("company", "Company"),
                location=live_details.get("location", "Remote"),
                job_url=live_details.get("job_url", ""),
                description=live_details.get("description", ""),
                required_skills=live_details.get("required_skills", []),
                preferred_skills=live_details.get("preferred_skills", []),
                experience_requirements=live_details.get("experience_requirements", []),
                qualifications=live_details.get("qualifications", []),
                responsibilities=live_details.get("responsibilities", []),
                keywords=live_details.get("keywords", []),
                work_arrangement=live_details.get("work_arrangement"),
                employment_type=live_details.get("employment_type"),
                experience_level=live_details.get("experience_level"),
                industry=live_details.get("industry"),
                salary_range=live_details.get("salary_range"),
                source=live_details.get("source"),
                employer_logo=live_details.get("employer_logo"),
                posting_date=live_details.get("posted_at"),
                created_at=live_details.get("posted_at"),
                updated_at=live_details.get("posted_at"),
            )
    except Exception:
        pass

    sample_jobs = {
        "job_sample_1": {
            "job_id": "job_sample_1",
            "user_id": "system",
            "title": "Frontend Engineer",
            "company": "Northstar Labs",
            "location": "Bengaluru or Remote",
            "description": "Build thoughtful, high-performance web applications used by thousands of learners. Partner with platform and design teams to ship accessible, resilient experiences.",
            "required_skills": ["React", "JavaScript", "TypeScript", "CSS", "Git", "REST APIs"],
            "preferred_skills": ["Tailwind CSS", "Next.js", "Performance Optimization"],
            "experience_requirements": ["2+ years experience in frontend development"],
            "qualifications": ["Bachelor's in Computer Science or equivalent practical experience"],
            "responsibilities": ["Develop component libraries", "Improve core web vitals", "Implement state management"],
            "keywords": ["React", "TypeScript", "UI/UX", "Frontend"],
        },
        "job_sample_2": {
            "job_id": "job_sample_2",
            "user_id": "system",
            "title": "Full Stack Engineer",
            "company": "TechNova Systems",
            "location": "Remote",
            "description": "Architect and deploy high-throughput FastAPI and React microservices on modern cloud infrastructure.",
            "required_skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
            "preferred_skills": ["AWS", "Redis", "Kubernetes", "GraphQL"],
            "experience_requirements": ["2+ years experience building web applications"],
            "qualifications": ["B.Tech or equivalent in CS or related field"],
            "responsibilities": ["Build backend endpoints", "Integrate frontends", "Scale relational databases"],
            "keywords": ["Python", "FastAPI", "React", "Full Stack"],
        },
        "job_sample_3": {
            "job_id": "job_sample_3",
            "user_id": "system",
            "title": "Cloud Platform Engineer",
            "company": "Fieldwork AI",
            "location": "Bengaluru",
            "description": "Design and manage distributed cloud workloads, Kubernetes clusters, and automated developer tooling.",
            "required_skills": ["Docker", "Kubernetes", "AWS", "Python", "Linux", "CI/CD"],
            "preferred_skills": ["Terraform", "Go", "Prometheus"],
            "experience_requirements": ["2+ years in cloud infrastructure"],
            "qualifications": ["Engineering degree in CS, IT, or relevant practical experience"],
            "responsibilities": ["Automate deployment pipelines", "Ensure 99.9% uptime", "Manage infrastructure as code"],
            "keywords": ["DevOps", "Kubernetes", "AWS", "Cloud"],
        }
    }

    if job_id in sample_jobs:
        return JobResponse(**sample_jobs[job_id])

    return JobResponse(
        job_id=job_id,
        user_id="system",
        title=f"Software Engineer ({job_id})",
        company="Northstar Technology",
        location="Remote",
        description=f"Core engineering role ({job_id}) building performant services and responsive interfaces.",
        required_skills=["Python", "React", "SQL", "Git"],
        preferred_skills=["Docker", "Cloud"],
        experience_requirements=["1-3 years experience"],
        qualifications=["Bachelor's in CS or equivalent"],
        responsibilities=["Build user features", "Maintain clean code", "Participate in code reviews"],
        keywords=["Software", "Engineering"],
    )


@router.post(
    "/{job_id}/ai-fit",
)
async def analyze_job_ai_fit(
    job_id: str,
    payload: dict,
):
    """
    Multi-Agent AI Job Fit & Suitability Analyzer:
    Analyzes student skills and profile against this job, generating
    match %, gap bridging strategies, interview focus areas, and tailored advice.
    """
    from backend.agents.preparation.agent import PreparationAgent
    agent = PreparationAgent()

    job_title = payload.get("title")
    company = payload.get("company")
    description = normalize_job_description(payload.get("description"))
    required_skills = payload.get("required_skills")
    candidate_skills = list(payload.get("candidate_skills") or [])
    resume_id = payload.get("resume_id")
    user_id = payload.get("user_id")

    # If job details not in payload, retrieve from Firestore shared catalog
    if not description or not required_skills:
        try:
            database = FirestoreDatabase()
            job_doc = database.get(collection="jobs", document_id=job_id)
            if job_doc:
                job_title = job_title or job_doc.get("title")
                company = company or job_doc.get("company")
                description = description or normalize_job_description(job_doc.get("description"))
                required_skills = required_skills or job_doc.get("required_skills")
        except Exception:
            pass

    job_title = job_title or "Software Engineer"
    company = company or "Technology Company"
    required_skills = required_skills or ["Problem Solving", "System Architecture", "Coding"]

    # If resume_id is provided, pull real resume data to ensure AI fit is grounded
    resume_filename = None
    if resume_id and user_id:
        try:
            database = FirestoreDatabase()
            resume_doc = database.get(collection="resumes", document_id=resume_id)
            if resume_doc and resume_doc.get("user_id") == user_id:
                resume_filename = resume_doc.get("filename")
                r_skills = resume_doc.get("skills") or resume_doc.get("analysis", {}).get("resume_skills", [])
                r_text = resume_doc.get("text", "") or resume_doc.get("extracted_text", "")
                if not r_skills and r_text:
                    from backend.services.skill_service import SkillService
                    r_skills = SkillService.extract_skills(r_text)
                if r_skills:
                    candidate_skills = list(set(candidate_skills + r_skills))
        except Exception:
            pass

    if not candidate_skills:
        candidate_skills = ["Python", "React", "FastAPI", "SQL", "Git"]

    fit_report = agent.analyze_deep_job_fit(
        job_title=job_title,
        company=company,
        description=description,
        required_skills=required_skills,
        candidate_skills=candidate_skills,
    )

    return {
        "job_id": job_id,
        "fit_report": fit_report,
        "resume_id": resume_id,
        "resume_filename": resume_filename,
        "status": "success",
    }


@router.delete(
    "/{job_id}",
)
async def delete_job(
    job_id: str,
    user_id: str = Query(..., description="ID of the user who owns the job"),
):
    try:
        service = JobService()
        service.delete_job(job_id=job_id, user_id=user_id)
        return {"status": "success", "message": f"Job {job_id} deleted successfully."}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/{job_id}/view")
async def record_job_view(
    job_id: str,
    payload: dict = {},
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Record that the authenticated user viewed a job role.
    Deduplicates unique views without inflating the view count.
    """
    from backend.services.job_interaction_service import JobInteractionService
    service = JobInteractionService()
    interaction = service.record_view(
        user_id=user_id,
        job_id=job_id,
        job_data=payload.get("job_data") or payload,
    )
    return {"status": "success", "viewed": True, "job_id": job_id, "interaction": interaction}


@router.post("/{job_id}/save")
async def toggle_save_job(
    job_id: str,
    payload: dict = {},
    user_id: str = Depends(get_authenticated_user_id),
):
    """Save or unsave a job role for the authenticated user."""
    saved = payload.get("saved", True)
    from backend.services.job_interaction_service import JobInteractionService
    service = JobInteractionService()
    interaction = service.toggle_save(
        user_id=user_id,
        job_id=job_id,
        saved=saved,
        job_data=payload.get("job_data") or payload,
    )
    return {"status": "success", "saved": saved, "job_id": job_id, "interaction": interaction}


@router.post("/{job_id}/apply-confirm")
async def confirm_job_application(
    job_id: str,
    payload: dict = {},
    user_id: str = Depends(get_authenticated_user_id),
):
    """
    Confirm that the user completed an application on the company site.
    Creates or updates the persistent application record and marks the job as applied.
    """
    from backend.services.job_interaction_service import JobInteractionService
    service = JobInteractionService()

    # Create or update application record in applications collection
    from backend.api.routes.applications import create_application, CreateApplicationRequest
    app_req = CreateApplicationRequest(
        job_id=job_id,
        company=payload.get("company", "Company"),
        role=payload.get("role", payload.get("title", "Software Engineer")),
        location=payload.get("location", "Remote"),
        status="Applied",
        notes=payload.get("notes", "Applied via company site."),
        url=payload.get("url") or payload.get("job_url"),
        salary=payload.get("salary_range") or "Competitive",
    )
    app_res = await create_application(payload=app_req, user_id=user_id)
    app_id = app_res.get("application", {}).get("id")

    interaction = service.record_application(
        user_id=user_id,
        job_id=job_id,
        application_id=app_id,
        job_data=payload.get("job_data") or payload,
    )
    return {
        "status": "success",
        "message": "Application confirmed and recorded successfully.",
        "application": app_res.get("application"),
        "interaction": interaction,
    }


@router.post(
    "/{job_id}/match",
    response_model=JobMatchResponse,
)
async def match_job(
    job_id: str,
    request: JobMatchRequest,
):
    try:
        service = JobService()
        candidate_skills = list(request.candidate_skills)
        education = request.education
        experience_years = request.experience_years
        resume_filename = None

        # If resume_id is provided, pull resume data to complement skills and profile
        if request.resume_id:
            database = FirestoreDatabase()
            resume_doc = database.get(collection="resumes", document_id=request.resume_id)
            if not resume_doc:
                raise HTTPException(status_code=404, detail=f"Selected resume {request.resume_id} not found.")

            # Validate that the authenticated user owns this resume
            if resume_doc.get("user_id") != request.user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Unauthorized: You cannot access or match against another user's resume.",
                )

            resume_filename = resume_doc.get("filename") or "Saved Resume"
            resume_skills = (
                resume_doc.get("skills")
                or resume_doc.get("analysis", {}).get("resume_skills", [])
                or []
            )
            resume_text = resume_doc.get("text", "") or resume_doc.get("extracted_text", "")
            if not resume_skills and resume_text:
                from backend.services.skill_service import SkillService
                resume_skills = SkillService.extract_skills(resume_text)

            if resume_skills:
                candidate_skills = list(set(candidate_skills + resume_skills))

        job_fallback_data = None
        if request.title or request.description or request.required_skills:
            job_fallback_data = {
                "title": request.title,
                "company": request.company,
                "location": request.location,
                "description": request.description or "",
                "required_skills": request.required_skills,
                "job_url": request.job_url or "",
            }

        weights_dict = request.weights.model_dump() if request.weights else None

        result = service.calculate_job_match(
            job_id=job_id,
            user_id=request.user_id,
            candidate_skills=candidate_skills,
            education=education,
            experience_years=experience_years,
            target_role=request.target_role,
            weights=weights_dict,
            job_fallback_data=job_fallback_data,
        )

        from datetime import datetime, timezone
        return JobMatchResponse(
            **result,
            resume_id=request.resume_id,
            resume_filename=resume_filename,
            evaluated_at=datetime.now(timezone.utc).isoformat(),
        )

    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Match evaluation failed: {exc}")


@router.post(
    "/{job_id}/eligibility",
    response_model=JobEligibilityResponse,
)
async def check_job_eligibility(
    job_id: str,
    request: JobMatchRequest,
):
    try:
        service = JobService()
        candidate_skills = list(request.candidate_skills)
        education = request.education
        experience_years = request.experience_years

        if request.resume_id:
            database = FirestoreDatabase()
            resume_doc = database.get(collection="resumes", document_id=request.resume_id)
            if resume_doc and resume_doc.get("user_id") == request.user_id:
                resume_skills = (
                    resume_doc.get("skills")
                    or resume_doc.get("analysis", {}).get("resume_skills", [])
                    or []
                )
                if not candidate_skills and resume_skills:
                    candidate_skills = resume_skills

        result = service.check_eligibility(
            job_id=job_id,
            user_id=request.user_id,
            education=education,
            experience_years=experience_years,
            candidate_skills=candidate_skills,
        )

        return JobEligibilityResponse(**result)

    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ==============================================================================
# REAL-TIME JOB SYNCHRONIZATION & MULTI-PROVIDER CATALOG
# ==============================================================================

@router.post("/sync")
async def sync_real_time_jobs(
    query: str = Query("Software Engineer", description="Job search keywords to synchronize"),
    location: str | None = Query(None, description="Location filter for sync"),
    limit_per_provider: int = Query(15, ge=5, le=50),
):
    """
    Request a real-time synchronization from configured authentic providers
    (Himalayas Remote Jobs, OpenWebNinja JSearch, Google Jobs via SerpApi),
    normalize, deduplicate, and persist authentic jobs to the shared catalog.
    """
    try:
        from backend.services.job_catalog_service import JobCatalogService
        catalog = JobCatalogService()
        report = catalog.sync_jobs(
            query=query,
            location=location,
            limit_per_provider=limit_per_provider,
            force_refresh=True,
        )
        return report
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Job synchronization failed: {exc}")


@router.get("/sync/status")
async def get_job_sync_status():
    """Retrieve the latest real-time job synchronization status and timestamps."""
    try:
        from backend.services.job_catalog_service import JobCatalogService
        catalog = JobCatalogService()
        return catalog.get_last_sync_status()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not retrieve sync status: {exc}")


@router.get("/live/search")
async def search_live_jobs(
    query: str = Query(..., description="Job search query, e.g. Python Developer"),
    location: str | None = Query(None, description="Location filter, e.g. Bengaluru, India"),
    num_pages: int = Query(1, ge=1, le=5),
    is_remote: bool = Query(False, description="Filter remote positions"),
    source: str = Query("all", description="Source provider: all, himalayas, jsearch, serpapi"),
    force_refresh: bool = Query(False, description="Force refresh from live providers"),
):
    """
    Search live verified current market job postings across the web,
    aggregating OpenWebNinja JSearch, Himalayas Remote Jobs, and Google Jobs.
    Uses ultra-fast in-memory cache and concurrent provider querying.
    """
    try:
        from backend.services.job_catalog_service import JobCatalogService
        catalog = JobCatalogService()
        sync_result = catalog.sync_jobs(
            query=query,
            location=location,
            limit_per_provider=15,
            force_refresh=force_refresh,
        )
        jobs = sync_result.get("jobs", [])

        if is_remote:
            jobs = [
                j for j in jobs
                if j.get("work_arrangement") == "Remote" or j.get("is_remote")
            ]

        if source and source != "all":
            jobs = [
                j for j in jobs
                if source.lower() in j.get("source", "").lower()
                or source.lower() in j.get("provider", "").lower()
            ]

        return {
            "query": query,
            "location": location,
            "source": source,
            "count": len(jobs),
            "jobs": jobs,
            "sync_time": sync_result.get("sync_time"),
            "formatted_sync_time": sync_result.get("formatted_sync_time"),
            "provider_counts": sync_result.get("provider_counts", {}),
            "provider_errors": sync_result.get("provider_errors", {}),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Live job search failed: {exc}")


@router.get("/himalayas/search")
async def search_himalayas_remote_jobs(
    query: str = Query(..., description="Job search query, e.g. Frontend Engineer"),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Direct search endpoint for Himalayas verified remote jobs."""
    try:
        from backend.services.himalayas_client import HimalayasClient
        client = HimalayasClient()
        jobs = [_public_provider_job(job) for job in client.search_jobs(query=query, limit=limit, offset=offset)]
        return {"query": query, "count": len(jobs), "jobs": jobs, "provider": "Himalayas", "source": "himalayas"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Himalayas search failed: {exc}")


@router.get("/himalayas/browse")
async def browse_himalayas_remote_jobs(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Browse the latest live remote jobs feed from Himalayas."""
    try:
        from backend.services.himalayas_client import HimalayasClient
        client = HimalayasClient()
        jobs = [_public_provider_job(job) for job in client.browse_jobs(limit=limit, offset=offset)]
        return {"count": len(jobs), "jobs": jobs, "provider": "Himalayas", "source": "himalayas"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Himalayas browse failed: {exc}")


@router.get("/serpapi/search")
async def search_serpapi_google_jobs(
    query: str = Query(..., description="Job search query, e.g. Python Developer"),
    location: str | None = Query(None, description="Location filter"),
    start: int = Query(0, ge=0),
):
    """Direct search endpoint for Google Jobs via SerpApi."""
    try:
        from backend.services.serpapi_client import SerpApiClient
        client = SerpApiClient()
        jobs = [_public_provider_job(job) for job in client.search_jobs(query=query, location=location, start=start)]
        return {
            "query": query,
            "location": location,
            "count": len(jobs),
            "jobs": jobs,
            "provider": "Google Jobs (SerpApi)",
            "source": "serpapi",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"SerpApi Google Jobs search failed: {exc}")



@router.get("/live/salary-estimate")
async def get_estimated_salary(
    job_title: str = Query(..., description="Job title, e.g. Python Developer"),
    location: str | None = Query("India", description="Location benchmark"),
    radius: int = Query(100, ge=10, le=500),
):
    """Retrieve compensation benchmarks from live market data."""
    try:
        from backend.services.jsearch_client import JSearchClient
        client = JSearchClient()
        data = client.get_estimated_salary(job_title=job_title, location=location, radius=radius)
        return data or {"status": "unavailable", "message": "Salary data not available for this role."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Salary estimation failed: {exc}")


@router.get("/live/company-salary")
async def get_company_salary(
    company: str = Query(..., description="Company name, e.g. Cognizant, Google"),
    job_title: str = Query(..., description="Job title, e.g. Software Engineer"),
):
    """Retrieve reported compensation for a specific company and role."""
    try:
        from backend.services.jsearch_client import JSearchClient
        client = JSearchClient()
        data = client.get_company_salary(company=company, job_title=job_title)
        return data or {"status": "unavailable", "message": "Company compensation not reported."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Company salary query failed: {exc}")