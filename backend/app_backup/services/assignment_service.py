"""
Automated Assignment Service for Employee-Order Assignment

This service provides intelligent assignment algorithms for automatically
assigning employees to orders based on location, availability, expertise,
and performance metrics.
"""

from datetime import datetime, time
from enum import Enum
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
import logging
import math

# Graceful geopy import with fallback
try:
    from geopy.distance import geodesic
    GEOPY_AVAILABLE = True
except ImportError:
    GEOPY_AVAILABLE = False
    # Fallback distance calculation using Haversine formula
    def geodesic(coord1, coord2):
        class Distance:
            def __init__(self, lat1, lon1, lat2, lon2):
                self.kilometers = self._haversine_distance(lat1, lon1, lat2, lon2)
            
            def _haversine_distance(self, lat1, lon1, lat2, lon2):
                """Calculate distance between two points using Haversine formula."""
                R = 6371  # Earth's radius in kilometers
                
                lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.asin(math.sqrt(a))
                
                return R * c
        
        return Distance(coord1[0], coord1[1], coord2[0], coord2[1])

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from ..models.employee import Employee
from ..models.booking import Booking, BookingStatus
from ..models.service import Service, ServiceCategory
from ..models.user import UserAddress
from ..core.logging import get_logger

logger = get_logger(__name__)


class AssignmentStrategy(str, Enum):
    """Assignment strategy enumeration."""
    LOCATION_ONLY = "location_only"
    AVAILABILITY_ONLY = "availability_only"
    LOCATION_AND_AVAILABILITY = "location_and_availability"
    BEST_FIT = "best_fit"
    ROUND_ROBIN = "round_robin"
    MANUAL = "manual"


class AssignmentPriority(str, Enum):
    """Assignment priority factors."""
    LOCATION = "location"
    AVAILABILITY = "availability"
    EXPERTISE = "expertise"
    RATING = "rating"
    WORKLOAD = "workload"
    CUSTOMER_SATISFACTION = "customer_satisfaction"


class AssignmentConfiguration:
    """Configuration for assignment algorithms."""
    
    def __init__(
        self,
        strategy: AssignmentStrategy = AssignmentStrategy.BEST_FIT,
        max_distance_km: float = 25.0,
        priority_weights: Dict[AssignmentPriority, float] = None,
        require_expertise_match: bool = True,
        max_daily_assignments: int = 8,
        working_hours_start: time = time(8, 0),
        working_hours_end: time = time(18, 0),
        buffer_time_minutes: int = 30
    ):
        self.strategy = strategy
        self.max_distance_km = max_distance_km
        self.priority_weights = priority_weights or {
            AssignmentPriority.LOCATION: 0.3,
            AssignmentPriority.AVAILABILITY: 0.25,
            AssignmentPriority.EXPERTISE: 0.2,
            AssignmentPriority.RATING: 0.15,
            AssignmentPriority.WORKLOAD: 0.1
        }
        self.require_expertise_match = require_expertise_match
        self.max_daily_assignments = max_daily_assignments
        self.working_hours_start = working_hours_start
        self.working_hours_end = working_hours_end
        self.buffer_time_minutes = buffer_time_minutes


class EmployeeAssignmentScore:
    """Score calculation for employee assignment."""
    
    def __init__(self, employee: Employee):
        self.employee = employee
        self.location_score: float = 0.0
        self.availability_score: float = 0.0
        self.expertise_score: float = 0.0
        self.rating_score: float = 0.0
        self.workload_score: float = 0.0
        self.customer_satisfaction_score: float = 0.0
        self.total_score: float = 0.0
        self.distance_km: Optional[float] = None
        self.is_available: bool = False
        self.has_expertise: bool = False
        self.current_workload: int = 0
        self.assignment_reason: str = ""
    
    def calculate_total_score(self, weights: Dict[AssignmentPriority, float]) -> float:
        """Calculate weighted total score."""
        self.total_score = (
            self.location_score * weights[AssignmentPriority.LOCATION] +
            self.availability_score * weights[AssignmentPriority.AVAILABILITY] +
            self.expertise_score * weights[AssignmentPriority.EXPERTISE] +
            self.rating_score * weights[AssignmentPriority.RATING] +
            self.workload_score * weights[AssignmentPriority.WORKLOAD] +
            self.customer_satisfaction_score * weights.get(AssignmentPriority.CUSTOMER_SATISFACTION, 0.0)
        )
        return self.total_score


