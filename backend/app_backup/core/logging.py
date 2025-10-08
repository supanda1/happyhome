"""
Logging configuration for the application.
"""

import logging
import sys
from pathlib import Path
from typing import Dict, Any

import structlog
from pythonjsonlogger import jsonlogger

from .config import settings


def setup_logging() -> None:
    """
    Configure structured logging for the application.
    
    Sets up both standard Python logging and structlog for better
    log management and monitoring.
    """
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure structlog
    timestamper = structlog.processors.TimeStamper(fmt="ISO")
    
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            timestamper,
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if settings.LOG_JSON_FORMAT 
            else structlog.dev.ConsoleRenderer(colors=True),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard logging
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove default handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    
    if settings.LOG_JSON_FORMAT:
        # JSON formatter for production
        json_formatter = jsonlogger.JsonFormatter(
            '%(asctime)s %(name)s %(levelname)s %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(json_formatter)
    else:
        # Human-readable formatter for development
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        console_handler.setFormatter(formatter)
    
    root_logger.addHandler(console_handler)
    
    # File handler for production
    if settings.is_production:
        file_handler = logging.FileHandler(log_dir / "app.log")
        file_handler.setLevel(log_level)
        
        if settings.LOG_JSON_FORMAT:
            file_handler.setFormatter(json_formatter)
        else:
            file_handler.setFormatter(formatter)
        
        root_logger.addHandler(file_handler)
        
        # Error file handler
        error_handler = logging.FileHandler(log_dir / "error.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(json_formatter if settings.LOG_JSON_FORMAT else formatter)
        root_logger.addHandler(error_handler)
    
    # Configure third-party loggers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    
    # Application logger
    app_logger = structlog.get_logger("household_services")
    app_logger.info(
        "Logging configured",
        log_level=settings.LOG_LEVEL,
        json_format=settings.LOG_JSON_FORMAT,
        environment=settings.ENVIRONMENT
    )


def get_logger(name: str = None) -> structlog.BoundLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Logger name (defaults to calling module)
        
    Returns:
        Configured structlog BoundLogger instance
    """
    return structlog.get_logger(name or __name__)


class LoggingMiddleware:
    """
    Middleware to log HTTP requests and responses.
    """
    
    def __init__(self, app):
        self.app = app
        self.logger = get_logger("http")
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = scope
        method = request["method"]
        path = request["path"]
        query_string = request.get("query_string", b"").decode()
        
        # Log request
        self.logger.info(
            "HTTP request started",
            method=method,
            path=path,
            query_string=query_string,
            client=request.get("client"),
            user_agent=dict(request.get("headers", {})).get(b"user-agent", b"").decode()
        )
        
        # Capture response
        response_data = {}
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                response_data["status_code"] = message["status"]
                response_data["headers"] = dict(message.get("headers", []))
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
            
            # Log successful response
            self.logger.info(
                "HTTP request completed",
                method=method,
                path=path,
                status_code=response_data.get("status_code"),
                response_time_ms=None  # Could add timing if needed
            )
            
        except Exception as exc:
            # Log error response
            self.logger.error(
                "HTTP request failed",
                method=method,
                path=path,
                error=str(exc),
                error_type=type(exc).__name__
            )
            raise


# Create application logger instance
logger = get_logger("household_services")