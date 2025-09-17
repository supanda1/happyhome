"""
Dashboard-related schemas for admin statistics and analytics.
"""

from typing import List, Optional

from pydantic import BaseModel, Field


class MonthlyRevenue(BaseModel):
    """
    Schema for monthly revenue data.
    """
    
    month: str = Field(..., description="Month name or date")
    revenue: float = Field(..., description="Revenue amount for the month")
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "month": "Jan",
                "revenue": 15000.0
            }
        }


class TopService(BaseModel):
    """
    Schema for top service data.
    """
    
    service_id: str = Field(..., description="Service ID", alias="serviceId")
    service_name: str = Field(..., description="Service name", alias="serviceName")
    booking_count: int = Field(..., description="Number of bookings", alias="bookingCount")
    revenue: float = Field(..., description="Revenue generated")
    average_rating: float = Field(..., description="Average rating", alias="averageRating")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "serviceId": "507f1f77bcf86cd799439011",
                "serviceName": "Emergency Plumbing Repair",
                "bookingCount": 45,
                "revenue": 6750.0,
                "averageRating": 4.5
            }
        }


class RecentBooking(BaseModel):
    """
    Schema for recent booking data.
    """
    
    id: str = Field(..., description="Booking ID")
    service_name: str = Field(..., description="Service name", alias="serviceName")
    customer_name: str = Field(..., description="Customer name", alias="customerName")
    amount: float = Field(..., description="Booking amount")
    status: str = Field(..., description="Booking status")
    scheduled_date: str = Field(..., description="Scheduled date", alias="scheduledDate")
    created_at: str = Field(..., description="Booking creation date", alias="createdAt")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "serviceName": "Emergency Plumbing Repair",
                "customerName": "John Doe",
                "amount": 150.0,
                "status": "confirmed",
                "scheduledDate": "2024-02-15T10:00:00Z",
                "createdAt": "2024-02-01T08:00:00Z"
            }
        }


class ServiceCategoryStats(BaseModel):
    """
    Schema for service category statistics.
    """
    
    category_id: str = Field(..., description="Category ID", alias="categoryId")
    category_name: str = Field(..., description="Category name", alias="categoryName")
    service_count: int = Field(..., description="Number of services", alias="serviceCount")
    booking_count: int = Field(..., description="Number of bookings", alias="bookingCount")
    revenue: float = Field(..., description="Revenue generated")
    average_rating: float = Field(..., description="Average rating", alias="averageRating")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "categoryId": "507f1f77bcf86cd799439011",
                "categoryName": "Plumbing",
                "serviceCount": 8,
                "bookingCount": 125,
                "revenue": 18750.0,
                "averageRating": 4.3
            }
        }


class CustomerStats(BaseModel):
    """
    Schema for customer statistics.
    """
    
    total_customers: int = Field(..., description="Total number of customers", alias="totalCustomers")
    new_customers_this_month: int = Field(..., description="New customers this month", alias="newCustomersThisMonth")
    returning_customers: int = Field(..., description="Returning customers", alias="returningCustomers")
    top_customers: List[dict] = Field(..., description="Top customers by bookings", alias="topCustomers")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "totalCustomers": 89,
                "newCustomersThisMonth": 12,
                "returningCustomers": 45,
                "topCustomers": [
                    {"customerId": "cust_001", "name": "John Doe", "bookings": 8, "totalSpent": 1200.0}
                ]
            }
        }


class BookingStats(BaseModel):
    """
    Schema for booking statistics.
    """
    
    total_bookings: int = Field(..., description="Total number of bookings", alias="totalBookings")
    pending_bookings: int = Field(..., description="Pending bookings", alias="pendingBookings")
    confirmed_bookings: int = Field(..., description="Confirmed bookings", alias="confirmedBookings")
    completed_bookings: int = Field(..., description="Completed bookings", alias="completedBookings")
    cancelled_bookings: int = Field(..., description="Cancelled bookings", alias="cancelledBookings")
    completion_rate: float = Field(..., description="Completion rate percentage", alias="completionRate")
    cancellation_rate: float = Field(..., description="Cancellation rate percentage", alias="cancellationRate")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "totalBookings": 156,
                "pendingBookings": 12,
                "confirmedBookings": 35,
                "completedBookings": 98,
                "cancelledBookings": 11,
                "completionRate": 85.7,
                "cancellationRate": 7.1
            }
        }


