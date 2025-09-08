import uuid
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .request import Request


class TagBase(SQLModel):
    tag: str = Field(index=True, max_length=64)


class Tag(TagBase, table=True):
    __tablename__ = "tags"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    requests: list["TagRequest"] = Relationship(back_populates="tag")


class TagPublic(TagBase):
    id: uuid.UUID


class TagsPublic(SQLModel):
    data: list[TagPublic]
    count: int


class TagRequest(SQLModel, table=True):
    """
    Association table: request<->tag (no extra columns needed, but we keep PK for simplicity).
    """

    __tablename__ = "tags_requests"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)

    tag_id: uuid.UUID = Field(foreign_key="tags.id", index=True)
    request_id: uuid.UUID = Field(foreign_key="requests.id", index=True)

    tag: Tag = Relationship(back_populates="requests")
    request: "Request" = Relationship(back_populates="tags")
