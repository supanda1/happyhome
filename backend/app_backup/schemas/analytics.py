"""
Analytics-related schemas for detailed revenue breakdown and exports.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class RevenueBySubcategory(BaseModel):
    """
    Schema for subcategory revenue breakdown.
    """
    
    name: str = Field(..., description="Subcategory name")
    subcategory_id: str = Field(..., description="Subcategory ID", alias="subcategoryId")
    revenue: float = Field(..., description="Revenue amount")
    orders: int = Field(..., description="Number of orders")
    growth: float = Field(..., description="Growth percentage")
    
    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "name": "Bath Fittings",
                "subcategoryId": "sub-1",
                "revenue": 18000.0,
                "orders": 65,
                "growth": 20.5
            }
        }


class RevenueByCategory(BaseModel):
    """
    Schema for category revenue breakdown with subcategories.
    """
    
    category: str = Field(..., description="Category name")
    category_id: str = Field(..., description="Category ID", alias="categoryId")
    total_revenue: float = Field(..., description="Total revenue", alias="totalRevenue")
    total_orders: int = Field(..., description="Total orders", alias="totalOrders")
    growth: float = Field(..., description="Growth percentage")
    subcategories: List[RevenueBySubcategory] = Field(..., description="Subcategory breakdown")
    
    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "category": "Plumbing",
                "categoryId": "cat-1",
                "totalRevenue": 65000.0,
                "totalOrders": 280,
                "growth": 15.2,
                "subcategories": []
            }
        }


class TimeSeriesPoint(BaseModel):
    """
    Schema for time series data points.
    """
    
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    revenue: float = Field(..., description="Revenue for the date")
    orders: int = Field(..., description="Number of orders")
    
    class Config:
        schema_extra = {
            "example": {
                "date": "2024-01",
                "revenue": 235000.0,
                "orders": 950
            }
        }


class AnalyticsOverview(BaseModel):
    """
    Schema for complete analytics overview.
    """
    
    total_revenue: float = Field(..., description="Total revenue", alias="totalRevenue")
    total_orders: int = Field(..., description="Total orders", alias="totalOrders")
    avg_order_value: int = Field(..., description="Average order value", alias="avgOrderValue")
    monthly_growth: float = Field(..., description="Monthly growth percentage", alias="monthlyGrowth")
    top_categories: List[RevenueByCategory] = Field(..., description="Revenue by categories", alias="topCategories")
    time_series_data: List[TimeSeriesPoint] = Field(..., description="Time series data", alias="timeSeriesData")
    
    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "totalRevenue": 285000.0,
                "totalOrders": 1250,
                "avgOrderValue": 228,
                "monthlyGrowth": 12.5,
                "topCategories": [],
                "timeSeriesData": []
            }
        }


TimePeriod = Literal["daily", "weekly", "monthly", "yearly"]


class AnalyticsFilters(BaseModel):
    """
    Schema for analytics filtering parameters.
    """
    
    period: TimePeriod = Field(default="monthly", description="Time period for analytics")
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
    
    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "period": "monthly",
                "startDate": "2024-01-01",
                "endDate": "2024-12-31",
                "categoryId": "cat-1"
            }
        }


class ExportFormat(BaseModel):
    """
    Schema for export format specification.
    """
    
    format: Literal["csv", "excel"] = Field(..., description="Export format")
    period: TimePeriod = Field(default="monthly", description="Time period for export")
    
    class Config:
        schema_extra = {
            "example": {
                "format": "csv",
                "period": "monthly"
            }
        }