class AutomatedAssignmentService:
    """
    Automated assignment service for intelligent employee-order matching.
    
    Provides multiple assignment strategies with configurable priorities
    and constraints for optimal employee assignment.
    """
    
    def __init__(self):
        self.config = AssignmentConfiguration()
    
    async def assign_employee_to_booking(
        self,
        db: AsyncSession,
        booking_id: UUID,
        strategy: AssignmentStrategy = None,
        manual_employee_id: UUID = None,
        config: AssignmentConfiguration = None
    ) -> Dict[str, Any]:
        """
        Assign an employee to a booking using the specified strategy.
        
        Args:
            db: Database session
            booking_id: ID of the booking to assign
            strategy: Assignment strategy to use
            manual_employee_id: Employee ID for manual assignment
            config: Custom assignment configuration
            
        Returns:
            Assignment result with employee details and reasoning
        """
        try:
            # Load booking with relationships
            booking = await db.scalar(
                select(Booking)
                .options(
                    selectinload(Booking.service).selectinload(Service.category),
                    selectinload(Booking.address),
                    selectinload(Booking.user)
                )
                .where(Booking.id == booking_id)
            )
            
            if not booking:
                return {
                    "success": False,
                    "error": "Booking not found",
                    "assignment": None
                }
            
            # Use provided config or default
            assignment_config = config or self.config
            assignment_strategy = strategy or assignment_config.strategy
            
            # Handle manual assignment
            if assignment_strategy == AssignmentStrategy.MANUAL and manual_employee_id:
                return await self._manual_assignment(db, booking, manual_employee_id)
            
            # Get eligible employees
            eligible_employees = await self._get_eligible_employees(
                db, booking, assignment_config
            )
            
            if not eligible_employees:
                return {
                    "success": False,
                    "error": "No eligible employees found for this booking",
                    "assignment": None,
                    "suggestions": await self._get_assignment_suggestions(db, booking)
                }
            
            # Apply assignment strategy
            if assignment_strategy == AssignmentStrategy.LOCATION_ONLY:
                selected_employee = await self._assign_by_location(
                    eligible_employees, booking, assignment_config
                )
            elif assignment_strategy == AssignmentStrategy.AVAILABILITY_ONLY:
                selected_employee = await self._assign_by_availability(
                    eligible_employees, booking, assignment_config
                )
            elif assignment_strategy == AssignmentStrategy.LOCATION_AND_AVAILABILITY:
                selected_employee = await self._assign_by_location_and_availability(
                    eligible_employees, booking, assignment_config
                )
            elif assignment_strategy == AssignmentStrategy.ROUND_ROBIN:
                selected_employee = await self._assign_by_round_robin(
                    db, eligible_employees, booking
                )
            else:  # BEST_FIT
                selected_employee = await self._assign_by_best_fit(
                    eligible_employees, booking, assignment_config
                )
            
            if selected_employee:
                # Assign employee to booking
                booking.assigned_technician_id = selected_employee.employee.id
                booking.status = BookingStatus.CONFIRMED
                
                # Add assignment note
                assignment_note = (
                    f"Auto-assigned to {selected_employee.employee.name} "
                    f"(Strategy: {assignment_strategy}, Score: {selected_employee.total_score:.2f}) "
                    f"- {selected_employee.assignment_reason}"
                )
                booking.admin_notes = f"{booking.admin_notes}\n{assignment_note}" if booking.admin_notes else assignment_note
                
                await db.commit()
                
                logger.info(
                    "Employee assigned successfully",
                    booking_id=str(booking_id),
                    employee_id=str(selected_employee.employee.id),
                    strategy=assignment_strategy,
                    score=selected_employee.total_score
                )
                
                return {
                    "success": True,
                    "assignment": {
                        "employeeId": str(selected_employee.employee.id),
                        "employeeName": selected_employee.employee.name,
                        "employeePhone": selected_employee.employee.phone,
                        "employeeLocation": selected_employee.employee.location,
                        "assignmentScore": selected_employee.total_score,
                        "assignmentReason": selected_employee.assignment_reason,
                        "strategy": assignment_strategy,
                        "distanceKm": selected_employee.distance_km,
                        "expertise": selected_employee.employee.expertise_areas
                    },
                    "alternativeEmployees": [
                        {
                            "employeeId": str(emp.employee.id),
                            "employeeName": emp.employee.name,
                            "score": emp.total_score,
                            "distanceKm": emp.distance_km
                        }
                        for emp in sorted(eligible_employees, key=lambda x: x.total_score, reverse=True)[:3]
                        if emp.employee.id != selected_employee.employee.id
                    ]
                }
            else:
                return {
                    "success": False,
                    "error": "No suitable employee found based on the selected strategy",
                    "assignment": None
                }
                
        except Exception as e:
            logger.error("Assignment failed", error=str(e), booking_id=str(booking_id))
            return {
                "success": False,
                "error": f"Assignment failed: {str(e)}",
                "assignment": None
            }
    
    async def _get_eligible_employees(
        self,
        db: AsyncSession,
        booking: Booking,
        config: AssignmentConfiguration
    ) -> List[EmployeeAssignmentScore]:
        """Get list of eligible employees for the booking."""
        
        # Base query for active and available employees
        query = select(Employee).where(
            and_(
                Employee.is_active == True,
                Employee.is_available == True
            )
        )
        
        # Add expertise filter if required
        if config.require_expertise_match and booking.service.category:
            category_name = booking.service.category.name
            query = query.where(
                Employee.expertise_areas.op('?')(category_name)
            )
        
        result = await db.execute(query)
        employees = result.scalars().all()
        
        # Calculate scores for each employee
        employee_scores = []
        for employee in employees:
            score = EmployeeAssignmentScore(employee)
            
            # Calculate location score
            await self._calculate_location_score(score, booking, config)
            
            # Calculate availability score
            await self._calculate_availability_score(db, score, booking)
            
            # Calculate expertise score
            self._calculate_expertise_score(score, booking)
            
            # Calculate rating score
            self._calculate_rating_score(score)
            
            # Calculate workload score
            await self._calculate_workload_score(db, score, booking)
            
            # Calculate customer satisfaction score
            self._calculate_customer_satisfaction_score(score)
            
            # Calculate total weighted score
            score.calculate_total_score(config.priority_weights)
            
            # Only include if within distance limit and has minimum requirements
            if (score.distance_km is None or score.distance_km <= config.max_distance_km):
                employee_scores.append(score)
        
        return employee_scores
    
    async def _calculate_location_score(
        self,
        score: EmployeeAssignmentScore,
        booking: Booking,
        config: AssignmentConfiguration
    ):
        """Calculate location-based score for employee."""
        try:
            if booking.address and score.employee.location:
                # Extract coordinates (this would need proper geocoding in production)
                # For now, using a simplified approach
                employee_location = self._parse_location(score.employee.location)
                booking_location = self._parse_address_location(booking.address)
                
                if employee_location and booking_location:
                    distance = geodesic(employee_location, booking_location).kilometers
                    score.distance_km = distance
                    
                    # Score decreases with distance (max score at 0km, min at max_distance)
                    if distance <= config.max_distance_km:
                        score.location_score = 1.0 - (distance / config.max_distance_km)
                        score.is_available = True
                    else:
                        score.location_score = 0.0
                else:
                    # Default score if location parsing fails
                    score.location_score = 0.5
                    score.distance_km = None
            else:
                score.location_score = 0.5
                
        except Exception as e:
            logger.warning("Location score calculation failed", error=str(e))
            score.location_score = 0.5
    
    async def _calculate_availability_score(
        self,
        db: AsyncSession,
        score: EmployeeAssignmentScore,
        booking: Booking
    ):
        """Calculate availability-based score for employee."""
        try:
            # Check current day assignments
            booking_date = booking.scheduled_date.date()
            
            # Count existing assignments for the day
            daily_assignments = await db.scalar(
                select(func.count(Booking.id))
                .where(
                    and_(
                        Booking.assigned_technician_id == score.employee.id,
                        func.date(Booking.scheduled_date) == booking_date,
                        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
                    )
                )
            )
            
            score.current_workload = daily_assignments or 0
            
            # Score based on workload (higher score = lower workload)
            max_assignments = self.config.max_daily_assignments
            if score.current_workload >= max_assignments:
                score.availability_score = 0.0
            else:
                score.availability_score = 1.0 - (score.current_workload / max_assignments)
            
            # Check for time conflicts
            time_conflicts = await self._check_time_conflicts(
                db, score.employee.id, booking
            )
            
            if time_conflicts:
                score.availability_score *= 0.3  # Reduce score for time conflicts
            
            score.is_available = score.availability_score > 0.0
            
        except Exception as e:
            logger.warning("Availability score calculation failed", error=str(e))
            score.availability_score = 0.5
    
    def _calculate_expertise_score(self, score: EmployeeAssignmentScore, booking: Booking):
        """Calculate expertise-based score for employee."""
        try:
            if booking.service and booking.service.category:
                category_name = booking.service.category.name.lower()
                service_name = booking.service.name.lower()
                
                # Check exact category match
                category_match = any(
                    category_name in area.lower() 
                    for area in score.employee.expertise_areas
                )
                
                # Check service-specific skills
                skill_match = any(
                    any(keyword in skill.lower() for keyword in service_name.split())
                    for skill in score.employee.skills
                )
                
                if category_match and skill_match:
                    score.expertise_score = 1.0
                    score.has_expertise = True
                elif category_match:
                    score.expertise_score = 0.8
                    score.has_expertise = True
                elif skill_match:
                    score.expertise_score = 0.6
                else:
                    score.expertise_score = 0.2 if not self.config.require_expertise_match else 0.0
            else:
                score.expertise_score = 0.5
                
        except Exception as e:
            logger.warning("Expertise score calculation failed", error=str(e))
            score.expertise_score = 0.5
    
    def _calculate_rating_score(self, score: EmployeeAssignmentScore):
        """Calculate rating-based score for employee."""
        try:
            # Normalize rating to 0-1 scale (assuming 5-star rating system)
            max_rating = 5.0
            score.rating_score = min(score.employee.rating / max_rating, 1.0)
        except Exception as e:
            logger.warning("Rating score calculation failed", error=str(e))
            score.rating_score = 0.5
    
    async def _calculate_workload_score(
        self,
        db: AsyncSession,
        score: EmployeeAssignmentScore,
        booking: Booking
    ):
        """Calculate workload-based score for employee."""
        try:
            # Already calculated in availability, use current workload
            max_workload = self.config.max_daily_assignments
            workload_ratio = score.current_workload / max_workload
            score.workload_score = 1.0 - workload_ratio
        except Exception as e:
            logger.warning("Workload score calculation failed", error=str(e))
            score.workload_score = 0.5
    
    def _calculate_customer_satisfaction_score(self, score: EmployeeAssignmentScore):
        """Calculate customer satisfaction score for employee."""
        try:
            if score.employee.customer_satisfaction_score:
                # Normalize to 0-1 scale
                score.customer_satisfaction_score = min(
                    score.employee.customer_satisfaction_score / 10.0, 1.0
                )
            else:
                score.customer_satisfaction_score = 0.5  # Default for new employees
        except Exception as e:
            logger.warning("Customer satisfaction score calculation failed", error=str(e))
            score.customer_satisfaction_score = 0.5
    
    async def _assign_by_location(
        self,
        employees: List[EmployeeAssignmentScore],
        booking: Booking,
        config: AssignmentConfiguration
    ) -> Optional[EmployeeAssignmentScore]:
        """Assign employee based on location proximity only."""
        eligible = [emp for emp in employees if emp.location_score > 0]
        if not eligible:
            return None
        
        selected = max(eligible, key=lambda x: x.location_score)
        selected.assignment_reason = f"Closest location ({selected.distance_km:.1f}km)"
        return selected
    
    async def _assign_by_availability(
        self,
        employees: List[EmployeeAssignmentScore],
        booking: Booking,
        config: AssignmentConfiguration
    ) -> Optional[EmployeeAssignmentScore]:
        """Assign employee based on availability only."""
        eligible = [emp for emp in employees if emp.availability_score > 0]
        if not eligible:
            return None
        
        selected = max(eligible, key=lambda x: x.availability_score)
        selected.assignment_reason = f"Best availability (workload: {selected.current_workload})"
        return selected
    
    async def _assign_by_location_and_availability(
        self,
        employees: List[EmployeeAssignmentScore],
        booking: Booking,
        config: AssignmentConfiguration
    ) -> Optional[EmployeeAssignmentScore]:
        """Assign employee based on combined location and availability."""
        eligible = [
            emp for emp in employees 
            if emp.location_score > 0 and emp.availability_score > 0
        ]
        if not eligible:
            return None
        
        # Weight location and availability equally
        for emp in eligible:
            emp.total_score = (emp.location_score + emp.availability_score) / 2
        
        selected = max(eligible, key=lambda x: x.total_score)
        selected.assignment_reason = (
            f"Location & availability match "
            f"({selected.distance_km:.1f}km, workload: {selected.current_workload})"
        )
        return selected
    
    async def _assign_by_best_fit(
        self,
        employees: List[EmployeeAssignmentScore],
        booking: Booking,
        config: AssignmentConfiguration
    ) -> Optional[EmployeeAssignmentScore]:
        """Assign employee using comprehensive best-fit algorithm."""
        eligible = [emp for emp in employees if emp.total_score > 0]
        if not eligible:
            return None
        
        selected = max(eligible, key=lambda x: x.total_score)
        selected.assignment_reason = (
            f"Best overall fit (score: {selected.total_score:.2f}) - "
            f"Location: {selected.distance_km:.1f}km, "
            f"Rating: {selected.employee.rating:.1f}, "
            f"Workload: {selected.current_workload}"
        )
        return selected
    
    async def _assign_by_round_robin(
        self,
        db: AsyncSession,
        employees: List[EmployeeAssignmentScore],
        booking: Booking
    ) -> Optional[EmployeeAssignmentScore]:
        """Assign employee using round-robin approach."""
        eligible = [emp for emp in employees if emp.is_available]
        if not eligible:
            return None
        
        # Sort by least recent assignment
        sorted_employees = sorted(eligible, key=lambda x: x.current_workload)
        selected = sorted_employees[0]
        selected.assignment_reason = "Round-robin assignment (least workload)"
        return selected
    
    async def _manual_assignment(
        self,
        db: AsyncSession,
        booking: Booking,
        employee_id: UUID
    ) -> Dict[str, Any]:
        """Handle manual employee assignment."""
        try:
            employee = await db.scalar(
                select(Employee).where(Employee.id == employee_id)
            )
            
            if not employee:
                return {
                    "success": False,
                    "error": "Employee not found",
                    "assignment": None
                }
            
            if not employee.is_active:
                return {
                    "success": False,
                    "error": "Employee is not active",
                    "assignment": None
                }
            
            # Assign manually
            booking.assigned_technician_id = employee_id
            booking.status = BookingStatus.CONFIRMED
            
            assignment_note = f"Manually assigned to {employee.name}"
            booking.admin_notes = f"{booking.admin_notes}\n{assignment_note}" if booking.admin_notes else assignment_note
            
            await db.commit()
            
            return {
                "success": True,
                "assignment": {
                    "employeeId": str(employee_id),
                    "employeeName": employee.name,
                    "employeePhone": employee.phone,
                    "employeeLocation": employee.location,
                    "assignmentReason": "Manual assignment",
                    "strategy": "manual"
                }
            }
            
        except Exception as e:
            logger.error("Manual assignment failed", error=str(e))
            return {
                "success": False,
                "error": f"Manual assignment failed: {str(e)}",
                "assignment": None
            }
    
    async def _check_time_conflicts(
        self,
        db: AsyncSession,
        employee_id: UUID,
        booking: Booking
    ) -> bool:
        """Check if employee has time conflicts for the booking."""
        try:
            booking_date = booking.scheduled_date.date()
            booking_start = booking.scheduled_time_start
            booking_end = booking.scheduled_time_end
            
            # Query for overlapping bookings
            conflicts = await db.scalars(
                select(Booking).where(
                    and_(
                        Booking.assigned_technician_id == employee_id,
                        func.date(Booking.scheduled_date) == booking_date,
                        Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]),
                        or_(
                            # Booking starts during existing booking
                            and_(
                                Booking.scheduled_time_start <= booking_start,
                                Booking.scheduled_time_end > booking_start
                            ),
                            # Booking ends during existing booking
                            and_(
                                Booking.scheduled_time_start < booking_end,
                                Booking.scheduled_time_end >= booking_end
                            ),
                            # Existing booking is within new booking
                            and_(
                                Booking.scheduled_time_start >= booking_start,
                                Booking.scheduled_time_end <= booking_end
                            )
                        )
                    )
                )
            )
            
            return len(list(conflicts)) > 0
            
        except Exception as e:
            logger.warning("Time conflict check failed", error=str(e))
            return False
    
    def _parse_location(self, location_string: str) -> Optional[Tuple[float, float]]:
        """Parse location string to coordinates (lat, lng)."""
        # Simplified implementation - in production, use proper geocoding
        # This would integrate with Google Maps API or similar service
        try:
            # For demo purposes, return mock coordinates based on common locations
            location_coords = {
                "mumbai": (19.0760, 72.8777),
                "delhi": (28.7041, 77.1025),
                "bangalore": (12.9716, 77.5946),
                "pune": (18.5204, 73.8567),
                "hyderabad": (17.3850, 78.4867),
                "chennai": (13.0827, 80.2707)
            }
            
            location_lower = location_string.lower()
            for city, coords in location_coords.items():
                if city in location_lower:
                    return coords
            
            return None  # Would implement proper geocoding here
            
        except Exception:
            return None
    
    def _parse_address_location(self, address: UserAddress) -> Optional[Tuple[float, float]]:
        """Parse address to coordinates."""
        # In production, this would use geocoding service
        try:
            # Mock implementation based on city
            if hasattr(address, 'city') and address.city:
                return self._parse_location(address.city)
            elif hasattr(address, 'address_line_1') and address.address_line_1:
                return self._parse_location(address.address_line_1)
            
            return None
            
        except Exception:
            return None
    
    async def _get_assignment_suggestions(
        self,
        db: AsyncSession,
        booking: Booking
    ) -> List[Dict[str, Any]]:
        """Get suggestions when no eligible employees found."""
        try:
            suggestions = []
            
            # Get all active employees to analyze why assignment failed
            all_employees = await db.scalars(
                select(Employee).where(Employee.is_active == True)
            )
            
            for employee in all_employees:
                suggestion = {
                    "employeeId": str(employee.id),
                    "employeeName": employee.name,
                    "issues": []
                }
                
                if not employee.is_available:
                    suggestion["issues"].append("Not currently available")
                
                # Check expertise
                if booking.service and booking.service.category:
                    category_name = booking.service.category.name
                    if not employee.is_expert_in(category_name):
                        suggestion["issues"].append(f"No expertise in {category_name}")
                
                if suggestion["issues"]:
                    suggestions.append(suggestion)
            
            return suggestions[:5]  # Return top 5 suggestions
            
        except Exception as e:
            logger.warning("Failed to generate assignment suggestions", error=str(e))
            return []


