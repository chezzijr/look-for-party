import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING
from decimal import Decimal

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .quest import Quest, QuestApplication
    from .party import Party, PartyMember


class CommitmentLevel(str, Enum):
    CASUAL = "CASUAL"
    MODERATE = "MODERATE"
    SERIOUS = "SERIOUS"
    PROFESSIONAL = "PROFESSIONAL"


class CommunicationStyle(str, Enum):
    TEXT = "TEXT"
    VOICE = "VOICE"
    VIDEO = "VIDEO"
    MIXED = "MIXED"


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None)
    location: str | None = Field(default=None, max_length=255)
    timezone: str | None = Field(default=None, max_length=50)
    preferred_party_size_min: int = Field(default=2, ge=1, le=50)
    preferred_party_size_max: int = Field(default=8, ge=1, le=50)
    preferred_commitment_level: CommitmentLevel = Field(
        default=CommitmentLevel.CASUAL,
        sa_column_kwargs={"server_default": CommitmentLevel.CASUAL.value}
    )
    communication_style: CommunicationStyle = Field(
        default=CommunicationStyle.TEXT,
        sa_column_kwargs={"server_default": CommunicationStyle.TEXT.value}
    )


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)
    bio: str | None = Field(default=None)
    location: str | None = Field(default=None, max_length=255)
    timezone: str | None = Field(default=None, max_length=50)
    preferred_party_size_min: int | None = Field(default=None, ge=1, le=50)
    preferred_party_size_max: int | None = Field(default=None, ge=1, le=50)
    preferred_commitment_level: CommitmentLevel | None = Field(default=None)
    communication_style: CommunicationStyle | None = Field(default=None)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None)
    location: str | None = Field(default=None, max_length=255)
    timezone: str | None = Field(default=None, max_length=50)
    preferred_party_size_min: int | None = Field(default=None, ge=1, le=50)
    preferred_party_size_max: int | None = Field(default=None, ge=1, le=50)
    preferred_commitment_level: CommitmentLevel | None = Field(default=None)
    communication_style: CommunicationStyle | None = Field(default=None)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime | None = Field(default=None)
    reputation_score: Decimal = Field(default=Decimal("0.0"), decimal_places=2, max_digits=3)
    total_completed_quests: int = Field(default=0, ge=0)

    # Relationships
    created_quests: list["Quest"] = Relationship(back_populates="creator", cascade_delete=True)
    applications: list["QuestApplication"] = Relationship(back_populates="applicant", cascade_delete=True)
    party_memberships: list["PartyMember"] = Relationship(back_populates="user", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime
    reputation_score: Decimal
    total_completed_quests: int


class UserProfile(UserPublic):
    last_active: datetime | None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int
