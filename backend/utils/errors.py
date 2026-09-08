from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class CareerTwinError(Exception):
	def __init__(self, code: str, message: str, status_code: int = 400):
		self.code = code
		self.message = message
		self.status_code = status_code
		super().__init__(message)


async def career_twin_error_handler(request: Request, exc: CareerTwinError) -> JSONResponse:
	return JSONResponse(status_code=exc.status_code, content={"success": False, "error": {"code": exc.code, "message": exc.message}})


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
	return JSONResponse(status_code=422, content={"success": False, "error": {"code": "INVALID_REQUEST", "message": "Request validation failed"}})
