from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.applications import router as applications_router
from backend.api.routes.auth import router as auth_router
from backend.api.routes.career import router as career_router
from backend.api.routes.dashboard import router as dashboard_router
from backend.api.routes.digital_twin import router as digital_twin_router
from backend.api.routes.interview import router as interview_router
from backend.api.routes.jobs import router as jobs_router
from backend.api.routes.preparation import router as preparation_router
from backend.api.routes.profile import router as profile_router
from backend.api.routes.resume import router as resume_router
from backend.api.routes.skills import router as skills_router
from backend.utils.errors import CareerTwinError, career_twin_error_handler, validation_error_handler


app = FastAPI(
    title="CareerTwin API",
    description="Career Intelligence, ATS Analysis, Job Matching, Preparation & Digital Twin Engine",
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(CareerTwinError, career_twin_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)

# Core & teammate routes
app.include_router(career_router)
app.include_router(digital_twin_router)
app.include_router(auth_router)
app.include_router(preparation_router)
app.include_router(interview_router)
app.include_router(dashboard_router)
app.include_router(profile_router)
app.include_router(applications_router)

# Resume, Job, and Skill intelligence routes (both root and /api/v1 prefix)
app.include_router(resume_router)
app.include_router(jobs_router)
app.include_router(skills_router)
app.include_router(resume_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(skills_router, prefix="/api/v1")



from fastapi.responses import RedirectResponse


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "CareerTwin API"}

