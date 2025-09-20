import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

if TYPE_CHECKING:
    from .quest import Quest
    from .user import User


class TagCategory(str, Enum):
    # Technical
    PROGRAMMING = "PROGRAMMING"  # Python, JavaScript, C++, SQL
    FRAMEWORK = "FRAMEWORK"  # React, Django, Unity, TensorFlow
    TOOL = "TOOL"  # Git, Docker, Photoshop, Excel, Discord

    # Gaming
    GAME = "GAME"  # League of Legends, Chess, D&D, Among Us
    GAME_GENRE = "GAME_GENRE"  # FPS, MOBA, RPG, Strategy, Puzzle

    # Creative
    ART = "ART"  # Drawing, Painting, Digital Art, Sculpture
    MUSIC = "MUSIC"  # Guitar, Piano, Music Production, Jazz
    MEDIA = "MEDIA"  # Photography, Video Editing, Streaming, Writing

    # Physical Activities
    SPORT = "SPORT"  # Basketball, Soccer, Tennis, Running
    FITNESS = "FITNESS"  # Yoga, Weightlifting, CrossFit, Pilates

    # Knowledge & Learning
    LANGUAGE = "LANGUAGE"  # English, Spanish, Mandarin (natural languages)
    SUBJECT = "SUBJECT"  # Mathematics, Physics, History, Psychology

    # General
    SKILL = "SKILL"  # Leadership, Communication, Problem Solving
    HOBBY = "HOBBY"  # Cooking, Reading, Gardening, Board Games
    LOCATION = "LOCATION"  # Cities, Regions, Online, Countries
    STYLE = "STYLE"  # Casual, Competitive, Beginner-friendly


class TagStatus(str, Enum):
    SYSTEM = "SYSTEM"  # Pre-approved system tags
    APPROVED = "APPROVED"  # User-suggested, admin approved (future)
    PENDING = "PENDING"  # Awaiting approval (future)
    REJECTED = "REJECTED"  # Rejected (future)


class ProficiencyLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


# Shared properties
class TagBase(SQLModel):
    name: str = Field(max_length=100)
    slug: str = Field(max_length=100)
    category: TagCategory
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on tag creation
class TagCreate(TagBase):
    status: TagStatus = TagStatus.SYSTEM
    suggested_by: uuid.UUID | None = None


# Properties to receive on tag update
class TagUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=100)
    slug: str | None = Field(default=None, max_length=100)
    category: TagCategory | None = Field(default=None)
    description: str | None = Field(default=None, max_length=255)
    status: TagStatus | None = Field(default=None)
    suggested_by: uuid.UUID | None = Field(default=None)


# Database model
class Tag(TagBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Unique constraints
    name: str = Field(unique=True, index=True, max_length=100)
    slug: str = Field(unique=True, index=True, max_length=100)

    # Moderation
    status: TagStatus = Field(
        default=TagStatus.SYSTEM,
        sa_column_kwargs={"server_default": TagStatus.SYSTEM.value},
    )
    suggested_by: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)

    # Analytics
    usage_count: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user_tags: list["UserTag"] = Relationship(back_populates="tag", cascade_delete=True)
    quest_tags: list["QuestTag"] = Relationship(
        back_populates="tag", cascade_delete=True
    )
    suggested_by_user: Optional["User"] = Relationship(
        back_populates="suggested_tags",
        sa_relationship_kwargs={"foreign_keys": "[Tag.suggested_by]"},
    )


# UserTag - Junction table for User-Tag many-to-many
class UserTagBase(SQLModel):
    proficiency_level: ProficiencyLevel | None = Field(default=None)
    is_primary: bool = Field(default=False)


class UserTagCreate(UserTagBase):
    tag_id: uuid.UUID


class UserTagUpdate(SQLModel):
    proficiency_level: ProficiencyLevel | None = Field(default=None)
    is_primary: bool | None = Field(default=None)


class UserTag(UserTagBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    tag_id: uuid.UUID = Field(foreign_key="tag.id", nullable=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="user_tags")
    tag: Tag = Relationship(back_populates="user_tags")

    # Prevent duplicates
    __table_args__ = (UniqueConstraint("user_id", "tag_id"),)


# QuestTag - Junction table for Quest-Tag many-to-many
class QuestTagBase(SQLModel):
    is_required: bool = Field(default=False)
    min_proficiency: ProficiencyLevel | None = Field(default=None)


class QuestTagCreate(QuestTagBase):
    tag_id: uuid.UUID


class QuestTagUpdate(SQLModel):
    is_required: bool | None = Field(default=None)
    min_proficiency: ProficiencyLevel | None = Field(default=None)


class QuestTag(QuestTagBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False)
    tag_id: uuid.UUID = Field(foreign_key="tag.id", nullable=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    quest: "Quest" = Relationship(back_populates="quest_tags")
    tag: Tag = Relationship(back_populates="quest_tags")

    # Prevent duplicates
    __table_args__ = (UniqueConstraint("quest_id", "tag_id"),)


# Properties to return via API
class TagPublic(TagBase):
    id: uuid.UUID
    status: TagStatus
    usage_count: int
    created_at: datetime


class TagDetail(TagPublic):
    suggested_by: uuid.UUID | None
    updated_at: datetime


class TagsPublic(SQLModel):
    data: list[TagPublic]
    count: int


class UserTagPublic(UserTagBase):
    id: uuid.UUID
    user_id: uuid.UUID
    tag_id: uuid.UUID
    created_at: datetime
    tag: TagPublic


class UserTagsPublic(SQLModel):
    data: list[UserTagPublic]
    count: int


class QuestTagPublic(QuestTagBase):
    id: uuid.UUID
    quest_id: uuid.UUID
    tag_id: uuid.UUID
    created_at: datetime
    tag: TagPublic


class QuestTagsPublic(SQLModel):
    data: list[QuestTagPublic]
    count: int