class RevenueStats(BaseModel):
    """
    Schema for revenue statistics.
    """
    
    total_revenue: float = Field(..., description="Total revenue", alias="totalRevenue")
    monthly_revenue: float = Field(..., description="Current month revenue", alias="monthlyRevenue")
    previous_month_revenue: float = Field(..., description="Previous month revenue", alias="previousMonthRevenue")
    revenue_growth: float = Field(..., description="Revenue growth percentage", alias="revenueGrowth")
    average_booking_value: float = Field(..., description="Average booking value", alias="averageBookingValue")
    revenue_by_category: List[dict] = Field(..., description="Revenue by category", alias="revenueByCategory")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "totalRevenue": 28500.0,
                "monthlyRevenue": 4200.0,
                "previousMonthRevenue": 3800.0,
                "revenueGrowth": 10.5,
                "averageBookingValue": 182.69,
                "revenueByCategory": [
                    {"categoryName": "Plumbing", "revenue": 12500.0},
                    {"categoryName": "Electrical", "revenue": 8200.0}
                ]
            }
        }


class DashboardStatsResponse(BaseModel):
    """
    Schema for complete dashboard statistics response.
    """
    
    # Overview stats
    total_bookings: int = Field(..., description="Total number of bookings", alias="totalBookings")
    total_revenue: float = Field(..., description="Total revenue", alias="totalRevenue")
    total_services: int = Field(..., description="Total number of services", alias="totalServices")
    total_customers: int = Field(..., description="Total number of customers", alias="totalCustomers")
    
    # Detailed stats
    booking_stats: BookingStats = Field(..., description="Booking statistics", alias="bookingStats")
    revenue_stats: RevenueStats = Field(..., description="Revenue statistics", alias="revenueStats")
    customer_stats: CustomerStats = Field(..., description="Customer statistics", alias="customerStats")
    
    # Lists and charts data
    recent_bookings: List[RecentBooking] = Field(..., description="Recent bookings", alias="recentBookings")
    top_services: List[TopService] = Field(..., description="Top performing services", alias="topServices")
    monthly_revenue: List[MonthlyRevenue] = Field(..., description="Monthly revenue data", alias="monthlyRevenue")
    category_stats: List[ServiceCategoryStats] = Field(..., description="Category statistics", alias="categoryStats")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "totalBookings": 156,
                "totalRevenue": 28500.0,
                "totalServices": 25,
                "totalCustomers": 89,
                "bookingStats": {
                    "totalBookings": 156,
                    "pendingBookings": 12,
                    "confirmedBookings": 35,
                    "completedBookings": 98,
                    "cancelledBookings": 11,
                    "completionRate": 85.7,
                    "cancellationRate": 7.1
                },
                "revenueStats": {
                    "totalRevenue": 28500.0,
                    "monthlyRevenue": 4200.0,
                    "previousMonthRevenue": 3800.0,
                    "revenueGrowth": 10.5,
                    "averageBookingValue": 182.69,
                    "revenueByCategory": []
                },
                "customerStats": {
                    "totalCustomers": 89,
                    "newCustomersThisMonth": 12,
                    "returningCustomers": 45,
                    "topCustomers": []
                },
                "recentBookings": [],
                "topServices": [],
                "monthlyRevenue": [
                    {"month": "Jan", "revenue": 15000.0},
                    {"month": "Feb", "revenue": 18500.0}
                ],
                "categoryStats": []
            }
        }


class DateRangeStats(BaseModel):
    """
    Schema for date range filtered statistics.
    """
    
    start_date: str = Field(..., description="Start date", alias="startDate")
    end_date: str = Field(..., description="End date", alias="endDate")
    total_bookings: int = Field(..., description="Bookings in date range", alias="totalBookings")
    total_revenue: float = Field(..., description="Revenue in date range", alias="totalRevenue")
    new_customers: int = Field(..., description="New customers in date range", alias="newCustomers")
    completion_rate: float = Field(..., description="Completion rate", alias="completionRate")
    average_rating: float = Field(..., description="Average rating", alias="averageRating")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "startDate": "2024-01-01",
                "endDate": "2024-01-31",
                "totalBookings": 45,
                "totalRevenue": 6750.0,
                "newCustomers": 12,
                "completionRate": 88.9,
                "averageRating": 4.3
            }
        }


class DashboardFilters(BaseModel):
    """
    Schema for dashboard filtering parameters.
    """
    
    start_date: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Start date filter (YYYY-MM-DD)",
        alias="startDate"
    )
    end_date: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="End date filter (YYYY-MM-DD)",
        alias="endDate"
    )
    category_id: Optional[str] = Field(
        default=None,
        description="Filter by category ID",
        alias="categoryId"
    )
    service_id: Optional[str] = Field(
        default=None,
        description="Filter by service ID",
        alias="serviceId"
    )
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "startDate": "2024-01-01",
                "endDate": "2024-01-31",
                "categoryId": "507f1f77bcf86cd799439011"
            }
        }