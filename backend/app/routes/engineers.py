"""
Engineers API routes for service technician management.

This module provides CRUD operations for engineers (service technicians)
with proper validation, filtering, and business logic.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from ..core.dependencies import get_current_admin_user
from ..database.connection import get_db_session
from ..core.logging import get_logger
from ..models.engineer import Engineer
from ..models.user import User
from ..schemas.base import BaseResponse

logger = get_logger(__name__)

router = APIRouter(prefix="/api/engineers")


@router.get("")
async def get_engineers(
    include_inactive: bool = Query(False, description="Include inactive engineers"),
    expertise: Optional[str] = Query(None, description="Filter by expertise area"),
    location: Optional[str] = Query(None, description="Filter by location"),
    available_only: bool = Query(False, description="Show only available engineers"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get all engineers with optional filtering.
    
    Returns list of engineers with their basic information and performance metrics.
    """
    logger.info("Get engineers request", 
                admin_id=str(current_user.id),
                include_inactive=include_inactive,
                expertise=expertise,
                location=location,
                available_only=available_only)
    
    try:
        # Build query with filters
        query = select(Engineer)
        
        # Active filter
        if not include_inactive:
            query = query.where(Engineer.is_active == True)
        
        # Availability filter
        if available_only:
            query = query.where(Engineer.is_available == True)
        
        # Expertise filter
        if expertise:
            query = query.where(Engineer.expertise_areas.op('?')(expertise))
        
        # Location filter
        if location:
            query = query.where(Engineer.location.ilike(f"%{location}%"))
        
        # Order and paginate
        query = query.order_by(Engineer.name).offset(offset).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        engineers = result.scalars().all()
        
        # Get total count for pagination
        count_query = select(func.count(Engineer.id))
        if not include_inactive:
            count_query = count_query.where(Engineer.is_active == True)
        if available_only:
            count_query = count_query.where(Engineer.is_available == True)
        if expertise:
            count_query = count_query.where(Engineer.expertise_areas.op('?')(expertise))
        if location:
            count_query = count_query.where(Engineer.location.ilike(f"%{location}%"))
            
        total_count = await db.scalar(count_query)
        
        # Format response
        engineers_data = [engineer.dict_for_response(include_admin_fields=True) for engineer in engineers]
        
        return BaseResponse(
            success=True,
            message=f"Found {len(engineers_data)} engineers",
            data={
                "engineers": engineers_data,
                "pagination": {
                    "total": total_count,
                    "offset": offset,
                    "limit": limit,
                    "count": len(engineers_data)
                }
            }
        )
        
    except Exception as e:
        logger.error("Failed to get engineers", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve engineers"
        )


