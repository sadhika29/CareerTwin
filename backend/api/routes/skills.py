from fastapi import APIRouter, Depends, Header, HTTPException, Query

from backend.agents.skills.agent import SkillAgent
from backend.database.firestore import FirestoreDatabase
from backend.schemas.skill import (
    CareerManagerSkillEnvelope,
    LearningProgressItem,
    LearningProgressResponse,
    LearningProgressUpdateRequest,
    SkillAnalysisRequest,
    SkillAnalysisResponse,
    SkillCatalogResponse,
    SkillGapRequest,
    SkillGapResponse,
    SkillItem,
    TargetRoleUpdateRequest,
    UserSkillCreateRequest,
    UserSkillItem,
    UserSkillsResponse,
    UserSkillsSummary,
    UserSkillUpdateRequest,
)
from backend.services.llm_service import LLMService
from backend.services.skill_service import SkillService
from backend.services.user_skill_service import UserSkillService


async def get_auth_user_id(
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


# --------------------------------------------------------------------------
# USER SKILLS MANAGEMENT ENDPOINTS
# --------------------------------------------------------------------------

@router.get(
    "/user",
    response_model=UserSkillsResponse,
)
async def get_user_skills(
    user_id: str = Depends(get_auth_user_id),
):
    """Retrieve all skills and live summary metrics for the authenticated user."""
    try:
        service = UserSkillService()
        skills, summary = service.get_user_skills(user_id)
        return UserSkillsResponse(
            skills=[UserSkillItem(**s) for s in skills],
            summary=UserSkillsSummary(**summary),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user skills: {exc}")


@router.post(
    "/user",
    response_model=UserSkillItem,
    status_code=201,
)
async def create_user_skill(
    payload: UserSkillCreateRequest,
    user_id: str = Depends(get_auth_user_id),
):
    """Add a new skill to the authenticated user's profile with duplicate validation."""
    try:
        service = UserSkillService()
        skill = service.create_skill(user_id=user_id, data=payload.model_dump())
        return UserSkillItem(**skill)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create skill: {exc}")


@router.patch(
    "/user/target-role",
    response_model=UserSkillsSummary,
)
async def update_user_target_role(
    payload: TargetRoleUpdateRequest,
    user_id: str = Depends(get_auth_user_id),
):
    """Update target role for user in profile and return refreshed summary."""
    try:
        service = UserSkillService()
        clean_role = service.set_user_target_role(user_id, payload.target_role)
        _, summary = service.get_user_skills(user_id)
        summary["target_role"] = clean_role
        return UserSkillsSummary(**summary)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update target role: {exc}")


@router.patch(
    "/user/{skill_id}",
    response_model=UserSkillItem,
)
async def update_user_skill(
    skill_id: str,
    payload: UserSkillUpdateRequest,
    user_id: str = Depends(get_auth_user_id),
):
    """Update fields of an existing skill with strict ownership checks."""
    try:
        service = UserSkillService()
        data = {k: v for k, v in payload.model_dump().items() if v is not None}
        updated = service.update_skill(user_id=user_id, skill_id=skill_id, data=data)
        return UserSkillItem(**updated)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Skill not found: {skill_id}")
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update skill: {exc}")


@router.delete(
    "/user/{skill_id}",
)
async def delete_user_skill(
    skill_id: str,
    user_id: str = Depends(get_auth_user_id),
):
    """Delete a user's skill with ownership validation."""
    try:
        service = UserSkillService()
        service.delete_skill(user_id=user_id, skill_id=skill_id)
        return {"status": "success", "message": f"Skill {skill_id} deleted successfully."}
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Skill not found: {skill_id}")
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to delete skill: {exc}")


# --------------------------------------------------------------------------
# LEARNING & PRACTICE PROGRESS ENDPOINTS
# --------------------------------------------------------------------------

@router.get(
    "/learning/progress",
    response_model=LearningProgressResponse,
)
async def get_learning_progress(
    category: str | None = Query(default=None),
    user_id: str = Depends(get_auth_user_id),
):
    """Retrieve practice progress for DSA, Aptitude, or Programming topics."""
    try:
        service = UserSkillService()
        res = service.get_learning_progress(user_id=user_id, category=category)
        items = [LearningProgressItem(**r) for r in res["progress"]]
        items_map = {k: LearningProgressItem(**v) for k, v in res["progress_map"].items()}
        return LearningProgressResponse(
            progress=items,
            progress_map=items_map,
            counts=res["counts"],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch learning progress: {exc}")


@router.post(
    "/learning/progress",
    response_model=LearningProgressItem,
)
async def update_learning_progress(
    payload: LearningProgressUpdateRequest,
    user_id: str = Depends(get_auth_user_id),
):
    """Record practice status, notes, or completion for a learning resource."""
    try:
        service = UserSkillService()
        record = service.update_learning_progress(user_id=user_id, data=payload.model_dump())
        return LearningProgressItem(**record)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to update learning progress: {exc}")

