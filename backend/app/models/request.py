import uuid

from typing import TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, DateTime, func
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .request import Request, RequestUser
    from .user import User
    from .tag import Tag, TagRequest


class RequestRole(str, Enum):
    owner = "owner"
    collaborator = "admin"
    viewer = "member"


class RequestBase(SQLModel):
    description: str | None = Field(default=None, max_length=255)
    time: datetime | None
    compensation: str | None
    size: int | None
    need_review: bool = False

class RequestCreate(RequestBase):
    pass

class RequestUpdate(RequestBase):
    pass

class Request(RequestBase, table=True):
    __tablename__ = "requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    )

    owner_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    owner: User = Relationship(back_populates="owned_requests")

    members: list["RequestUser"] = Relationship(back_populates="request")
    tags: list["TagRequest"] = Relationship(back_populates="request")


class RequestPublic(RequestBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

class RequestPublicExtended(RequestPublic):
    members: list["User"]
    tags: list["Tag"]


class RequestsPublic(SQLModel):
    data: list[RequestPublic]
    count: int


class RequestUser(SQLModel, table=True):
    """
    Association object: user<->request with extra columns.
    """
    __tablename__ = "requests_users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    request_id: uuid.UUID = Field(foreign_key="requests.id", index=True)

    role: RequestRole = Field(default=RequestRole.member)
    joined_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )


    user: User = Relationship(back_populates="request_memberships")
    request: Request = Relationship(back_populates="members")

class RequestUserCreate(RequestUser):
    pass

class RequestUserUpdate(RequestUser):
    pass