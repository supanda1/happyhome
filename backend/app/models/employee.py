"""
Employee model for service technicians and staff management.
"""

from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import Boolean, Float, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Employee(Base):
    """
    Employee model for service technicians and staff.
    
    Manages information about employees who perform services,
    including their expertise, ratings, and availability.
    """
    
    __tablename__ = "employees"
    
    # Basic information
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    
    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )
    
    # Professional details
    expertise_areas: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    # Performance metrics
    rating: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        index=True
    )
    
    completed_jobs: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    # Status and availability
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    
    is_available: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    
    # Location and service area
    location: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )
    
    service_areas: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    # Professional details
    employee_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        unique=True,
        nullable=True,
        index=True
    )
    
    department: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    position: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    # Contact and emergency details
    emergency_contact_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    emergency_contact_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    
    # Work schedule and availability
    work_schedule: Mapped[Dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict
    )
    
    # Skills and certifications
    skills: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    certifications: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    # Performance and quality metrics
    average_job_time: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True  # In minutes
    )
    
    customer_satisfaction_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )
    
    # Notes and additional info
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Relationships
    # TODO: Add bookings relationship when assigned_employee_id is added to Booking model
    # bookings: Mapped[List["Booking"]] = relationship(
    #     "Booking",
    #     back_populates="assigned_employee",
    #     lazy="select"
    # )
    
    @property
    def full_name(self) -> str:
        """Get employee's full name."""
        return self.name
    
    @property
    def expertise_display(self) -> str:
        """Get comma-separated expertise areas for display."""
        return ", ".join(self.expertise_areas) if self.expertise_areas else ""
    
    @property
    def service_areas_display(self) -> str:
        """Get comma-separated service areas for display."""
        return ", ".join(self.service_areas) if self.service_areas else ""
    
    @property
    def is_qualified_for_service(self) -> bool:
        """Check if employee has any expertise areas defined."""
        return len(self.expertise_areas) > 0
    
    def is_expert_in(self, area: str) -> bool:
        """
        Check if employee has expertise in a specific area.
        
        Args:
            area: Expertise area to check
            
        Returns:
            True if employee has expertise in the area
        """
        return area.lower() in [expertise.lower() for expertise in self.expertise_areas]
    
    def can_serve_area(self, area: str) -> bool:
        """
        Check if employee can serve a specific area.
        
        Args:
            area: Service area to check
            
        Returns:
            True if employee can serve the area
        """
        if not self.service_areas:
            return True  # If no specific areas set, assume can serve anywhere
        
        return area.lower() in [service_area.lower() for service_area in self.service_areas]
    
    def update_rating(self, new_rating: float, job_count_increment: int = 1) -> None:
        """
        Update employee rating with new feedback.
        
        Args:
            new_rating: New rating to incorporate
            job_count_increment: Number of jobs to add to completed count
        """
        if self.completed_jobs == 0:
            self.rating = new_rating
        else:
            # Calculate weighted average
            total_rating = self.rating * self.completed_jobs
            total_rating += new_rating
            self.completed_jobs += job_count_increment
            self.rating = total_rating / self.completed_jobs
    
    def dict_for_response(self, exclude: set = None, include_admin_fields: bool = False) -> Dict[str, any]:
        """
        Get employee data for API responses.
        
        Args:
            exclude: Fields to exclude
            include_admin_fields: Whether to include admin-only fields
        """
        data = self.to_dict(exclude=exclude)
        
        result = {
            "id": data["id"],
            "name": data["name"],
            "email": data["email"],
            "phone": data["phone"],
            "expertiseAreas": data["expertise_areas"],
            "rating": data["rating"],
            "completedJobs": data["completed_jobs"],
            "isActive": data["is_active"],
            "isAvailable": data["is_available"],
            "location": data["location"],
            "serviceAreas": data["service_areas"],
            "skills": data["skills"],
            "certifications": data["certifications"],
            "fullName": self.full_name,
            "expertiseDisplay": self.expertise_display,
            "serviceAreasDisplay": self.service_areas_display,
            "isQualified": self.is_qualified_for_service,
        }
        
        if include_admin_fields:
            result.update({
                "employeeId": data["employee_id"],
                "department": data["department"],
                "position": data["position"],
                "emergencyContactName": data["emergency_contact_name"],
                "emergencyContactPhone": data["emergency_contact_phone"],
                "workSchedule": data["work_schedule"],
                "averageJobTime": data["average_job_time"],
                "customerSatisfactionScore": data["customer_satisfaction_score"],
                "notes": data["notes"],
                "createdAt": data["created_at"],
                "updatedAt": data["updated_at"],
            })
        
        return result