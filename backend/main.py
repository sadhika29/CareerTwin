from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.career import router as career_router
from backend.api.routes.digital_twin import router as digital_twin_router
from backend.api.routes.auth import router as auth_router
from backend.api.routes.preparation import router as preparation_router
from backend.utils.errors import CareerTwinError, career_twin_error_handler, validation_error_handler
from fastapi.exceptions import RequestValidationError


app = FastAPI(title="CareerTwin API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_exception_handler(CareerTwinError, career_twin_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.include_router(career_router)
app.include_router(digital_twin_router)
app.include_router(auth_router)
app.include_router(preparation_router)


@app.get("/health")
async def health():
	return {"status": "ok", "service": "CareerTwin API"}
