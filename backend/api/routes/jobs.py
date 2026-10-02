from fastapi import APIRouter, HTTPException, Query

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
            description=document.get(
                "description",
                "",
            ),
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
                user_id=doc.get("user_id", "system"),
                title=doc.get("title", "Software Engineer"),
                company=doc.get("company", "Tech Company"),
                location=doc.get("location", "Remote"),
                job_url=doc.get("job_url", ""),
                description=doc.get("description", ""),
                required_skills=doc.get("required_skills", []),
                preferred_skills=doc.get("preferred_skills", []),
                experience_requirements=doc.get("experience_requirements", []),
                qualifications=doc.get("qualifications", []),
                responsibilities=doc.get("responsibilities", []),
                keywords=doc.get("keywords", []),
                created_at=doc.get("created_at"),
                updated_at=doc.get("updated_at"),
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

    job_title = payload.get("title") or "Software Engineer"
    company = payload.get("company") or "Tech Company"
    description = payload.get("description")
    required_skills = payload.get("required_skills") or ["Problem Solving", "System Architecture"]
    candidate_skills = payload.get("candidate_skills") or ["Python", "React", "FastAPI"]

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

        # If resume_id is provided, pull resume data to complement skills and profile
        if request.resume_id:
            database = FirestoreDatabase()
            resume_doc = database.get(collection="resumes", document_id=request.resume_id)
            if resume_doc and resume_doc.get("user_id") == request.user_id:
                # Extract skills from resume if candidate_skills was empty
                resume_skills = (
                    resume_doc.get("skills")
                    or resume_doc.get("analysis", {}).get("resume_skills", [])
                    or []
                )
                if not candidate_skills and resume_skills:
                    candidate_skills = resume_skills

        weights_dict = request.weights.model_dump() if request.weights else None

        result = service.calculate_job_match(
            job_id=job_id,
            user_id=request.user_id,
            candidate_skills=candidate_skills,
            education=education,
            experience_years=experience_years,
            target_role=request.target_role,
            weights=weights_dict,
        )

        return JobMatchResponse(**result)

    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


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
# LIVE MARKET INTELLIGENCE (OPENWEBNINJA JSEARCH API)
# ==============================================================================

@router.get("/live/search")
async def search_live_jobs(
    query: str = Query(..., description="Job search query, e.g. Python Developer"),
    location: str | None = Query(None, description="Location filter, e.g. Bengaluru, India"),
    num_pages: int = Query(1, ge=1, le=5),
    is_remote: bool = Query(False, description="Filter remote positions"),
):
    """Search live verified current market job postings across the web."""
    try:
        from backend.services.jsearch_client import JSearchClient
        client = JSearchClient()
        jobs = client.search_jobs(
            query=query,
            location=location,
            num_pages=num_pages,
            is_remote=is_remote,
        )
        return {"query": query, "location": location, "count": len(jobs), "jobs": jobs}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Live job search failed: {exc}")


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