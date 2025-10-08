"""
Main FastAPI application module.

This module initializes the FastAPI application with all middleware,
routers, and configuration for the household services booking system.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

from .core.config import settings
from .core.logging import setup_logging
from .database.connection import Database
from .middleware import (
    ErrorHandlerMiddleware,
    LoggingMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    setup_cors,
    setup_exception_handlers,
)
from .routes import (
    admin_router,
    analytics_router,
    auth_router,
    bookings_router,
    cart_router,
    configuration_router,
    coupons_router,
    dashboard_router,
    health_router,
    images_router,
    notifications_router,
    orders_router,
    reviews_router,
    services_router,
    sms_config_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    
    Handles startup and shutdown events for the FastAPI application.
    """
    # Startup
    setup_logging()
    
    # Get logger early
    from .core.logging import get_logger
    logger = get_logger("startup")
    
    # Log environment diagnostics
    import os
    logger.info(f"Starting application with PORT={os.getenv('PORT', 'not set')}")
    logger.info(f"DATABASE_URL available: {'DATABASE_URL' in os.environ}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Configured host:port = {settings.HOST}:{settings.PORT}")
    
    # Check if database connection should be skipped (for Railway deployment testing)
    skip_db = os.getenv("SKIP_DB_CONNECTION", "false").lower() == "true"
    
    if skip_db:
        logger.warning("Database connection skipped due to SKIP_DB_CONNECTION=true")
    else:
        try:
            # Connect to database (allow startup to continue even if DB fails)
            logger.info("Attempting database connection...")
            await Database.connect_db()
            logger.info("Database connection successful")
        except Exception as e:
            logger.error(f"Database connection failed during startup: {e}")
            logger.warning("Application will start without database - some endpoints may not work")
    
    # Log startup completion
    logger.info(
        "Application startup completed",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        port=settings.PORT,
        host=settings.HOST
    )
    
    yield
    
    # Shutdown
    try:
        await Database.close_db()
        logger.info("Application shutdown completed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        Configured FastAPI application instance
    """
    # Create FastAPI app
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="A comprehensive API for household services booking and management",
        docs_url="/docs" if settings.SHOW_DOCS else None,
        redoc_url="/redoc" if settings.SHOW_DOCS else None,
        openapi_url="/openapi.json" if settings.SHOW_DOCS else None,
        lifespan=lifespan,
    )
    
    # Add middleware (order matters - last added is executed first)
    
    # Security headers middleware
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Rate limiting middleware (disabled in development)
    if settings.ENVIRONMENT != "development":
        app.add_middleware(RateLimitMiddleware)  
    
    # Gzip compression middleware
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Logging middleware
    app.add_middleware(LoggingMiddleware)
    
    # Error handling middleware
    app.add_middleware(ErrorHandlerMiddleware)
    
    # CORS middleware (should be last)
    setup_cors(app)
    
    # Setup exception handlers
    setup_exception_handlers(app)
    
    # Include routers
    app.include_router(health_router, prefix="", tags=["Health"])
    app.include_router(health_router, prefix="/api", tags=["Health API"])
    app.include_router(auth_router, prefix="/api/v1", tags=["Authentication"])
    app.include_router(services_router, prefix="/api/v1", tags=["Services"])
    app.include_router(bookings_router, prefix="/api/v1", tags=["Bookings"])
    app.include_router(orders_router, prefix="/api/v1", tags=["Orders"])
    app.include_router(notifications_router, prefix="/api/v1", tags=["Notifications"])
    app.include_router(reviews_router, prefix="/api/v1", tags=["Reviews"])
    app.include_router(coupons_router, prefix="/api/v1", tags=["Coupons"])
    app.include_router(dashboard_router, prefix="/api/v1", tags=["Dashboard"])
    
    # Configuration routes (using /api prefix to match frontend expectations)
    app.include_router(configuration_router, prefix="/api", tags=["Configuration"])
    
    # Admin routes (using /api prefix to match frontend expectations)
    app.include_router(admin_router, prefix="/api", tags=["Admin"])
    
    # Analytics routes (using /api prefix to match frontend expectations)  
    app.include_router(analytics_router, prefix="/api", tags=["Analytics"])
    
    # Cart routes (using /api prefix to match frontend expectations)
    app.include_router(cart_router, prefix="/api", tags=["Cart"])
    
    # Auth routes (using /api prefix to match frontend expectations)
    app.include_router(auth_router, prefix="/api", tags=["Authentication Frontend"])
    
    # Image routes (using /api prefix to match frontend expectations)
    app.include_router(images_router, prefix="/api/admin", tags=["Images"])
    
    # SMS Configuration routes (using /api prefix to match frontend expectations)
    app.include_router(sms_config_router, prefix="/api/sms-config", tags=["SMS Configuration"])
    
    return app


# Create the application instance
app = create_app()


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs_url": "/docs" if settings.SHOW_DOCS else None,
        "api_base": "/api/v1",
    }


@app.get("/debug")
async def debug_info():
    """Debug endpoint with deployment diagnostics."""
    import os
    return {
        "port": os.getenv('PORT', 'not set'),
        "database_available": 'DATABASE_URL' in os.environ,
        "host": settings.HOST,
        "environment": settings.ENVIRONMENT,
        "app_name": settings.APP_NAME
    }


# Health check endpoint (simple) - Must not depend on database
@app.get("/ping")  
async def ping():
    """Simple ping endpoint for basic health checks - Railway health check."""
    from datetime import datetime
    return {
        "status": "ok", 
        "message": "pong", 
        "timestamp": datetime.utcnow().isoformat(),
        "service": "household-services-api",
        "version": settings.APP_VERSION
    }


# Ultra simple health check for Railway
@app.get("/health")
async def simple_health():
    """Ultra simple health check."""
    return {"alive": True}


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
    )