"""
Base schemas for common API response patterns.
"""

from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

DataType = TypeVar("DataType")


class BaseResponse(BaseModel, Generic[DataType]):
    """
    Base response schema for all API responses.
    
    Provides consistent response structure across the application
    with success status, message, and data payload.
    """
    
    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[DataType] = Field(default=None, description="Response data payload")
    
    class Config:
        """Pydantic configuration."""
        
        # Allow arbitrary types for generic data
        arbitrary_types_allowed = True
        # Use enum values in responses
        use_enum_values = True
        # Validate assignment on update
        validate_assignment = True


class PaginationMeta(BaseModel):
    """
    Pagination metadata for paginated responses.
    """
    
    page: int = Field(..., ge=1, description="Current page number")
    limit: int = Field(..., ge=1, le=100, description="Items per page")
    total: int = Field(..., ge=0, description="Total number of items")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_prev: bool = Field(..., description="Whether there are previous pages")
    
    @classmethod
    def create(cls, page: int, limit: int, total: int) -> "PaginationMeta":
        """
        Create pagination metadata from parameters.
        
        Args:
            page: Current page number
            limit: Items per page
            total: Total number of items
            
        Returns:
            PaginationMeta instance
        """
        total_pages = (total + limit - 1) // limit if total > 0 else 0
        
        return cls(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
        )


class PaginatedResponse(BaseModel, Generic[DataType]):
    """
    Paginated response schema for list endpoints.
    
    Provides consistent pagination structure with metadata
    and data array.
    """
    
    success: bool = Field(default=True, description="Whether the request was successful")
    message: str = Field(default="Data retrieved successfully", description="Response message")
    data: List[DataType] = Field(..., description="Array of response data")
    pagination: PaginationMeta = Field(..., description="Pagination metadata")
    
    class Config:
        """Pydantic configuration."""
        
        arbitrary_types_allowed = True
        use_enum_values = True
        validate_assignment = True


class ErrorDetail(BaseModel):
    """
    Error detail schema for validation errors.
    """
    
    field: Optional[str] = Field(default=None, description="Field that caused the error")
    message: str = Field(..., description="Error message")
    code: Optional[str] = Field(default=None, description="Error code")


class ErrorResponse(BaseModel):
    """
    Error response schema for API errors.
    
    Provides consistent error structure with details
    for debugging and user feedback.
    """
    
    success: bool = Field(default=False, description="Whether the request was successful")
    message: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(default=None, description="Specific error code")
    details: Optional[List[ErrorDetail]] = Field(default=None, description="Detailed error information")
    request_id: Optional[str] = Field(default=None, description="Unique request identifier")
    timestamp: Optional[str] = Field(default=None, description="Error timestamp")
    
    class Config:
        """Pydantic configuration."""
        
        use_enum_values = True
        validate_assignment = True


class SuccessResponse(BaseResponse[None]):
    """
    Success response schema for operations without data payload.
    """
    
    def __init__(self, message: str = "Operation completed successfully", **kwargs):
        super().__init__(success=True, message=message, data=None, **kwargs)


class IDResponse(BaseModel):
    """
    Response schema for operations that return an ID.
    """
    
    id: str = Field(..., description="Created/updated resource ID")


class BulkOperationResponse(BaseModel):
    """
    Response schema for bulk operations.
    """
    
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Operation message")
    total_processed: int = Field(..., ge=0, description="Total items processed")
    successful: int = Field(..., ge=0, description="Successfully processed items")
    failed: int = Field(..., ge=0, description="Failed items")
    errors: Optional[List[ErrorDetail]] = Field(default=None, description="Error details for failed items")


class HealthCheckResponse(BaseModel):
    """
    Health check response schema.
    """
    
    status: str = Field(..., description="Service status")
    timestamp: str = Field(..., description="Check timestamp") 
    version: str = Field(..., description="API version")
    database: Dict[str, Any] = Field(..., description="Database health status")
    dependencies: Optional[Dict[str, Any]] = Field(default=None, description="External dependencies status")


class FilterParams(BaseModel):
    """
    Base filter parameters for list endpoints.
    """
    
    page: int = Field(default=1, ge=1, description="Page number")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(default=None, description="Field to sort by")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")
    search: Optional[str] = Field(default=None, min_length=1, description="Search query")


class DateRangeFilter(BaseModel):
    """
    Date range filter for filtering by date ranges.
    """
    
    start_date: Optional[str] = Field(
        default=None, 
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Start date in YYYY-MM-DD format"
    )
    end_date: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}-\d{2}$", 
        description="End date in YYYY-MM-DD format"
    )