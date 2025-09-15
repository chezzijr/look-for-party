import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .quest import Quest
    from .rating import Rating
    from .user import User


class PartyStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class PartyMemberRole(str, Enum):
    OWNER = "OWNER"
    MODERATOR = "MODERATOR"
    MEMBER = "MEMBER"


# Shared properties
class PartyBase(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    status: PartyStatus = Field(
        default=PartyStatus.ACTIVE,
        sa_column_kwargs={"server_default": PartyStatus.ACTIVE.value},
    )
    is_private: bool = Field(default=False)
    chat_channel_id: str | None = Field(default=None, max_length=255)


# Properties to receive on party creation
class PartyCreate(PartyBase):
    quest_id: uuid.UUID


# Properties to receive on party update
class PartyUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    status: PartyStatus | None = Field(default=None)
    is_private: bool | None = Field(default=None)
    chat_channel_id: str | None = Field(default=None, max_length=255)


# Database model
class Party(PartyBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False, unique=True)
    formed_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = Field(default=None)
    archived_at: datetime | None = Field(default=None)

    # Relationships
    quest: "Quest" = Relationship(back_populates="party")
    members: list["PartyMember"] = Relationship(
        back_populates="party", cascade_delete=True
    )
    ratings: list["Rating"] = Relationship(
        back_populates="party", cascade_delete=True
    )


# Party Member model
class PartyMemberBase(SQLModel):
    role: PartyMemberRole = Field(
        default=PartyMemberRole.MEMBER,
        sa_column_kwargs={"server_default": PartyMemberRole.MEMBER.value},
    )
    status: str = Field(default="active", max_length=20)  # 'active', 'inactive', 'removed'


class PartyMemberCreate(PartyMemberBase):
    user_id: uuid.UUID


class PartyMemberUpdate(SQLModel):
    role: PartyMemberRole | None = Field(default=None)
    status: str | None = Field(default=None, max_length=20)


class PartyMember(PartyMemberBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    party_id: uuid.UUID = Field(foreign_key="party.id", nullable=False)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: datetime | None = Field(default=None)

    # Relationships
    party: Party = Relationship(back_populates="members")
    user: "User" = Relationship(back_populates="party_memberships")


# Properties to return via API
class PartyPublic(PartyBase):
    id: uuid.UUID
    quest_id: uuid.UUID
    formed_at: datetime
    archived_at: datetime | None


class PartyDetail(PartyPublic):
    quest: "Quest" = Field(exclude={"applications"})
    members: list["PartyMemberPublic"] = Field(default_factory=list)
    member_count: int = Field(default=0)


class PartiesPublic(SQLModel):
    data: list[PartyPublic]
    count: int


class PartyMemberPublic(PartyMemberBase):
    id: uuid.UUID
    party_id: uuid.UUID
    user_id: uuid.UUID
    joined_at: datetime
    left_at: datetime | None


class PartyMemberDetail(PartyMemberPublic):
    party: PartyPublic
    user: "User" = Field(exclude={"hashed_password"})


class PartyMembersPublic(SQLModel):
    data: list[PartyMemberPublic]
    count: int
