import uuid

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, DateTime, func
from datetime import datetime
from enum import Enum

# ---------- Enums (tweak as you like) ----------
class ChatRole(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


class RequestRole(str, Enum):
    owner = "owner"
    collaborator = "collaborator"
    viewer = "viewer"


class MessageStatus(str, Enum):
    visible = "visible"
    edited = "edited"
    deleted = "deleted"


# ---------- Users ----------

# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    username: str | None = Field(default=None, max_length=255)
    


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


class UserUpdateMe(SQLModel):
    username: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    chat_memberships: list["ChatJoin"] = Relationship(back_populates="user", cascade_delete=True) 
    request_memberships: list["RequestJoin"] = Relationship(back_populates="user") # Join table for requests and users
    owned_requests: list["Request"] = Relationship(back_populates="owner") 
    sent_messages: list["ChatMessage"] = Relationship(back_populates="sender") 


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# ---------- Requests ----------

class Request(SQLModel, table=True):
    __tablename__ = "requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    description: str | None = Field(default=None, max_length=255)
    time: datetime | None
    compensation: str | None
    size: int | None
    need_review: bool = False

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    )

    owner_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    owner: User = Relationship(back_populates="owned_requests")

    members: list["RequestJoin"] = Relationship(back_populates="request")
    tags: list["TagJoin"] = Relationship(back_populates="request")


class RequestJoin(SQLModel, table=True):
    """
    Association object: user<->request with extra columns.
    """
    __tablename__ = "request_join"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    request_id: uuid.UUID = Field(foreign_key="requests.id", index=True)

    role: RequestRole = Field(default=RequestRole.collaborator)
    joined_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    notification_setting: str | None

    user: User = Relationship(back_populates="request_memberships")
    request: Request = Relationship(back_populates="members")



# ---------- Tags ----------

class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    tag: str = Field(index=True, max_length=64)

    requests: list["TagJoin"] = Relationship(back_populates="tag")


class TagJoin(SQLModel, table=True):
    """
    Association table: request<->tag (no extra columns needed, but we keep PK for simplicity).
    """
    __tablename__ = "tag_join"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    tag_id: uuid.UUID = Field(foreign_key="tags.id", index=True)
    request_id: uuid.UUID = Field(foreign_key="requests.id", index=True)

    tag: Tag = Relationship(back_populates="requests")
    request: Request = Relationship(back_populates="tags")



# ---------- Chats ----------

class Chat(SQLModel, table=True):
    __tablename__ = "chats"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    name: str
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    newest_message_at: datetime | None = None

    members: list["ChatJoin"] = Relationship(back_populates="chat")
    messages: list["ChatMessage"] = Relationship(back_populates="chat")


class ChatJoin(SQLModel, table=True):
    """
    Association object: user<->chat with extra columns.
    """
    __tablename__ = "chat_join"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    user_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    chat_id: uuid.UUID = Field(foreign_key="chats.id", index=True)

    role: ChatRole = Field(default=ChatRole.member)
    joined_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    last_read_time: datetime | None = None
    notification_setting: str | None = Field(default=None, max_length=255)

    user: User = Relationship(back_populates="chat_memberships")
    chat: Chat = Relationship(back_populates="members")


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    chat_id: uuid.UUID = Field(foreign_key="chats.id", index=True)
    sender_id: uuid.UUID = Field(foreign_key="users.id", index=True)

    description: str
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    status: MessageStatus = Field(default=MessageStatus.visible)

    chat: Chat = Relationship(back_populates="messages")
    sender: User = Relationship(back_populates="sent_messages")



# ---------- Miscellaneous ----------

# # Shared properties
# class ItemBase(SQLModel):
#     title: str = Field(min_length=1, max_length=255)
#     description: str | None = Field(default=None, max_length=255)


# # Properties to receive on item creation
# class ItemCreate(ItemBase):
#     pass


# # Properties to receive on item update
# class ItemUpdate(ItemBase):
#     title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# # Database model, database table inferred from class name
# class Item(ItemBase, table=True):
#     id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
#     owner_id: uuid.UUID = Field(
#         foreign_key="user.id", nullable=False, ondelete="CASCADE"
#     )
#     owner: User | None = Relationship(back_populates="items")



# # Properties to return via API, id is always required
# class ItemPublic(ItemBase):
#     id: uuid.UUID
#     owner_id: uuid.UUID


# class ItemsPublic(SQLModel):
#     data: list[ItemPublic]
#     count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
