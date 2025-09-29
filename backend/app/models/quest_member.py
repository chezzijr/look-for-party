import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

from app.models.quest import QuestPublic
from app.models.user import UserPublic

if TYPE_CHECKING:
    from .application import QuestApplication
    from .quest import Quest
    from .user import User


class QuestMemberRole(str, Enum):
    CREATOR = "CREATOR"  # Quest creator (always present)
    MEMBER = "MEMBER"  # Regular quest participant
    MODERATOR = "MODERATOR"  # Elevated permissions (for large quests)


class QuestMemberStatus(str, Enum):
    ACTIVE = "ACTIVE"  # Currently participating
    COMPLETED = "COMPLETED"  # Finished the quest
    LEFT = "LEFT"  # Left before completion
    REMOVED = "REMOVED"  # Removed by creator/moderator


class JoinMethod(str, Enum):
    APPLICATION = "APPLICATION"  # Joined via approved application
    AUTO_APPROVAL = "AUTO_APPROVAL"  # Auto-approved application
    INTERNAL_ASSIGNMENT = "INTERNAL_ASSIGNMENT"  # Assigned by party owner/moderator
    CREATOR = "CREATOR"  # Quest creator (automatic)


# Shared properties
class QuestMemberBase(SQLModel):
    role: QuestMemberRole = Field(
        default=QuestMemberRole.MEMBER,
        sa_column_kwargs={"server_default": QuestMemberRole.MEMBER.value},
    )
    status: QuestMemberStatus = Field(
        default=QuestMemberStatus.ACTIVE,
        sa_column_kwargs={"server_default": QuestMemberStatus.ACTIVE.value},
    )
    join_method: JoinMethod = Field(
        default=JoinMethod.APPLICATION,
        sa_column_kwargs={"server_default": JoinMethod.APPLICATION.value},
    )
    assignment_reason: str | None = Field(default=None, max_length=500)


# Properties to receive on quest member creation
class QuestMemberCreate(QuestMemberBase):
    quest_id: uuid.UUID
    user_id: uuid.UUID
    assigned_by_id: uuid.UUID | None = Field(default=None)
    source_application_id: uuid.UUID | None = Field(default=None)


# Properties to receive on quest member update
class QuestMemberUpdate(SQLModel):
    role: QuestMemberRole | None = Field(default=None)
    status: QuestMemberStatus | None = Field(default=None)
    assignment_reason: str | None = Field(default=None, max_length=500)


# Database model
class QuestMember(QuestMemberBase, table=True):
    __tablename__ = "quest_member"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(
        foreign_key="quest.id", nullable=False, ondelete="CASCADE"
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )

    # For internal party quests - tracks assignment
    assigned_by_id: uuid.UUID | None = Field(
        default=None, foreign_key="user.id", nullable=True, ondelete="SET NULL"
    )

    # Source tracking
    source_application_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="questapplication.id",
        nullable=True,
        ondelete="SET NULL",
    )

    # Timestamps
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    quest: "Quest" = Relationship(back_populates="quest_members")
    user: "User" = Relationship(
        back_populates="quest_memberships",
        sa_relationship_kwargs={"foreign_keys": "[QuestMember.user_id]"},
    )
    assigned_by: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[QuestMember.assigned_by_id]"}
    )
    source_application: Optional["QuestApplication"] = Relationship(
        back_populates="quest_member"
    )

    # Unique constraint: one membership per user per quest
    __table_args__ = (
        UniqueConstraint("quest_id", "user_id", name="uq_quest_member_quest_user"),
    )


# Properties to return via API
class QuestMemberPublic(QuestMemberBase):
    id: uuid.UUID
    quest_id: uuid.UUID
    user_id: uuid.UUID
    assigned_by_id: uuid.UUID | None
    source_application_id: uuid.UUID | None
    joined_at: datetime
    left_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class QuestMemberDetail(QuestMemberPublic):
    quest: QuestPublic
    user: UserPublic
    assigned_by: UserPublic | None


class QuestMembersPublic(SQLModel):
    data: list[QuestMemberPublic]
    count: int


class QuestMemberDetailedPublic(SQLModel):
    data: list[QuestMemberDetail]
    count: int


# Internal assignment request model
class QuestMemberAssignRequest(SQLModel):
    """Request to assign members to internal quest"""

    user_ids: list[uuid.UUID] = Field(min_length=1)
    assignment_reason: str | None = Field(default=None, max_length=500)


# Bulk status update model
class QuestMemberBulkUpdate(SQLModel):
    """Bulk update quest member statuses"""

    member_ids: list[uuid.UUID] = Field(min_length=1)
    status: QuestMemberStatus
    completion_reason: str | None = Field(default=None, max_length=500)
