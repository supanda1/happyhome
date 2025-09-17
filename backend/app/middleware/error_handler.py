"""
Error handling middleware and exception handlers.
"""

import traceback
import uuid
from datetime import datetime
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.logging import get_logger
from ..schemas.base import ErrorDetail, ErrorResponse

logger = get_logger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle uncaught exceptions and provide consistent error responses.
    """
    
    async def dispatch(self, request: Request, call_next):
        """Process request and handle any exceptions."""
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        try:
            response = await call_next(request)
            return response
            
        except Exception as exc:
            logger.error(
                "Unhandled exception in request",
                request_id=request_id,
                path=request.url.path,
                method=request.method,
                error=str(exc),
                traceback=traceback.format_exc()
            )
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=ErrorResponse(
                    success=False,
                    message="Internal server error",
                    error_code="INTERNAL_ERROR",
                    request_id=request_id,
                    timestamp=datetime.utcnow().isoformat()
                ).dict()
            )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handle HTTP exceptions and return consistent error response.
    
    Args:
        request: FastAPI request object
        exc: HTTP exception
        
    Returns:
        JSON response with error details
    """
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    logger.warning(
        "HTTP exception",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        status_code=exc.status_code,
        detail=exc.detail
    )
    
    # Map common HTTP status codes to error codes
    error_code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED", 
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR",
        502: "BAD_GATEWAY",
        503: "SERVICE_UNAVAILABLE",
    }
    
    error_code = error_code_map.get(exc.status_code, "UNKNOWN_ERROR")
    
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            success=False,
            message=exc.detail,
            error_code=error_code,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat()
        ).dict()
    )


async def validation_exception_handler(
    request: Request, 
    exc: RequestValidationError
) -> JSONResponse:
    """
    Handle request validation errors and return detailed error response.
    
    Args:
        request: FastAPI request object
        exc: Request validation error
        
    Returns:
        JSON response with validation error details
    """
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    logger.warning(
        "Validation error",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        errors=exc.errors()
    )
    
    # Convert Pydantic errors to our error detail format
    error_details = []
    for error in exc.errors():
        field_path = " -> ".join(str(loc) for loc in error["loc"])
        error_details.append(
            ErrorDetail(
                field=field_path,
                message=error["msg"],
                code=error["type"]
            )
        )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            success=False,
            message="Validation error",
            error_code="VALIDATION_ERROR",
            details=error_details,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat()
        ).dict()
    )


async def pydantic_validation_exception_handler(
    request: Request,
    exc: ValidationError
) -> JSONResponse:
    """
    Handle Pydantic validation errors.
    
    Args:
        request: FastAPI request object
        exc: Pydantic validation error
        
    Returns:
        JSON response with validation error details
    """
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    logger.warning(
        "Pydantic validation error",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        errors=exc.errors()
    )
    
    # Convert Pydantic errors to our error detail format
    error_details = []
    for error in exc.errors():
        field_path = " -> ".join(str(loc) for loc in error["loc"])
        error_details.append(
            ErrorDetail(
                field=field_path,
                message=error["msg"],
                code=error["type"]
            )
        )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            success=False,
            message="Data validation error",
            error_code="VALIDATION_ERROR",
            details=error_details,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat()
        ).dict()
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle any other exceptions not caught by specific handlers.
    
    Args:
        request: FastAPI request object
        exc: Generic exception
        
    Returns:
        JSON response with generic error message
    """
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    logger.error(
        "Unhandled exception",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        error=str(exc),
        traceback=traceback.format_exc()
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            success=False,
            message="An unexpected error occurred",
            error_code="INTERNAL_ERROR",
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat()
        ).dict()
    )


def setup_exception_handlers(app: FastAPI) -> None:
    """
    Register all exception handlers with the FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, pydantic_validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
    
    logger.info("Exception handlers registered successfully")


class DatabaseError(Exception):
    """Custom database error."""
    pass


class ServiceError(Exception):
    """Custom service error."""
    pass


class BusinessLogicError(Exception):
    """Custom business logic error."""
    pass


# Custom exception handlers for specific business errors
async def database_error_handler(request: Request, exc: DatabaseError) -> JSONResponse:
    """Handle database errors."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    logger.error(
        "Database error",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        error=str(exc)
    )
    
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=ErrorResponse(
            success=False,
            message="Database service is temporarily unavailable",
            error_code="DATABASE_ERROR",
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat()
        ).dict()
    )


async def service_error_handler(request: Request, exc: ServiceError) -> JSONResponse:
    """Handle service errors."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    logger.error(
        "Service error",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        error=str(exc)
    )
    
    return JSONResponse(
        status_code=status.HTTP_502_BAD_GATEWAY,
        content=ErrorResponse(
            success=False,
            message="External service error",
            error_code="SERVICE_ERROR",
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat()
        ).dict()
    )


async def business_logic_error_handler(
    request: Request, 
    exc: BusinessLogicError
) -> JSONResponse:
    """Handle business logic errors."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    
    logger.warning(
        "Business logic error",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        error=str(exc)
    )
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponse(
            success=False,
            message=str(exc),
            error_code="BUSINESS_LOGIC_ERROR",
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat()
        ).dict()
    )


def setup_custom_exception_handlers(app: FastAPI) -> None:
    """
    Register custom exception handlers.
    
    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(DatabaseError, database_error_handler)
    app.add_exception_handler(ServiceError, service_error_handler)
    app.add_exception_handler(BusinessLogicError, business_logic_error_handler)
    
    logger.info("Custom exception handlers registered successfully")