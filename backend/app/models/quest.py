import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .application import QuestApplication
    from .party import Party
    from .tag import QuestTag
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


class QuestType(str, Enum):
    INDIVIDUAL = "INDIVIDUAL"  # Regular user-created quest
    PARTY_INTERNAL = "PARTY_INTERNAL"  # Internal task assignment within party
    PARTY_EXPANSION = "PARTY_EXPANSION"  # Public recruitment to expand existing party
    PARTY_HYBRID = "PARTY_HYBRID"  # Starts internal, can be publicized later



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
    quest_type: QuestType = Field(
        default=QuestType.INDIVIDUAL,
        sa_column_kwargs={"server_default": QuestType.INDIVIDUAL.value},
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
    quest_type: QuestType | None = Field(default=None)
    internal_slots: int | None = Field(default=None, ge=0)
    public_slots: int | None = Field(default=None, ge=0)
    assigned_member_ids: str | None = Field(default=None, max_length=1000)
    is_publicized: bool | None = Field(default=None)


# Database model
class Quest(QuestBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    creator_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    status: QuestStatus = Field(
        default=QuestStatus.RECRUITING,
        sa_column_kwargs={"server_default": QuestStatus.RECRUITING.value},
    )
    
    # Party-related fields for enhanced quest system
    party_id: uuid.UUID | None = Field(default=None, foreign_key="party.id", nullable=True, ondelete="SET NULL")  # Party that created this quest
    parent_party_id: uuid.UUID | None = Field(default=None, foreign_key="party.id", nullable=True, ondelete="SET NULL")  # Party this quest belongs to (for expansion/internal)
    internal_slots: int = Field(default=0, ge=0)  # Number of slots for internal assignments
    public_slots: int = Field(default=0, ge=0)  # Number of slots for public recruitment
    assigned_member_ids: str | None = Field(default=None, max_length=1000)  # JSON array of assigned member UUIDs
    is_publicized: bool = Field(default=False)  # Whether internal/hybrid quest has been publicized
    
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
    publicized_at: datetime | None = Field(default=None)  # When quest was publicized

    # Relationships
    creator: "User" = Relationship(back_populates="created_quests")
    applications: list["QuestApplication"] = Relationship(
        back_populates="quest", cascade_delete=True
    )
    party: Optional["Party"] = Relationship(
        back_populates="quest", cascade_delete=True,
        sa_relationship_kwargs={"foreign_keys": "Party.quest_id"}
    )
    quest_tags: list["QuestTag"] = Relationship(
        back_populates="quest", cascade_delete=True
    )
    # Party relationships for enhanced quest system
    creating_party: Optional["Party"] = Relationship(
        back_populates="created_quests",
        sa_relationship_kwargs={"foreign_keys": "Quest.party_id"}
    )
    parent_party: Optional["Party"] = Relationship(
        back_populates="expansion_quests", 
        sa_relationship_kwargs={"foreign_keys": "Quest.parent_party_id"}
    )


# Properties to return via API
class QuestPublic(QuestBase):
    id: uuid.UUID
    creator_id: uuid.UUID
    status: QuestStatus
    created_at: datetime
    party_id: uuid.UUID | None = None
    parent_party_id: uuid.UUID | None = None
    internal_slots: int = 0
    public_slots: int = 0
    assigned_member_ids: str | None = None
    is_publicized: bool = False
    publicized_at: datetime | None = None


class QuestDetail(QuestPublic):
    creator: "User" = Field(exclude={"hashed_password"})
    applications_count: int = Field(default=0)
    party: Optional["Party"] = Field(default=None)
    creating_party: Optional["Party"] = Field(default=None)
    parent_party: Optional["Party"] = Field(default=None)
    assigned_member_ids: str | None = None


class QuestsPublic(SQLModel):
    data: list[QuestPublic]
    count: int


# Party Quest Creation Models
class PartyQuestCreate(SQLModel):
    """Model for creating quests from party context"""
    title: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20, max_length=2000)
    objective: str = Field(min_length=10, max_length=500)
    category: QuestCategory
    quest_type: QuestType
    # For internal quests
    assigned_member_ids: list[uuid.UUID] | None = Field(default=None)
    internal_slots: int = Field(default=0, ge=0)
    # For expansion/hybrid quests
    party_size_min: int | None = Field(default=None, ge=1, le=50)
    party_size_max: int | None = Field(default=None, ge=1, le=50)
    public_slots: int = Field(default=0, ge=0)
    # Common fields
    required_commitment: CommitmentLevel
    location_type: LocationType
    location_detail: str | None = Field(default=None, max_length=255)
    starts_at: datetime | None = Field(default=None)
    deadline: datetime | None = Field(default=None)
    estimated_duration: str | None = Field(default=None, max_length=100)
    auto_approve: bool = Field(default=False)
    visibility: QuestVisibility = Field(default=QuestVisibility.PRIVATE)


class QuestPublicizeRequest(SQLModel):
    """Request to publicize an internal/hybrid quest"""
    public_slots: int = Field(ge=1, le=50)
    visibility: QuestVisibility = Field(default=QuestVisibility.PUBLIC)


class QuestMemberAssignmentRequest(SQLModel):
    """Request to assign/unassign members to internal quest"""
    assigned_member_ids: list[uuid.UUID] = Field(min_length=1)