# Assignment configuration management
class AssignmentConfigurationManager:
    """Manages assignment configuration for different scenarios."""
    
    @staticmethod
    def get_default_config() -> AssignmentConfiguration:
        """Get default assignment configuration."""
        return AssignmentConfiguration()
    
    @staticmethod
    def get_location_priority_config() -> AssignmentConfiguration:
        """Get configuration prioritizing location."""
        return AssignmentConfiguration(
            strategy=AssignmentStrategy.LOCATION_ONLY,
            priority_weights={
                AssignmentPriority.LOCATION: 0.7,
                AssignmentPriority.AVAILABILITY: 0.2,
                AssignmentPriority.EXPERTISE: 0.1,
                AssignmentPriority.RATING: 0.0,
                AssignmentPriority.WORKLOAD: 0.0
            }
        )
    
    @staticmethod
    def get_availability_priority_config() -> AssignmentConfiguration:
        """Get configuration prioritizing availability."""
        return AssignmentConfiguration(
            strategy=AssignmentStrategy.AVAILABILITY_ONLY,
            priority_weights={
                AssignmentPriority.LOCATION: 0.1,
                AssignmentPriority.AVAILABILITY: 0.6,
                AssignmentPriority.EXPERTISE: 0.2,
                AssignmentPriority.RATING: 0.05,
                AssignmentPriority.WORKLOAD: 0.05
            }
        )
    
    @staticmethod
    def get_quality_priority_config() -> AssignmentConfiguration:
        """Get configuration prioritizing employee quality."""
        return AssignmentConfiguration(
            strategy=AssignmentStrategy.BEST_FIT,
            priority_weights={
                AssignmentPriority.LOCATION: 0.2,
                AssignmentPriority.AVAILABILITY: 0.2,
                AssignmentPriority.EXPERTISE: 0.25,
                AssignmentPriority.RATING: 0.25,
                AssignmentPriority.WORKLOAD: 0.1
            }
        )