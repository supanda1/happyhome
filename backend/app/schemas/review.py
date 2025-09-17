"""
Review-related schemas for service reviews and ratings.
"""

from typing import List, Optional

from pydantic import BaseModel, Field, validator

from .base import FilterParams


class ReviewCreate(BaseModel):
    """
    Schema for creating reviews.
    """
    
    service_id: str = Field(..., description="Service being reviewed", alias="serviceId")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    title: str = Field(..., min_length=1, max_length=200, description="Review title")
    comment: str = Field(..., min_length=1, max_length=2000, description="Review comment")
    photos: List[str] = Field(default_factory=list, description="Review photo URLs")
    
    @validator("title")
    def validate_title(cls, v):
        """Clean and validate review title."""
        return v.strip()
    
    @validator("comment")
    def validate_comment(cls, v):
        """Clean and validate review comment."""
        return v.strip()
    
    @validator("photos")
    def validate_photos(cls, v):
        """Validate photo URLs."""
        if len(v) > 5:
            raise ValueError("Maximum 5 photos allowed per review")
        return v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "serviceId": "507f1f77bcf86cd799439011",
                "rating": 5,
                "title": "Excellent service!",
                "comment": "The plumber was very professional and fixed the issue quickly. Highly recommended!",
                "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
            }
        }


class ReviewUpdate(BaseModel):
    """
    Schema for updating reviews.
    """
    
    rating: Optional[int] = Field(default=None, ge=1, le=5, description="Rating from 1 to 5 stars")
    title: Optional[str] = Field(default=None, min_length=1, max_length=200, description="Review title")
    comment: Optional[str] = Field(default=None, min_length=1, max_length=2000, description="Review comment")
    photos: Optional[List[str]] = Field(default=None, description="Review photo URLs")
    
    @validator("title")
    def validate_title(cls, v):
        """Clean and validate review title."""
        return v.strip() if v else v
    
    @validator("comment")
    def validate_comment(cls, v):
        """Clean and validate review comment."""
        return v.strip() if v else v
    
    @validator("photos")
    def validate_photos(cls, v):
        """Validate photo URLs."""
        if v and len(v) > 5:
            raise ValueError("Maximum 5 photos allowed per review")
        return v
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "rating": 4,
                "title": "Updated review title",
                "comment": "Updated review comment with more details...",
                "photos": ["https://example.com/new_photo.jpg"]
            }
        }


class ReviewApprovalRequest(BaseModel):
    """
    Schema for review approval/rejection by admin.
    """
    
    is_approved: bool = Field(..., description="Whether to approve or reject the review", alias="isApproved")
    admin_notes: Optional[str] = Field(default=None, max_length=500, description="Admin notes about the decision", alias="adminNotes")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "isApproved": True,
                "adminNotes": "Review meets quality standards and provides helpful feedback"
            }
        }


class ReviewResponse(BaseModel):
    """
    Schema for review responses.
    """
    
    id: str = Field(..., description="Review ID")
    service_id: str = Field(..., description="Service ID", alias="serviceId")
    user_id: str = Field(..., description="User ID", alias="userId")
    rating: int = Field(..., description="Rating from 1 to 5 stars")
    title: str = Field(..., description="Review title")
    comment: str = Field(..., description="Review comment")
    photos: List[str] = Field(..., description="Review photo URLs")
    is_verified: bool = Field(..., description="Whether review is from verified booking", alias="isVerified")
    is_approved: bool = Field(..., description="Whether review is approved", alias="isApproved")
    admin_notes: Optional[str] = Field(default=None, description="Admin notes", alias="adminNotes")
    approved_by: Optional[str] = Field(default=None, description="Admin who approved", alias="approvedBy")
    approved_at: Optional[str] = Field(default=None, description="Approval timestamp", alias="approvedAt")
    created_at: str = Field(..., description="Creation timestamp", alias="createdAt")
    updated_at: str = Field(..., description="Last update timestamp", alias="updatedAt")
    
    # Optional populated fields
    user: Optional[dict] = Field(default=None, description="User details")
    service: Optional[dict] = Field(default=None, description="Service details")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "serviceId": "507f1f77bcf86cd799439012",
                "userId": "507f1f77bcf86cd799439013",
                "rating": 5,
                "title": "Excellent service!",
                "comment": "The plumber was very professional and fixed the issue quickly.",
                "photos": ["https://example.com/photo1.jpg"],
                "isVerified": True,
                "isApproved": True,
                "createdAt": "2024-01-15T10:30:00Z",
                "updatedAt": "2024-01-15T10:30:00Z",
                "user": {
                    "firstName": "John",
                    "lastName": "Doe"
                }
            }
        }


