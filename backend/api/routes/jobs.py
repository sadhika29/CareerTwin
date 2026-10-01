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