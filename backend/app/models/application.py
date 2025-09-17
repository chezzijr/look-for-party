import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .quest import Quest
    from .user import User


class ApplicationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"
    EXPIRED = "EXPIRED"


# Shared properties
class QuestApplicationBase(SQLModel):
    message: str = Field(max_length=1000)
    proposed_role: str | None = Field(default=None, max_length=100)
    relevant_skills: str | None = Field(default=None, max_length=500)


class QuestApplicationCreate(QuestApplicationBase):
    pass


class QuestApplicationUpdate(SQLModel):
    message: str | None = Field(default=None, max_length=1000)
    proposed_role: str | None = Field(default=None, max_length=100)
    relevant_skills: str | None = Field(default=None, max_length=500)
    status: ApplicationStatus | None = Field(default=None)
    reviewer_feedback: str | None = Field(default=None, max_length=500)


# Database model
class QuestApplication(QuestApplicationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False)
    applicant_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    status: ApplicationStatus = Field(
        default=ApplicationStatus.PENDING,
        sa_column_kwargs={"server_default": ApplicationStatus.PENDING.value},
    )

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    applied_at: datetime = Field(
        default_factory=datetime.utcnow
    )  # Keep for backward compatibility
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: datetime | None = Field(default=None)

    # Review feedback
    reviewer_feedback: str | None = Field(default=None, max_length=500)

    # Relationships
    quest: "Quest" = Relationship(back_populates="applications")
    applicant: "User" = Relationship(back_populates="applications")


# Properties to return via API
class QuestApplicationPublic(QuestApplicationBase):
    id: uuid.UUID
    quest_id: uuid.UUID
    applicant_id: uuid.UUID
    status: ApplicationStatus
    created_at: datetime
    applied_at: datetime
    updated_at: datetime
    reviewed_at: datetime | None
    reviewer_feedback: str | None


class QuestApplicationDetail(QuestApplicationPublic):
    quest: "Quest" = Field(exclude={"applications"})
    applicant: "User" = Field(exclude={"hashed_password"})


class QuestApplicationsPublic(SQLModel):
    data: list[QuestApplicationPublic]
    count: int
