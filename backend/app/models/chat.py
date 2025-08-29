import uuid

from typing import TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import Column, DateTime, func
from datetime import datetime
from enum import Enum

if TYPE_CHECKING:
    from .user import User


class ChatRole(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"

class MessageStatus(str, Enum):
    visible = "visible"
    edited = "edited"
    deleted = "deleted"



class ChatBase(SQLModel):
    name: str
    newest_message_at: datetime | None = None

class Chat(ChatBase, table=True):
    __tablename__ = "chats"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )

    members: list["ChatUser"] = Relationship(back_populates="chat")
    messages: list["ChatMessage"] = Relationship(back_populates="chat")

class ChatPublic(ChatBase):
    id: uuid.UUID
    newest_message_at: datetime | None
    created_at: datetime

class ChatsPublic(SQLModel):
    data: list[ChatPublic]
    count: int


class ChatUser(SQLModel, table=True):
    """
    Association object: user<->chat with extra columns.
    """
    __tablename__ = "chats_users"

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


class ChatMessageBase(SQLModel):
    text: str
    status: MessageStatus = Field(default=MessageStatus.visible)


class ChatMessage(ChatMessageBase, table=True):
    __tablename__ = "chat_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )

    chat_id: uuid.UUID = Field(foreign_key="chats.id", index=True)
    sender_id: uuid.UUID = Field(foreign_key="users.id", index=True)

    chat: Chat = Relationship(back_populates="messages")
    sender: User = Relationship(back_populates="sent_messages")


class ChatMessagePublic(ChatMessageBase):
    id: uuid.UUID
    created_at: datetime
    chat_id: uuid.UUID
    sender_id: uuid.UUID

class ChatsMessagePublic(ChatMessageBase):
    data: list[ChatMessagePublic]
    count: int