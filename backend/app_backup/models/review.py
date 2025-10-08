"""
Review model for service reviews and ratings.
"""

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Review(Base):
    """
    Review model for customer service reviews.
    
    Customers can leave reviews and ratings for services they have booked.
    Reviews can include photos and are subject to admin approval.
    """
    
    __tablename__ = "reviews"
    
    # Reference fields
    service_id: Mapped[UUID] = mapped_column(
        ForeignKey("services.id"),
        nullable=False,
        index=True
    )
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    
    booking_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("bookings.id"),
        nullable=True,
        index=True
    )
    
    # Review content
    rating: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True  # For rating aggregations
    )
    
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )
    
    comment: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    # Optional photos
    photos: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    # Review status
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )
    
    is_approved: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )
    
    # Admin moderation
    admin_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    approved_by: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )
    
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Helpfulness tracking
    helpful_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    not_helpful_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="reviews",
        lazy="select"
    )
    
    service: Mapped["Service"] = relationship(
        "Service",
        back_populates="reviews",
        lazy="select"
    )
    
    booking: Mapped[Optional["Booking"]] = relationship(
        "Booking",
        back_populates="reviews",
        lazy="select"
    )
    
    approved_by_admin: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[approved_by],
        lazy="select"
    )
    
    # Methods
    def approve(self, admin_id: UUID, admin_notes: Optional[str] = None) -> None:
        """
        Approve the review.
        
        Args:
            admin_id: ID of the admin approving the review
            admin_notes: Optional admin notes
        """
        self.is_approved = True
        self.approved_by = admin_id
        self.approved_at = datetime.utcnow()
        if admin_notes:
            self.admin_notes = admin_notes
    
    def reject(self, admin_id: UUID, admin_notes: str) -> None:
        """
        Reject the review.
        
        Args:
            admin_id: ID of the admin rejecting the review
            admin_notes: Reason for rejection
        """
        self.is_approved = False
        self.approved_by = admin_id
        self.approved_at = datetime.utcnow()
        self.admin_notes = admin_notes
    
    def mark_helpful(self, helpful: bool = True) -> None:
        """
        Mark review as helpful or not helpful.
        
        Args:
            helpful: True if helpful, False if not helpful
        """
        if helpful:
            self.helpful_count += 1
        else:
            self.not_helpful_count += 1
    
    @property
    def helpfulness_score(self) -> float:
        """Calculate helpfulness score (0-1)."""
        total_votes = self.helpful_count + self.not_helpful_count
        if total_votes == 0:
            return 0.0
        return self.helpful_count / total_votes
    
    def dict_for_response(self, exclude: set = None, include_user: bool = True, include_admin_fields: bool = False) -> Dict[str, any]:
        """
        Get review data for API responses.
        
        Args:
            exclude: Fields to exclude
            include_user: Whether to include user information
            include_admin_fields: Whether to include admin-only fields
        """
        data = self.to_dict(exclude=exclude)
        
        result = {
            "id": data["id"],
            "serviceId": data["service_id"],
            "userId": data["user_id"],
            "bookingId": data["booking_id"],
            "rating": data["rating"],
            "title": data["title"],
            "comment": data["comment"],
            "photos": data["photos"],
            "isVerified": data["is_verified"],
            "isApproved": data["is_approved"],
            "helpfulCount": data["helpful_count"],
            "notHelpfulCount": data["not_helpful_count"],
            "helpfulnessScore": self.helpfulness_score,
            "createdAt": data["created_at"],
            "updatedAt": data["updated_at"],
        }
        
        # Include user information
        if include_user and self.user:
            result["user"] = {
                "id": str(self.user.id),
                "firstName": self.user.first_name,
                "lastName": self.user.last_name,
                "avatarUrl": self.user.avatar_url,
            }
        
        # Include admin fields for admin users
        if include_admin_fields:
            if data.get("admin_notes"):
                result["adminNotes"] = data["admin_notes"]
            if data.get("approved_by"):
                result["approvedBy"] = data["approved_by"]
            if data.get("approved_at"):
                result["approvedAt"] = data["approved_at"]
        
        return result


class ReviewPhoto(Base):
    """
    Review photo model for uploaded review images.
    """
    
    __tablename__ = "review_photos"
    
    review_id: Mapped[UUID] = mapped_column(
        ForeignKey("reviews.id"),
        nullable=False,
        index=True
    )
    
    url: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    
    alt_text: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True
    )
    
    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    # File metadata
    file_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )
    
    file_size: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )
    
    mime_type: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    # Relationships
    review: Mapped["Review"] = relationship(
        "Review",
        lazy="select"
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get review photo data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "reviewId": data["review_id"],
            "url": data["url"],
            "altText": data["alt_text"],
            "sortOrder": data["sort_order"],
            "fileName": data["file_name"],
            "fileSize": data["file_size"],
            "mimeType": data["mime_type"],
            "createdAt": data["created_at"],
        }


class ReviewHelpfulness(Base):
    """
    Review helpfulness tracking model.
    
    Tracks which users found reviews helpful or not helpful.
    """
    
    __tablename__ = "review_helpfulness"
    
    review_id: Mapped[UUID] = mapped_column(
        ForeignKey("reviews.id"),
        nullable=False,
        index=True
    )
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    
    is_helpful: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False
    )
    
    # Relationships
    review: Mapped["Review"] = relationship(
        "Review",
        lazy="select"
    )
    
    user: Mapped["User"] = relationship(
        "User",
        lazy="select"
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get helpfulness data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "reviewId": data["review_id"],
            "userId": data["user_id"],
            "isHelpful": data["is_helpful"],
            "createdAt": data["created_at"],
        }