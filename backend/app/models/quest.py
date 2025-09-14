import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .party import Party
    from .user import User


class QuestCategory(str, Enum):
    GAMING = "GAMING"
    PROFESSIONAL = "PROFESSIONAL"
    SOCIAL = "SOCIAL"
    LEARNING = "LEARNING"
    CREATIVE = "CREATIVE"
    FITNESS = "FITNESS"
    TRAVEL = "TRAVEL"


class QuestStatus(str, Enum):
    RECRUITING = "RECRUITING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class QuestVisibility(str, Enum):
    PUBLIC = "PUBLIC"
    UNLISTED = "UNLISTED"
    PRIVATE = "PRIVATE"


class LocationType(str, Enum):
    REMOTE = "REMOTE"
    IN_PERSON = "IN_PERSON"
    HYBRID = "HYBRID"


class CommitmentLevel(str, Enum):
    CASUAL = "CASUAL"
    MODERATE = "MODERATE"
    SERIOUS = "SERIOUS"
    PROFESSIONAL = "PROFESSIONAL"


class ApplicationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"
    EXPIRED = "EXPIRED"


# Shared properties
class QuestBase(SQLModel):
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20, max_length=2000)
    objective: str = Field(min_length=10, max_length=500)
    category: QuestCategory
    party_size_min: int = Field(ge=1, le=50)
    party_size_max: int = Field(ge=1, le=50)
    required_commitment: CommitmentLevel
    location_type: LocationType
    location_detail: str | None = Field(default=None, max_length=255)
    starts_at: datetime | None = Field(default=None)
    deadline: datetime | None = Field(default=None)
    estimated_duration: str | None = Field(default=None, max_length=100)
    auto_approve: bool = Field(default=False)
    visibility: QuestVisibility = Field(
        default=QuestVisibility.PUBLIC,
        sa_column_kwargs={"server_default": QuestVisibility.PUBLIC.value},
    )


# Properties to receive on quest creation
class QuestCreate(QuestBase):
    pass


# Properties to receive on quest update
class QuestUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=5, max_length=200)
    description: str | None = Field(default=None, min_length=20, max_length=2000)
    objective: str | None = Field(default=None, min_length=10, max_length=500)
    category: QuestCategory | None = Field(default=None)
    party_size_min: int | None = Field(default=None, ge=1, le=50)
    party_size_max: int | None = Field(default=None, ge=1, le=50)
    required_commitment: CommitmentLevel | None = Field(default=None)
    location_type: LocationType | None = Field(default=None)
    location_detail: str | None = Field(default=None, max_length=255)
    starts_at: datetime | None = Field(default=None)
    deadline: datetime | None = Field(default=None)
    estimated_duration: str | None = Field(default=None, max_length=100)
    auto_approve: bool | None = Field(default=None)
    visibility: QuestVisibility | None = Field(default=None)
    status: QuestStatus | None = Field(default=None)


# Database model
class Quest(QuestBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    creator_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    status: QuestStatus = Field(
        default=QuestStatus.RECRUITING,
        sa_column_kwargs={"server_default": QuestStatus.RECRUITING.value},
    )
    
    # Matching & Discovery fields
    embedding_vector: str | None = Field(default=None, max_length=10000)  # JSON string of vector
    search_keywords: str | None = Field(default=None, max_length=1000)
    
    # Analytics & Tracking
    view_count: int = Field(default=0, ge=0)
    application_count: int = Field(default=0, ge=0)
    current_party_size: int = Field(default=1, ge=1)  # Creator counts as 1
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    activated_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)

    # Relationships
    creator: "User" = Relationship(back_populates="created_quests")
    applications: list["QuestApplication"] = Relationship(
        back_populates="quest", cascade_delete=True
    )
    party: Optional["Party"] = Relationship(back_populates="quest", cascade_delete=True)


# Quest Application model
class QuestApplicationBase(SQLModel):
    message: str = Field(max_length=1000)
    proposed_role: str | None = Field(default=None, max_length=100)


class QuestApplicationCreate(QuestApplicationBase):
    pass


class QuestApplicationUpdate(SQLModel):
    message: str | None = Field(default=None, max_length=1000)
    proposed_role: str | None = Field(default=None, max_length=100)
    status: ApplicationStatus | None = Field(default=None)
    reviewer_feedback: str | None = Field(default=None, max_length=500)


class QuestApplication(QuestApplicationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False)
    applicant_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    status: ApplicationStatus = Field(
        default=ApplicationStatus.PENDING,
        sa_column_kwargs={"server_default": ApplicationStatus.PENDING.value},
    )
    applied_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: datetime | None = Field(default=None)
    reviewer_feedback: str | None = Field(default=None, max_length=500)

    # Relationships
    quest: Quest = Relationship(back_populates="applications")
    applicant: "User" = Relationship(back_populates="applications")


# Properties to return via API
class QuestPublic(QuestBase):
    id: uuid.UUID
    creator_id: uuid.UUID
    status: QuestStatus
    created_at: datetime


class QuestDetail(QuestPublic):
    creator: "User" = Field(exclude={"hashed_password"})
    applications_count: int = Field(default=0)
    party: Optional["Party"] = Field(default=None)


class QuestsPublic(SQLModel):
    data: list[QuestPublic]
    count: int


class QuestApplicationPublic(QuestApplicationBase):
    id: uuid.UUID
    quest_id: uuid.UUID
    applicant_id: uuid.UUID
    status: ApplicationStatus
    applied_at: datetime
    reviewed_at: datetime | None
    reviewer_feedback: str | None


class QuestApplicationDetail(QuestApplicationPublic):
    quest: QuestPublic
    applicant: "User" = Field(exclude={"hashed_password"})


class QuestApplicationsPublic(SQLModel):
    data: list[QuestApplicationPublic]
    count: int
