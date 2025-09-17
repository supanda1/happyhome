"""
Dashboard routes for admin analytics and statistics.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import and_, desc, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.dependencies import get_current_admin_user
from ..core.logging import get_logger
from ..database.connection import get_db_session
from ..models.booking import Booking, BookingStatus, PaymentStatus
from ..models.service import Service, ServiceCategory
from ..models.user import User, UserRole
from ..models.review import Review
from ..models.coupon import Coupon, CouponUsage
from ..schemas.base import BaseResponse
from ..schemas.dashboard import (
    DashboardStatsResponse,
    DateRangeStats,
    DashboardFilters,
    BookingStats,
    RevenueStats,
    CustomerStats,
    RecentBooking,
    TopService,
    MonthlyRevenue,
    ServiceCategoryStats,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/dashboard")


@router.get("/stats", response_model=BaseResponse[DashboardStatsResponse])
async def get_dashboard_stats(
    filters: DashboardFilters = Depends(),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get comprehensive dashboard statistics (Admin only).
    
    Args:
        filters: Optional date range and category filters
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing complete dashboard statistics
    """
    logger.info("Dashboard stats request", admin_id=str(current_user.id))
    
    try:
        # Parse date filters if provided
        start_date = None
        end_date = None
        if filters.start_date:
            start_date = datetime.strptime(filters.start_date, "%Y-%m-%d")
        if filters.end_date:
            end_date = datetime.strptime(f"{filters.end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
        
        # Base query filters
        booking_query_filters = []
        if start_date:
            booking_query_filters.append(Booking.created_at >= start_date)
        if end_date:
            booking_query_filters.append(Booking.created_at <= end_date)
        if filters.service_id:
            booking_query_filters.append(Booking.service_id == UUID(filters.service_id))
        
        # === OVERVIEW STATS ===
        
        # Total bookings
        total_bookings_query = db.query(Booking)
        if booking_query_filters:
            total_bookings_query = total_bookings_query.filter(and_(*booking_query_filters))
        total_bookings = await db.scalar(func.count().select().select_from(total_bookings_query.subquery())) or 0
        
        # Total revenue
        revenue_query = db.query(Booking).filter(Booking.payment_status == PaymentStatus.PAID)
        if booking_query_filters:
            revenue_query = revenue_query.filter(and_(*booking_query_filters))
        total_revenue = await db.scalar(func.sum(Booking.final_amount).select().select_from(revenue_query.subquery())) or 0.0
        
        # Total services
        service_query = db.query(Service).filter(Service.is_active == True)
        if filters.category_id:
            service_query = service_query.filter(Service.category_id == UUID(filters.category_id))
        total_services = await db.scalar(func.count().select().select_from(service_query.subquery())) or 0
        
        # Total customers
        customer_query = db.query(User).filter(User.role == UserRole.CUSTOMER)
        if start_date:
            customer_query = customer_query.filter(User.created_at >= start_date)
        if end_date:
            customer_query = customer_query.filter(User.created_at <= end_date)
        total_customers = await db.scalar(func.count().select().select_from(customer_query.subquery())) or 0
        
        # === BOOKING STATS ===
        
        booking_stats_query = db.query(Booking)
        if booking_query_filters:
            booking_stats_query = booking_stats_query.filter(and_(*booking_query_filters))
        
        # Status counts
        pending_bookings = await db.scalar(
            func.count(Booking.id).filter(Booking.status == BookingStatus.PENDING)
            .select().select_from(booking_stats_query.subquery())
        ) or 0
        
        confirmed_bookings = await db.scalar(
            func.count(Booking.id).filter(Booking.status == BookingStatus.CONFIRMED)
            .select().select_from(booking_stats_query.subquery())
        ) or 0
        
        completed_bookings = await db.scalar(
            func.count(Booking.id).filter(Booking.status == BookingStatus.COMPLETED)
            .select().select_from(booking_stats_query.subquery())
        ) or 0
        
        cancelled_bookings = await db.scalar(
            func.count(Booking.id).filter(Booking.status == BookingStatus.CANCELLED)
            .select().select_from(booking_stats_query.subquery())
        ) or 0
        
        # Calculate rates
        completion_rate = (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0.0
        cancellation_rate = (cancelled_bookings / total_bookings * 100) if total_bookings > 0 else 0.0
        
        booking_stats = BookingStats(
            totalBookings=total_bookings,
            pendingBookings=pending_bookings,
            confirmedBookings=confirmed_bookings,
            completedBookings=completed_bookings,
            cancelledBookings=cancelled_bookings,
            completionRate=round(completion_rate, 1),
            cancellationRate=round(cancellation_rate, 1)
        )
        
        # === REVENUE STATS ===
        
        # Current month revenue
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_revenue = await db.scalar(
            func.sum(Booking.final_amount).filter(
                and_(
                    Booking.payment_status == PaymentStatus.PAID,
                    Booking.created_at >= current_month_start
                )
            )
        ) or 0.0
        
        # Previous month revenue
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        previous_month_end = current_month_start - timedelta(seconds=1)
        previous_month_revenue = await db.scalar(
            func.sum(Booking.final_amount).filter(
                and_(
                    Booking.payment_status == PaymentStatus.PAID,
                    Booking.created_at >= previous_month_start,
                    Booking.created_at <= previous_month_end
                )
            )
        ) or 0.0
        
        # Revenue growth
        revenue_growth = 0.0
        if previous_month_revenue > 0:
            revenue_growth = ((current_month_revenue - previous_month_revenue) / previous_month_revenue) * 100
        
        # Average booking value
        paid_bookings_count = await db.scalar(
            func.count(Booking.id).filter(Booking.payment_status == PaymentStatus.PAID)
        ) or 0
        average_booking_value = (total_revenue / paid_bookings_count) if paid_bookings_count > 0 else 0.0
        
        # Revenue by category (simplified)
        revenue_by_category = []
        
        revenue_stats = RevenueStats(
            totalRevenue=total_revenue,
            monthlyRevenue=current_month_revenue,
            previousMonthRevenue=previous_month_revenue,
            revenueGrowth=round(revenue_growth, 1),
            averageBookingValue=round(average_booking_value, 2),
            revenueByCategory=revenue_by_category
        )
        
        # === CUSTOMER STATS ===
        
        # New customers this month
        new_customers_this_month = await db.scalar(
            func.count(User.id).filter(
                and_(
                    User.role == UserRole.CUSTOMER,
                    User.created_at >= current_month_start
                )
            )
        ) or 0
        
        # Returning customers (users with more than 1 booking)
        returning_customers_query = text("""
            SELECT COUNT(DISTINCT u.id)
            FROM users u
            WHERE u.role = 'customer'
            AND (
                SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id
            ) > 1
        """)
        returning_customers = await db.scalar(returning_customers_query) or 0
        
        # Top customers (simplified)
        top_customers = []
        
        customer_stats = CustomerStats(
            totalCustomers=total_customers,
            newCustomersThisMonth=new_customers_this_month,
            returningCustomers=returning_customers,
            topCustomers=top_customers
        )
        
        # === RECENT BOOKINGS ===
        
        recent_bookings_data = await db.scalars(
            db.query(Booking)
            .options(selectinload(Booking.service), selectinload(Booking.user))
            .order_by(desc(Booking.created_at))
            .limit(10)
        )
        
        recent_bookings = []
        for booking in recent_bookings_data:
            customer_name = f"{booking.user.first_name} {booking.user.last_name}" if booking.user else "Unknown"
            service_name = booking.service.name if booking.service else "Unknown Service"
            
            recent_bookings.append(RecentBooking(
                id=str(booking.id),
                serviceName=service_name,
                customerName=customer_name,
                amount=booking.final_amount,
                status=booking.status.value,
                scheduledDate=booking.scheduled_date.isoformat(),
                createdAt=booking.created_at.isoformat()
            ))
        
        # === TOP SERVICES ===
        
        # Get services with most bookings
        top_services_data = await db.execute(
            text("""
                SELECT 
                    s.id,
                    s.name,
                    COUNT(b.id) as booking_count,
                    COALESCE(SUM(b.final_amount), 0) as revenue,
                    COALESCE(AVG(r.rating), 0) as average_rating
                FROM services s
                LEFT JOIN bookings b ON s.id = b.service_id
                LEFT JOIN reviews r ON s.id = r.service_id AND r.is_approved = true
                WHERE s.is_active = true
                GROUP BY s.id, s.name
                ORDER BY booking_count DESC
                LIMIT 10
            """)
        )
        
        top_services = []
        for row in top_services_data:
            top_services.append(TopService(
                serviceId=str(row.id),
                serviceName=row.name,
                bookingCount=row.booking_count,
                revenue=float(row.revenue),
                averageRating=round(float(row.average_rating), 1)
            ))
        
        # === MONTHLY REVENUE ===
        
        # Get last 12 months revenue
        monthly_revenue_data = await db.execute(
            text("""
                SELECT 
                    DATE_TRUNC('month', created_at) as month,
                    SUM(final_amount) as revenue
                FROM bookings
                WHERE payment_status = 'paid'
                    AND created_at >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month
            """)
        )
        
        monthly_revenue = []
        for row in monthly_revenue_data:
            month_name = row.month.strftime("%b %Y")
            monthly_revenue.append(MonthlyRevenue(
                month=month_name,
                revenue=float(row.revenue)
            ))
        
        # === CATEGORY STATS ===
        
        category_stats_data = await db.execute(
            text("""
                SELECT 
                    sc.id,
                    sc.name,
                    COUNT(DISTINCT s.id) as service_count,
                    COUNT(b.id) as booking_count,
                    COALESCE(SUM(b.final_amount), 0) as revenue,
                    COALESCE(AVG(r.rating), 0) as average_rating
                FROM service_categories sc
                LEFT JOIN services s ON sc.id = s.category_id AND s.is_active = true
                LEFT JOIN bookings b ON s.id = b.service_id
                LEFT JOIN reviews r ON s.id = r.service_id AND r.is_approved = true
                WHERE sc.is_active = true
                GROUP BY sc.id, sc.name
                ORDER BY booking_count DESC
            """)
        )
        
        category_stats = []
        for row in category_stats_data:
            category_stats.append(ServiceCategoryStats(
                categoryId=str(row.id),
                categoryName=row.name,
                serviceCount=row.service_count,
                bookingCount=row.booking_count,
                revenue=float(row.revenue),
                averageRating=round(float(row.average_rating), 1)
            ))
        
        # === BUILD RESPONSE ===
        
        dashboard_stats = DashboardStatsResponse(
            totalBookings=total_bookings,
            totalRevenue=total_revenue,
            totalServices=total_services,
            totalCustomers=total_customers,
            bookingStats=booking_stats,
            revenueStats=revenue_stats,
            customerStats=customer_stats,
            recentBookings=recent_bookings,
            topServices=top_services,
            monthlyRevenue=monthly_revenue,
            categoryStats=category_stats
        )
        
        return BaseResponse(
            success=True,
            message="Dashboard statistics retrieved successfully",
            data=dashboard_stats
        )
        
    except Exception as e:
        logger.error("Dashboard stats failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard statistics"
        )


@router.get("/date-range-stats", response_model=BaseResponse[DateRangeStats])
async def get_date_range_stats(
    start_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date (YYYY-MM-DD)", alias="startDate"),
    end_date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date (YYYY-MM-DD)", alias="endDate"),
    category_id: Optional[str] = Query(None, description="Optional category filter", alias="categoryId"),
    service_id: Optional[str] = Query(None, description="Optional service filter", alias="serviceId"),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get statistics for a specific date range (Admin only).
    
    Args:
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        category_id: Optional category ID filter
        service_id: Optional service ID filter
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing date range statistics
    """
    logger.info("Date range stats request", admin_id=str(current_user.id), start_date=start_date, end_date=end_date)
    
    try:
        # Parse dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
        
        # Validate date range
        if start_dt > end_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date must be before end date"
            )
        
        # Build filters
        booking_filters = [
            Booking.created_at >= start_dt,
            Booking.created_at <= end_dt
        ]
        
        if category_id:
            # Need to join with services to filter by category
            booking_filters.append(Service.category_id == UUID(category_id))
        
        if service_id:
            booking_filters.append(Booking.service_id == UUID(service_id))
        
        # Get bookings in date range
        booking_query = db.query(Booking)
        if category_id:
            booking_query = booking_query.join(Service)
        booking_query = booking_query.filter(and_(*booking_filters))
        
        total_bookings = await db.scalar(func.count().select().select_from(booking_query.subquery())) or 0
        
        # Get revenue (paid bookings only)
        revenue_query = booking_query.filter(Booking.payment_status == PaymentStatus.PAID)
        total_revenue = await db.scalar(func.sum(Booking.final_amount).select().select_from(revenue_query.subquery())) or 0.0
        
        # Get new customers in date range
        customer_filters = [
            User.role == UserRole.CUSTOMER,
            User.created_at >= start_dt,
            User.created_at <= end_dt
        ]
        new_customers = await db.scalar(
            func.count(User.id).filter(and_(*customer_filters))
        ) or 0
        
        # Get completion rate
        completed_bookings = await db.scalar(
            func.count(Booking.id).select().select_from(
                booking_query.filter(Booking.status == BookingStatus.COMPLETED).subquery()
            )
        ) or 0
        completion_rate = (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0.0
        
        # Get average rating for the period
        rating_filters = [
            Review.is_approved == True,
            Review.created_at >= start_dt,
            Review.created_at <= end_dt
        ]
        
        if service_id:
            rating_filters.append(Review.service_id == UUID(service_id))
        elif category_id:
            # Need to join with services to filter by category
            rating_query = db.query(Review).join(Service).filter(and_(*rating_filters, Service.category_id == UUID(category_id)))
            average_rating = await db.scalar(func.avg(Review.rating).select().select_from(rating_query.subquery())) or 0.0
        else:
            average_rating = await db.scalar(func.avg(Review.rating).filter(and_(*rating_filters))) or 0.0
        
        if not category_id and not service_id:
            average_rating = await db.scalar(func.avg(Review.rating).filter(and_(*rating_filters))) or 0.0
        
        stats = DateRangeStats(
            startDate=start_date,
            endDate=end_date,
            totalBookings=total_bookings,
            totalRevenue=total_revenue,
            newCustomers=new_customers,
            completionRate=round(completion_rate, 1),
            averageRating=round(average_rating, 1)
        )
        
        return BaseResponse(
            success=True,
            message="Date range statistics retrieved successfully",
            data=stats
        )
        
    except ValueError as e:
        logger.warning("Date range stats validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Date range stats failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve date range statistics"
        )


@router.get("/export-data")
async def export_dashboard_data(
    format: str = Query("csv", regex="^(csv|excel|pdf)$", description="Export format"),
    start_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date filter", alias="startDate"),
    end_date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date filter", alias="endDate"),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Export dashboard data in various formats (Admin only).
    
    Args:
        format: Export format (csv, excel, pdf)
        start_date: Optional start date filter
        end_date: Optional end date filter
        current_user: Current admin user
        db: Database session
        
    Returns:
        File download response
        
    Note:
        This is a placeholder implementation. In production, you would:
        1. Generate the actual export files using libraries like pandas, openpyxl, reportlab
        2. Return proper file responses with appropriate headers
        3. Implement proper data formatting and styling
    """
    logger.info("Dashboard data export", admin_id=str(current_user.id), format=format)
    
    try:
        # This is a simplified response - in production you would generate actual files
        export_info = {
            "message": f"Dashboard data export in {format} format would be generated here",
            "format": format,
            "dateRange": {
                "startDate": start_date,
                "endDate": end_date
            },
            "note": "This is a placeholder implementation. In production, this would generate and return actual files."
        }
        
        return BaseResponse(
            success=True,
            message=f"Export data prepared for {format} format",
            data=export_info
        )
        
    except Exception as e:
        logger.error("Dashboard export failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export dashboard data"
        )


@router.get("/realtime-metrics")
async def get_realtime_metrics(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get real-time metrics for dashboard (Admin only).
    
    Args:
        current_user: Current admin user
        db: Database session
        
    Returns:
        Real-time metrics data
    """
    logger.debug("Real-time metrics request", admin_id=str(current_user.id))
    
    try:
        # Get metrics for the last 24 hours
        last_24h = datetime.utcnow() - timedelta(hours=24)
        
        # Recent bookings count
        recent_bookings = await db.scalar(
            func.count(Booking.id).filter(Booking.created_at >= last_24h)
        ) or 0
        
        # Recent revenue
        recent_revenue = await db.scalar(
            func.sum(Booking.final_amount).filter(
                and_(
                    Booking.created_at >= last_24h,
                    Booking.payment_status == PaymentStatus.PAID
                )
            )
        ) or 0.0
        
        # Pending bookings
        pending_bookings = await db.scalar(
            func.count(Booking.id).filter(Booking.status == BookingStatus.PENDING)
        ) or 0
        
        # Active users (users who logged in in the last 24h)
        # This would require tracking last_login timestamps
        active_users = 0  # Placeholder
        
        # Pending reviews
        pending_reviews = await db.scalar(
            func.count(Review.id).filter(Review.is_approved == False)
        ) or 0
        
        # System status
        system_status = {
            "database": "healthy",
            "redis": "healthy",  # Would check actual Redis status
            "api": "operational",
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
        metrics = {
            "recentBookings24h": recent_bookings,
            "recentRevenue24h": recent_revenue,
            "pendingBookings": pending_bookings,
            "activeUsers24h": active_users,
            "pendingReviews": pending_reviews,
            "systemStatus": system_status,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return BaseResponse(
            success=True,
            message="Real-time metrics retrieved successfully",
            data=metrics
        )
        
    except Exception as e:
        logger.error("Real-time metrics failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve real-time metrics"
        )


@router.get("/performance-metrics")
async def get_performance_metrics(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get system performance metrics (Admin only).
    
    Args:
        current_user: Current admin user
        db: Database session
        
    Returns:
        System performance metrics
    """
    logger.debug("Performance metrics request", admin_id=str(current_user.id))
    
    try:
        # Database performance metrics
        db_metrics = {
            "totalConnections": 0,  # Would get from connection pool
            "activeConnections": 0,
            "queryPerformance": {
                "averageResponseTime": 0.0,
                "slowQueries": 0
            }
        }
        
        # API performance metrics
        api_metrics = {
            "totalRequests24h": 0,  # Would track in middleware
            "averageResponseTime": 0.0,
            "errorRate": 0.0,
            "topEndpoints": []
        }
        
        # Business performance metrics  
        business_metrics = {
            "bookingConversionRate": 0.0,
            "customerSatisfactionScore": 0.0,
            "serviceUtilizationRate": 0.0,
            "revenuePerCustomer": 0.0
        }
        
        performance_data = {
            "database": db_metrics,
            "api": api_metrics,
            "business": business_metrics,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return BaseResponse(
            success=True,
            message="Performance metrics retrieved successfully",
            data=performance_data
        )
        
    except Exception as e:
        logger.error("Performance metrics failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve performance metrics"
        )