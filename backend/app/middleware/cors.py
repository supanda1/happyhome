"""
CORS (Cross-Origin Resource Sharing) configuration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)


def setup_cors(app: FastAPI) -> None:
    """
    Configure CORS middleware for the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=settings.ALLOWED_METHODS,
        allow_headers=settings.ALLOWED_HEADERS,
        expose_headers=[
            "X-Request-ID",
            "X-Response-Time",
            "X-Rate-Limit-Remaining",
            "X-Rate-Limit-Reset",
        ],
        max_age=3600,  # Cache preflight requests for 1 hour
    )
    
    logger.info(
        "CORS middleware configured",
        allowed_origins=settings.ALLOWED_ORIGINS,
        allowed_methods=settings.ALLOWED_METHODS,
        allowed_headers=settings.ALLOWED_HEADERS,
    )