class ReviewListResponse(ReviewResponse):
    """
    Schema for review list responses (lighter version).
    """
    
    class Config:
        """Pydantic configuration."""
        
        fields = {
            "admin_notes": {"exclude": True},
            "approved_by": {"exclude": True},
            "approved_at": {"exclude": True},
        }


class ReviewFilters(FilterParams):
    """
    Schema for review filtering parameters.
    """
    
    service_id: Optional[str] = Field(default=None, description="Filter by service ID", alias="serviceId")
    user_id: Optional[str] = Field(default=None, description="Filter by user ID", alias="userId")
    rating: Optional[int] = Field(default=None, ge=1, le=5, description="Filter by rating")
    min_rating: Optional[int] = Field(default=None, ge=1, le=5, description="Minimum rating filter", alias="minRating")
    is_approved: Optional[bool] = Field(default=None, description="Filter by approval status", alias="isApproved")
    is_verified: Optional[bool] = Field(default=None, description="Filter by verified status", alias="isVerified")
    has_photos: Optional[bool] = Field(default=None, description="Filter reviews with photos", alias="hasPhotos")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "page": 1,
                "limit": 20,
                "serviceId": "507f1f77bcf86cd799439012",
                "minRating": 4,
                "isApproved": True,
                "isVerified": True,
                "hasPhotos": False,
                "sort_by": "created_at",
                "sort_order": "desc"
            }
        }


class ReviewStatsResponse(BaseModel):
    """
    Schema for review statistics responses.
    """
    
    total_reviews: int = Field(..., description="Total number of reviews", alias="totalReviews")
    approved_reviews: int = Field(..., description="Number of approved reviews", alias="approvedReviews")
    pending_reviews: int = Field(..., description="Number of pending reviews", alias="pendingReviews")
    average_rating: float = Field(..., description="Average rating", alias="averageRating")
    rating_distribution: dict = Field(..., description="Rating distribution", alias="ratingDistribution")
    verified_reviews: int = Field(..., description="Number of verified reviews", alias="verifiedReviews")
    reviews_with_photos: int = Field(..., description="Reviews with photos", alias="reviewsWithPhotos")
    monthly_reviews: list = Field(..., description="Monthly review counts", alias="monthlyReviews")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "totalReviews": 150,
                "approvedReviews": 142,
                "pendingReviews": 8,
                "averageRating": 4.3,
                "ratingDistribution": {
                    "1": 2,
                    "2": 5,
                    "3": 18,
                    "4": 45,
                    "5": 72
                },
                "verifiedReviews": 135,
                "reviewsWithPhotos": 48,
                "monthlyReviews": [
                    {"month": "Jan", "count": 23},
                    {"month": "Feb", "count": 31}
                ]
            }
        }


class ServiceRatingStats(BaseModel):
    """
    Schema for service rating statistics.
    """
    
    service_id: str = Field(..., description="Service ID", alias="serviceId")
    average: float = Field(..., description="Average rating")
    total: int = Field(..., description="Total number of ratings")
    distribution: dict = Field(..., description="Rating distribution (1-5 stars)")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "serviceId": "507f1f77bcf86cd799439012",
                "average": 4.5,
                "total": 48,
                "distribution": {
                    "1": 0,
                    "2": 2,
                    "3": 5,
                    "4": 15,
                    "5": 26
                }
            }
        }


class ReviewBulkApprovalRequest(BaseModel):
    """
    Schema for bulk review approval/rejection.
    """
    
    review_ids: List[str] = Field(..., description="List of review IDs to process", alias="reviewIds")
    is_approved: bool = Field(..., description="Whether to approve or reject", alias="isApproved")
    admin_notes: Optional[str] = Field(default=None, max_length=500, description="Admin notes", alias="adminNotes")
    
    @validator("review_ids")
    def validate_review_ids(cls, v):
        """Validate review IDs list."""
        if not v:
            raise ValueError("At least one review ID is required")
        if len(v) > 100:
            raise ValueError("Maximum 100 reviews can be processed at once")
        return v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "reviewIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
                "isApproved": True,
                "adminNotes": "Bulk approval of quality reviews"
            }
        }