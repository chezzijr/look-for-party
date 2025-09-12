import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User
    from .quest import Quest


class PartyStatus(str, Enum):
    FORMING = "FORMING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DISBANDED = "DISBANDED"


# Shared properties
class PartyBase(SQLModel):
    status: PartyStatus = Field(
        default=PartyStatus.FORMING,
        sa_column_kwargs={"server_default": PartyStatus.FORMING.value}
    )
    chat_channel_id: str | None = Field(default=None, max_length=255)


# Properties to receive on party creation
class PartyCreate(PartyBase):
    quest_id: uuid.UUID


# Properties to receive on party update
class PartyUpdate(SQLModel):
    status: PartyStatus | None = Field(default=None)
    chat_channel_id: str | None = Field(default=None, max_length=255)


# Database model
class Party(PartyBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False, unique=True)
    formed_at: datetime = Field(default_factory=datetime.utcnow)
    disbanded_at: datetime | None = Field(default=None)

    # Relationships
    quest: "Quest" = Relationship(back_populates="party")
    members: list["PartyMember"] = Relationship(back_populates="party", cascade_delete=True)


# Party Member model
class PartyMemberBase(SQLModel):
    role: str | None = Field(default=None, max_length=100)
    is_leader: bool = Field(default=False)


class PartyMemberCreate(PartyMemberBase):
    user_id: uuid.UUID


class PartyMemberUpdate(SQLModel):
    role: str | None = Field(default=None, max_length=100)
    is_leader: bool | None = Field(default=None)


class PartyMember(PartyMemberBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    party_id: uuid.UUID = Field(foreign_key="party.id", nullable=False)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: datetime | None = Field(default=None)
    is_active: bool = Field(default=True)

    # Relationships
    party: Party = Relationship(back_populates="members")
    user: "User" = Relationship(back_populates="party_memberships")


# Properties to return via API
class PartyPublic(PartyBase):
    id: uuid.UUID
    quest_id: uuid.UUID
    formed_at: datetime
    disbanded_at: datetime | None


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
    is_active: bool


class PartyMemberDetail(PartyMemberPublic):
    party: PartyPublic
    user: "User" = Field(exclude={"hashed_password"})


class PartyMembersPublic(SQLModel):
    data: list[PartyMemberPublic]
    count: int