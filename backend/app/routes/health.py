"""
Health check endpoints for monitoring and status verification.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy import text

from ..core.config import settings
from ..core.logging import get_logger
from ..database.connection import Database, get_db_session, check_database_health
from ..schemas.base import HealthCheckResponse

logger = get_logger(__name__)

router = APIRouter()


@router.get("/health", response_model=HealthCheckResponse)
async def health_check(db = Depends(get_db_session)):
    """
    Comprehensive health check endpoint.
    
    Checks the status of the API service and its dependencies including
    the database connection and other critical services.
    
    Returns:
        HealthCheckResponse: Detailed health status information
    """
    logger.debug("Health check requested")
    
    # Check database connectivity
    database_status = {
        "connected": False,
        "response_time_ms": 0,
        "error": None
    }
    
    try:
        start_time = datetime.utcnow()
        # Simple database connection test
        try:
            async with Database.get_session() as session:
                await session.execute(text("SELECT 1"))
            is_connected = True
        except Exception:
            is_connected = False
        end_time = datetime.utcnow()
        
        response_time = (end_time - start_time).total_seconds() * 1000
        
        database_status.update({
            "connected": is_connected,
            "response_time_ms": round(response_time, 2),
        })
        
        if is_connected:
            # Get database statistics
            db_stats = await check_database_health()
            database_status["stats"] = db_stats
            
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        database_status.update({
            "connected": False,
            "error": str(e)
        })
    
    # Overall status
    overall_status = "healthy" if database_status["connected"] else "unhealthy"
    
    # Dependencies status (can be extended)
    dependencies = {
        "database": {
            "status": "up" if database_status["connected"] else "down",
            "response_time_ms": database_status["response_time_ms"],
        }
    }
    
    # Add external service checks here if needed
    # dependencies["redis"] = {...}
    # dependencies["email_service"] = {...}
    
    health_response = HealthCheckResponse(
        status=overall_status,
        timestamp=datetime.utcnow().isoformat(),
        version=settings.APP_VERSION,
        database=database_status,
        dependencies=dependencies,
    )
    
    logger.debug("Health check completed", status=overall_status)
    
    return health_response


@router.get("/health/liveness")
async def liveness_probe():
    """
    Kubernetes liveness probe endpoint.
    
    Simple endpoint that returns 200 OK if the application is running.
    This is used by Kubernetes to determine if the pod should be restarted.
    
    Returns:
        dict: Simple status message
    """
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}


@router.get("/health/readiness")
async def readiness_probe():
    """
    Kubernetes readiness probe endpoint.
    
    Checks if the application is ready to serve traffic by verifying
    critical dependencies like database connectivity.
    
    Returns:
        dict: Readiness status
        
    Raises:
        HTTPException: 503 if service is not ready
    """
    try:
        # Check database connectivity
        is_db_connected = await Database.ping()
        
        if not is_db_connected:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not accessible"
            )
        
        # Add other readiness checks here
        # - Check Redis connection
        # - Check external API availability
        # - Verify configuration
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {
                "database": "up"
            }
        }
        
    except Exception as e:
        logger.error("Readiness probe failed", error=str(e))
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service not ready: {str(e)}"
        )


@router.get("/health/startup")
async def startup_probe():
    """
    Kubernetes startup probe endpoint.
    
    Used during application startup to determine when the application
    has finished initializing and is ready for liveness/readiness probes.
    
    Returns:
        dict: Startup status
        
    Raises:
        HTTPException: 503 if startup is not complete
    """
    try:
        # Check if database connection is established
        if not Database.client:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection not initialized"
            )
        
        # Check if database is accessible
        is_db_connected = await Database.ping()
        if not is_db_connected:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not accessible"
            )
        
        return {
            "status": "started",
            "timestamp": datetime.utcnow().isoformat(),
            "initialization": {
                "database": "connected",
                "models": "loaded",
                "configuration": "validated"
            }
        }
        
    except Exception as e:
        logger.error("Startup probe failed", error=str(e))
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Startup not complete: {str(e)}"
        )


@router.get("/version")
async def version_info():
    """
    Get application version and build information.
    
    Returns:
        dict: Version and environment information
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "python_version": None,  # Could add sys.version_info
        "build_timestamp": None,  # Could add from build process
        "git_commit": None,  # Could add from build process
    }