@router.get("/{engineer_id}")
async def get_engineer(
    engineer_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific engineer by ID."""
    logger.info("Get engineer request", engineer_id=engineer_id, admin_id=str(current_user.id))
    
    try:
        engineer = await db.scalar(
            select(Engineer).where(Engineer.id == UUID(engineer_id))
        )
        
        if not engineer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Engineer not found"
            )
        
        return BaseResponse(
            success=True,
            message="Engineer retrieved successfully",
            data=engineer.dict_for_response(include_admin_fields=True)
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid engineer ID format"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get engineer", engineer_id=engineer_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve engineer"
        )


@router.post("")
async def create_engineer(
    engineer_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new engineer."""
    logger.info("Creating engineer", admin_id=str(current_user.id))
    
    try:
        # Check for existing engineer with same email
        existing = await db.scalar(
            select(Engineer).where(Engineer.email == engineer_data["email"])
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Engineer with this email already exists"
            )
        
        # Create engineer
        engineer = Engineer(
            name=engineer_data["name"],
            email=engineer_data["email"],
            phone=engineer_data["phone"],
            expertise_areas=engineer_data.get("expertise_areas", []),
            rating=engineer_data.get("rating", 0.0),
            completed_jobs=engineer_data.get("completed_jobs", 0),
            is_active=engineer_data.get("is_active", True),
            is_available=engineer_data.get("is_available", True),
            location=engineer_data.get("location", ""),
            service_areas=engineer_data.get("service_areas", []),
            engineer_id=engineer_data.get("engineer_id"),
            department=engineer_data.get("department"),
            position=engineer_data.get("position"),
            skills=engineer_data.get("skills", []),
            certifications=engineer_data.get("certifications", []),
            work_schedule=engineer_data.get("work_schedule", {}),
            notes=engineer_data.get("notes")
        )
        
        db.add(engineer)
        await db.commit()
        await db.refresh(engineer)
        
        logger.info("Engineer created successfully", engineer_id=str(engineer.id))
        
        return BaseResponse(
            success=True,
            message="Engineer created successfully",
            data=engineer.dict_for_response(include_admin_fields=True)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Failed to create engineer", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create engineer"
        )


@router.put("/{engineer_id}")
async def update_engineer(
    engineer_id: str,
    engineer_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update an existing engineer."""
    logger.info("Updating engineer", engineer_id=engineer_id, admin_id=str(current_user.id))
    
    try:
        engineer = await db.scalar(
            select(Engineer).where(Engineer.id == UUID(engineer_id))
        )
        if not engineer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Engineer not found"
            )
        
        # Update fields
        for field, value in engineer_data.items():
            if hasattr(engineer, field):
                setattr(engineer, field, value)
        
        await db.commit()
        await db.refresh(engineer)
        
        logger.info("Engineer updated successfully", engineer_id=engineer_id)
        
        return BaseResponse(
            success=True,
            message="Engineer updated successfully",
            data=engineer.dict_for_response(include_admin_fields=True)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Failed to update engineer", engineer_id=engineer_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update engineer"
        )


@router.delete("/{engineer_id}")
async def delete_engineer(
    engineer_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete an engineer."""
    logger.info("Deleting engineer", engineer_id=engineer_id, admin_id=str(current_user.id))
    
    try:
        engineer = await db.scalar(
            select(Engineer).where(Engineer.id == UUID(engineer_id))
        )
        if not engineer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Engineer not found"
            )
        
        await db.delete(engineer)
        await db.commit()
        
        logger.info("Engineer deleted successfully", engineer_id=engineer_id)
        
        return BaseResponse(
            success=True,
            message="Engineer deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Failed to delete engineer", engineer_id=engineer_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete engineer"
        )


@router.get("/expertise/areas")
async def get_expertise_areas(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all unique expertise areas from engineers."""
    logger.info("Get expertise areas request", admin_id=str(current_user.id))
    
    try:
        # Get all engineers with expertise areas
        result = await db.execute(
            select(Engineer.expertise_areas).where(
                and_(
                    Engineer.is_active == True,
                    Engineer.expertise_areas.is_not(None)
                )
            )
        )
        
        # Collect all unique areas
        all_areas = set()
        for areas_list in result.scalars():
            if areas_list:
                all_areas.update(areas_list)
        
        expertise_areas = sorted(list(all_areas))
        
        return BaseResponse(
            success=True,
            message=f"Found {len(expertise_areas)} expertise areas",
            data={
                "expertise_areas": expertise_areas,
                "count": len(expertise_areas)
            }
        )
        
    except Exception as e:
        logger.error("Failed to get expertise areas", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve expertise areas"
        )


@router.get("/stats/workload")
async def get_engineers_workload_stats(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get engineer workload statistics."""
    logger.info("Get engineers workload stats", admin_id=str(current_user.id))
    
    try:
        # This matches the endpoint that was failing
        # Get basic engineer counts
        total_engineers = await db.scalar(select(func.count(Engineer.id)))
        active_engineers = await db.scalar(
            select(func.count(Engineer.id)).where(Engineer.is_active == True)
        )
        available_engineers = await db.scalar(
            select(func.count(Engineer.id)).where(
                and_(Engineer.is_active == True, Engineer.is_available == True)
            )
        )
        
        # Get engineers with their basic info
        engineers_result = await db.execute(
            select(Engineer).where(Engineer.is_active == True).order_by(Engineer.name)
        )
        engineers = engineers_result.scalars().all()
        
        # Format engineers data for workload display
        engineers_data = []
        for engineer in engineers:
            engineers_data.append({
                "id": str(engineer.id),
                "name": engineer.name,
                "email": engineer.email,
                "phone": engineer.phone,
                "expertise": engineer.expertise_areas,
                "location": engineer.location,
                "rating": engineer.rating,
                "completedJobs": engineer.completed_jobs,
                "isActive": engineer.is_active,
                "isAvailable": engineer.is_available,
                "activeAssignments": 0,  # TODO: Calculate from assignments
                "pendingTasks": 0,       # TODO: Calculate from order items
                "activeTasks": 0         # TODO: Calculate from order items
            })
        
        summary_stats = {
            "total_engineers": total_engineers or 0,
            "active_engineers": active_engineers or 0,
            "idle_engineers": available_engineers or 0,
            "total_active_tasks": 0,  # TODO: Calculate from active order items
            "average_tasks_per_active_engineer": 0.0,
            "busiest_engineer": engineers[0].name if engineers else None,
            "max_tasks": 0
        }
        
        return BaseResponse(
            success=True,
            message=f"Found workload statistics for {len(engineers_data)} engineers",
            data={
                "summary": summary_stats,
                "engineers": engineers_data
            }
        )
        
    except Exception as e:
        logger.error("Failed to get engineers workload stats", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve engineers workload statistics"
        )