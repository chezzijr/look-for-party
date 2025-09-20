import uuid

from sqlmodel import Session, col, func, select

from app.models import (
    QuestTag,
    QuestTagCreate,
    QuestTagUpdate,
    Tag,
    TagCategory,
    TagCreate,
    TagStatus,
    TagUpdate,
    UserTag,
    UserTagCreate,
    UserTagUpdate,
)


# Tag CRUD operations
def create_tag(*, session: Session, tag_in: TagCreate) -> Tag:
    """Create a new tag."""
    db_tag = Tag.model_validate(tag_in)
    session.add(db_tag)
    session.commit()
    session.refresh(db_tag)
    return db_tag


def get_tag(*, session: Session, tag_id: uuid.UUID) -> Tag | None:
    """Get tag by ID."""
    statement = select(Tag).where(Tag.id == tag_id)
    return session.exec(statement).first()


def get_tag_by_slug(*, session: Session, slug: str) -> Tag | None:
    """Get tag by slug."""
    statement = select(Tag).where(Tag.slug == slug)
    return session.exec(statement).first()


def get_tag_by_name(*, session: Session, name: str) -> Tag | None:
    """Get tag by name."""
    statement = select(Tag).where(Tag.name == name)
    return session.exec(statement).first()


def get_tags(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    category: TagCategory | None = None,
    status: TagStatus | None = None,
    search: str | None = None,
) -> list[Tag]:
    """Get tags with optional filtering."""
    statement = select(Tag)

    # Filter by status (default to approved tags)
    if status:
        statement = statement.where(Tag.status == status)
    else:
        statement = statement.where(
            col(Tag.status).in_([TagStatus.SYSTEM, TagStatus.APPROVED])
        )

    # Filter by category
    if category:
        statement = statement.where(Tag.category == category)

    # Search by name
    if search:
        statement = statement.where(col(Tag.name).ilike(f"%{search}%"))

    # Order by usage count (most popular first), then by name
    statement = statement.order_by(col(Tag.usage_count).desc(), Tag.name)

    # Apply pagination
    statement = statement.offset(skip).limit(limit)

    return list(session.exec(statement).all())


def get_popular_tags(
    *,
    session: Session,
    limit: int = 20,
    category: TagCategory | None = None,
) -> list[Tag]:
    """Get most popular tags (highest usage count)."""
    statement = select(Tag).where(
        col(Tag.status).in_([TagStatus.SYSTEM, TagStatus.APPROVED]), Tag.usage_count > 0
    )

    if category:
        statement = statement.where(Tag.category == category)

    statement = statement.order_by(col(Tag.usage_count).desc()).limit(limit)

    return list(session.exec(statement).all())


def get_tag_suggestions(
    *,
    session: Session,
    query: str,
    category: TagCategory | None = None,
    limit: int = 10,
) -> list[Tag]:
    """Get tag suggestions for autocomplete."""
    statement = select(Tag).where(
        col(Tag.status).in_([TagStatus.SYSTEM, TagStatus.APPROVED]),
        col(Tag.name).ilike(f"{query}%"),
    )

    if category:
        statement = statement.where(Tag.category == category)

    statement = statement.order_by(col(Tag.usage_count).desc(), Tag.name).limit(limit)

    return list(session.exec(statement).all())


def update_tag(*, session: Session, db_tag: Tag, tag_in: TagUpdate) -> Tag:
    """Update a tag."""
    from datetime import datetime

    tag_data = tag_in.model_dump(exclude_unset=True)
    tag_data["updated_at"] = datetime.utcnow()

    db_tag.sqlmodel_update(tag_data)
    session.add(db_tag)
    session.commit()
    session.refresh(db_tag)
    return db_tag


def increment_tag_usage(*, session: Session, tag_id: uuid.UUID) -> None:
    """Increment tag usage count."""
    tag = get_tag(session=session, tag_id=tag_id)
    if tag:
        tag.usage_count += 1
        session.add(tag)
        session.commit()


def delete_tag(*, session: Session, tag_id: uuid.UUID) -> Tag | None:
    """Delete a tag."""
    tag = get_tag(session=session, tag_id=tag_id)
    if tag:
        session.delete(tag)
        session.commit()
    return tag


