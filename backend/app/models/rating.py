import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

if TYPE_CHECKING:
    from .party import Party
    from .user import User


# Shared properties
class RatingBase(SQLModel):
    overall_rating: int = Field(ge=1, le=5, description="Overall rating (1-5 stars)")
    collaboration_rating: int = Field(ge=1, le=5, description="Collaboration skill rating (1-5 stars)")
    communication_rating: int = Field(ge=1, le=5, description="Communication skill rating (1-5 stars)")
    reliability_rating: int = Field(ge=1, le=5, description="Reliability rating (1-5 stars)")
    skill_rating: int = Field(ge=1, le=5, description="Technical/domain skill rating (1-5 stars)")
    review_text: str | None = Field(default=None, max_length=1000, description="Optional written review")
    would_collaborate_again: bool = Field(default=True, description="Would collaborate with this person again")


# Properties to receive on rating creation
class RatingCreate(RatingBase):
    party_id: uuid.UUID
    rated_user_id: uuid.UUID


# Properties to receive on rating update
class RatingUpdate(SQLModel):
    overall_rating: int | None = Field(default=None, ge=1, le=5)
    collaboration_rating: int | None = Field(default=None, ge=1, le=5)
    communication_rating: int | None = Field(default=None, ge=1, le=5)
    reliability_rating: int | None = Field(default=None, ge=1, le=5)
    skill_rating: int | None = Field(default=None, ge=1, le=5)
    review_text: str | None = Field(default=None, max_length=1000)
    would_collaborate_again: bool | None = Field(default=None)


# Database model
class Rating(RatingBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    party_id: uuid.UUID = Field(foreign_key="party.id", nullable=False)
    rater_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    rated_user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    party: "Party" = Relationship(back_populates="ratings")
    rater: "User" = Relationship(
        back_populates="given_ratings",
        sa_relationship_kwargs={"foreign_keys": "[Rating.rater_id]"}
    )
    rated_user: "User" = Relationship(
        back_populates="received_ratings",
        sa_relationship_kwargs={"foreign_keys": "[Rating.rated_user_id]"}
    )

    # Unique constraint: each user can rate another user only once per party
    __table_args__ = (UniqueConstraint("party_id", "rater_id", "rated_user_id"),)


# Properties to return via API
class RatingPublic(RatingBase):
    id: uuid.UUID
    party_id: uuid.UUID
    rater_id: uuid.UUID
    rated_user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RatingDetail(RatingPublic):
    # Note: We'll populate these relationships in the API layer instead of using forward references
    pass


class RatingsPublic(SQLModel):
    data: list[RatingPublic]
    count: int


# For statistics and reputation calculation
class UserRatingSummary(SQLModel):
    user_id: uuid.UUID
    total_ratings: int
    average_overall: float
    average_collaboration: float
    average_communication: float
    average_reliability: float
    average_skill: float
    positive_feedback_percentage: float  # Percentage of would_collaborate_again=True