from fastapi import APIRouter, HTTPException, Query

from backend.agents.skills.agent import SkillAgent
from backend.database.firestore import FirestoreDatabase
from backend.schemas.skill import (
    CareerManagerSkillEnvelope,
    SkillAnalysisRequest,
    SkillAnalysisResponse,
    SkillCatalogResponse,
    SkillGapRequest,
    SkillGapResponse,
    SkillItem,
)
from backend.services.llm_service import LLMService
from backend.services.skill_service import SkillService

router = APIRouter(
    prefix="/skills",
    tags=["Skills"],
)


@router.get(
    "",
    response_model=SkillCatalogResponse,
)
@router.get(
    "/taxonomy",
    response_model=SkillCatalogResponse,
)
async def get_skills_catalog():
    """Retrieve catalog of standard skills, categories, and prerequisites."""
    try:
        service = SkillService()
        catalog = service.get_standard_catalog()
        items = [
            SkillItem(
                skill_id=s.skill_id,
                name=s.name,
                category=s.category,
                difficulty=s.difficulty,
                aliases=s.aliases,
                description=s.description,
            )
            for s in catalog
        ]
        return SkillCatalogResponse(skills=items, total=len(items))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/analyze",
    response_model=SkillAnalysisResponse,
)
async def analyze_skills(
    request: SkillAnalysisRequest,
    envelope: bool = Query(False, description="Wrap in Career Manager standard envelope"),
):
    """
    Analyze student skills against target role or job description.
    Integrates resume skills and job requirements if target_job_id provided.
    """
    try:
        service = SkillService()
        llm = None
        try:
            llm = LLMService()
        except Exception:
            # LLM API key not set or unavailable; agent falls back gracefully
            llm = None

        agent = SkillAgent(llm_client=llm, skill_service=service)

        current_skills = list(request.current_skills)
        if request.resume_skills:
            current_skills.extend(request.resume_skills)

        required_skills = list(request.job_required_skills or [])

        # If target_job_id is provided, fetch required skills from Firestore
        if request.target_job_id:
            try:
                db = FirestoreDatabase()
                job_doc = db.get(collection="jobs", document_id=request.target_job_id)
                if job_doc:
                    job_reqs = job_doc.get("required_skills", [])
                    job_prefs = job_doc.get("preferred_skills", [])
                    required_skills = list(set(required_skills + job_reqs + job_prefs))
            except Exception:
                pass

        result = agent.analyze(
            current_skills=current_skills,
            required_skills=required_skills,
            target_role=request.target_role,
        )

        return result

    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Skill analysis failed: {exc}")


@router.post(
    "/gaps",
    response_model=SkillGapResponse,
)
async def detect_skill_gaps(request: SkillGapRequest):
    """Detect and prioritize skill gaps between current skills and target job skills."""
    try:
        service = SkillService()
        matched, gaps, score = service.compare_skills(
            current_skills=request.current_skills,
            required_skills=request.job_required_skills,
        )
        priority_items = service.prioritize_gaps(
            skill_gaps=gaps,
            target_role=request.target_role or "Target Role",
        )

        return SkillGapResponse(
            current_skills=service.normalize_skill_list(request.current_skills),
            required_skills=service.normalize_skill_list(request.job_required_skills),
            matched_skills=matched,
            skill_gaps=gaps,
            priority_skills=priority_items,
            skill_gap_score=score,
        )

    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Skill gap detection failed: {exc}")


@router.get(
    "/gaps",
    response_model=SkillGapResponse,
)
async def get_skill_gaps(
    user_id: str = Query(..., description="User ID"),
    job_id: str = Query(..., description="Target Job ID"),
):
    """Convenience endpoint to query skill gaps directly between a user's resume and a target job."""
    try:
        db = FirestoreDatabase()
        service = SkillService()

        # Fetch job
        job_doc = db.get(collection="jobs", document_id=job_id)
        if not job_doc:
            raise HTTPException(status_code=404, detail=f"Job not found: {job_id}")

        job_required = job_doc.get("required_skills", []) + job_doc.get("preferred_skills", [])

        # Fetch latest user resume
        resumes = db.list(collection="resumes", filters={"user_id": user_id}, limit=1)
        current_skills = []
        if resumes:
            res_doc = resumes[0]
            current_skills = (
                res_doc.get("skills")
                or res_doc.get("analysis", {}).get("resume_skills", [])
                or []
            )

        matched, gaps, score = service.compare_skills(
            current_skills=current_skills,
            required_skills=job_required,
        )
        priority_items = service.prioritize_gaps(
            skill_gaps=gaps,
            target_role=job_doc.get("title", "Target Role"),
        )

        return SkillGapResponse(
            current_skills=service.normalize_skill_list(current_skills),
            required_skills=service.normalize_skill_list(job_required),
            matched_skills=matched,
            skill_gaps=gaps,
            priority_skills=priority_items,
            skill_gap_score=score,
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