# UserTag CRUD operations
def create_user_tag(
    *, session: Session, user_tag_in: UserTagCreate, user_id: uuid.UUID
) -> UserTag:
    """Add a tag to a user's profile."""
    db_user_tag = UserTag.model_validate(user_tag_in, update={"user_id": user_id})
    session.add(db_user_tag)
    session.commit()
    session.refresh(db_user_tag)

    # Increment tag usage count
    increment_tag_usage(session=session, tag_id=user_tag_in.tag_id)

    return db_user_tag


def get_user_tag(
    *, session: Session, user_id: uuid.UUID, tag_id: uuid.UUID
) -> UserTag | None:
    """Get a specific user-tag relationship."""
    statement = select(UserTag).where(
        UserTag.user_id == user_id, UserTag.tag_id == tag_id
    )
    return session.exec(statement).first()


def get_user_tags(*, session: Session, user_id: uuid.UUID) -> list[UserTag]:
    """Get all tags for a user."""
    statement = (
        select(UserTag)
        .where(UserTag.user_id == user_id)
        .order_by(
            col(UserTag.is_primary).desc(),  # Primary tags first
            col(UserTag.created_at).desc(),
        )
    )
    return list(session.exec(statement).all())


def update_user_tag(
    *, session: Session, db_user_tag: UserTag, user_tag_in: UserTagUpdate
) -> UserTag:
    """Update a user's tag relationship."""
    user_tag_data = user_tag_in.model_dump(exclude_unset=True)
    db_user_tag.sqlmodel_update(user_tag_data)
    session.add(db_user_tag)
    session.commit()
    session.refresh(db_user_tag)
    return db_user_tag


def delete_user_tag(
    *, session: Session, user_id: uuid.UUID, tag_id: uuid.UUID
) -> UserTag | None:
    """Remove a tag from a user's profile."""
    user_tag = get_user_tag(session=session, user_id=user_id, tag_id=tag_id)
    if user_tag:
        session.delete(user_tag)
        session.commit()
    return user_tag


# QuestTag CRUD operations
def create_quest_tag(
    *, session: Session, quest_tag_in: QuestTagCreate, quest_id: uuid.UUID
) -> QuestTag:
    """Add a tag to a quest."""
    db_quest_tag = QuestTag.model_validate(quest_tag_in, update={"quest_id": quest_id})
    session.add(db_quest_tag)
    session.commit()
    session.refresh(db_quest_tag)

    # Increment tag usage count
    increment_tag_usage(session=session, tag_id=quest_tag_in.tag_id)

    return db_quest_tag


def get_quest_tag(
    *, session: Session, quest_id: uuid.UUID, tag_id: uuid.UUID
) -> QuestTag | None:
    """Get a specific quest-tag relationship."""
    statement = select(QuestTag).where(
        QuestTag.quest_id == quest_id, QuestTag.tag_id == tag_id
    )
    return session.exec(statement).first()


def get_quest_tags(*, session: Session, quest_id: uuid.UUID) -> list[QuestTag]:
    """Get all tags for a quest."""
    statement = (
        select(QuestTag)
        .where(QuestTag.quest_id == quest_id)
        .order_by(
            col(QuestTag.is_required).desc(),  # Required tags first
            col(QuestTag.created_at),
        )
    )
    return list(session.exec(statement).all())


def update_quest_tag(
    *, session: Session, db_quest_tag: QuestTag, quest_tag_in: QuestTagUpdate
) -> QuestTag:
    """Update a quest's tag relationship."""
    quest_tag_data = quest_tag_in.model_dump(exclude_unset=True)
    db_quest_tag.sqlmodel_update(quest_tag_data)
    session.add(db_quest_tag)
    session.commit()
    session.refresh(db_quest_tag)
    return db_quest_tag


def delete_quest_tag(
    *, session: Session, quest_id: uuid.UUID, tag_id: uuid.UUID
) -> QuestTag | None:
    """Remove a tag from a quest."""
    quest_tag = get_quest_tag(session=session, quest_id=quest_id, tag_id=tag_id)
    if quest_tag:
        session.delete(quest_tag)
        session.commit()
    return quest_tag


def get_tag_categories_with_counts(*, session: Session) -> dict[str, int]:
    """Get tag categories with their counts."""
    statement = (
        select(Tag.category, func.count(col(Tag.id)).label("count"))
        .where(col(Tag.status).in_([TagStatus.SYSTEM, TagStatus.APPROVED]))
        .group_by(Tag.category)
    )

    result = session.exec(statement).all()
    return dict(result)
