import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.models.tag import (
    Tag,
    TagCategory,
    TagCreate,
    TagDetail,
    TagPublic,
    TagsPublic,
    TagStatus,
    TagUpdate,
    UserTag,
    UserTagCreate,
    UserTagPublic,
    UserTagsPublic,
    UserTagUpdate,
    QuestTag,
    QuestTagCreate,
    QuestTagPublic,
    QuestTagsPublic,
    QuestTagUpdate,
)
from app.models import Message

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=TagsPublic)
def read_tags(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    category: TagCategory | None = None,
    status: TagStatus | None = None,
    search: str | None = None,
) -> Any:
    """
    Retrieve tags with optional filtering.
    """
    tags = crud.get_tags(
        session=session,
        skip=skip,
        limit=limit,
        category=category,
        status=status,
        search=search,
    )
    
    count_statement = select(func.count()).select_from(Tag)
    if status:
        count_statement = count_statement.where(Tag.status == status)
    else:
        count_statement = count_statement.where(Tag.status.in_([TagStatus.SYSTEM, TagStatus.APPROVED]))
    if category:
        count_statement = count_statement.where(Tag.category == category)
    if search:
        count_statement = count_statement.where(Tag.name.ilike(f"%{search}%"))
    
    count = session.exec(count_statement).one()
    
    return TagsPublic(data=tags, count=count)


@router.get("/popular", response_model=TagsPublic)
def read_popular_tags(
    session: SessionDep,
    limit: int = 20,
    category: TagCategory | None = None,
) -> Any:
    """
    Retrieve most popular tags (highest usage count).
    """
    tags = crud.get_popular_tags(session=session, limit=limit, category=category)
    return TagsPublic(data=tags, count=len(tags))


@router.get("/suggestions", response_model=TagsPublic)
def get_tag_suggestions(
    session: SessionDep,
    q: str = Query(..., description="Search query for tag suggestions"),
    category: TagCategory | None = None,
    limit: int = 10,
) -> Any:
    """
    Get tag suggestions for autocomplete.
    """
    tags = crud.get_tag_suggestions(
        session=session, query=q, category=category, limit=limit
    )
    return TagsPublic(data=tags, count=len(tags))


@router.get("/categories", response_model=dict[str, int])
def get_tag_categories_with_counts(session: SessionDep) -> Any:
    """
    Get tag categories with their counts.
    """
    return crud.get_tag_categories_with_counts(session=session)


@router.get("/{tag_id}", response_model=TagDetail)
def read_tag(session: SessionDep, tag_id: uuid.UUID) -> Any:
    """
    Get tag by ID.
    """
    tag = crud.get_tag(session=session, tag_id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.get("/slug/{slug}", response_model=TagPublic)
def read_tag_by_slug(session: SessionDep, slug: str) -> Any:
    """
    Get tag by slug.
    """
    tag = crud.get_tag_by_slug(session=session, slug=slug)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.post("/", dependencies=[Depends(get_current_active_superuser)], response_model=TagPublic)
def create_tag(*, session: SessionDep, tag_in: TagCreate) -> Any:
    """
    Create new tag (admin only).
    """
    # Check if tag with same name or slug already exists
    existing_name = crud.get_tag_by_name(session=session, name=tag_in.name)
    if existing_name:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")
    
    existing_slug = crud.get_tag_by_slug(session=session, slug=tag_in.slug)
    if existing_slug:
        raise HTTPException(status_code=400, detail="Tag with this slug already exists")
    
    tag = crud.create_tag(session=session, tag_in=tag_in)
    return tag


@router.put("/{tag_id}", dependencies=[Depends(get_current_active_superuser)], response_model=TagPublic)
def update_tag(*, session: SessionDep, tag_id: uuid.UUID, tag_in: TagUpdate) -> Any:
    """
    Update tag (admin only).
    """
    tag = crud.get_tag(session=session, tag_id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check for name/slug conflicts if they're being updated
    if tag_in.name and tag_in.name != tag.name:
        existing_name = crud.get_tag_by_name(session=session, name=tag_in.name)
        if existing_name and existing_name.id != tag_id:
            raise HTTPException(status_code=400, detail="Tag with this name already exists")
    
    if tag_in.slug and tag_in.slug != tag.slug:
        existing_slug = crud.get_tag_by_slug(session=session, slug=tag_in.slug)
        if existing_slug and existing_slug.id != tag_id:
            raise HTTPException(status_code=400, detail="Tag with this slug already exists")
    
    updated_tag = crud.update_tag(session=session, db_tag=tag, tag_in=tag_in)
    return updated_tag


@router.delete("/{tag_id}", dependencies=[Depends(get_current_active_superuser)])
def delete_tag(session: SessionDep, tag_id: uuid.UUID) -> Message:
    """
    Delete tag (admin only).
    """
    tag = crud.get_tag(session=session, tag_id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    crud.delete_tag(session=session, tag_id=tag_id)
    return Message(message="Tag deleted successfully")


# User-Tag relationship endpoints
@router.get("/users/me", response_model=UserTagsPublic)
def read_my_user_tags(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Get current user's tags.
    """
    user_tags = crud.get_user_tags(session=session, user_id=current_user.id)
    return UserTagsPublic(data=user_tags, count=len(user_tags))


@router.post("/users/me", response_model=UserTagPublic)
def create_my_user_tag(
    *, session: SessionDep, current_user: CurrentUser, user_tag_in: UserTagCreate
) -> Any:
    """
    Add a tag to current user's profile.
    """
    # Check if tag exists
    tag = crud.get_tag(session=session, tag_id=user_tag_in.tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if user already has this tag
    existing = crud.get_user_tag(
        session=session, user_id=current_user.id, tag_id=user_tag_in.tag_id
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already has this tag")
    
    user_tag = crud.create_user_tag(
        session=session, user_tag_in=user_tag_in, user_id=current_user.id
    )
    return user_tag


@router.put("/users/me/{tag_id}", response_model=UserTagPublic)
def update_my_user_tag(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tag_id: uuid.UUID,
    user_tag_in: UserTagUpdate
) -> Any:
    """
    Update current user's tag relationship.
    """
    user_tag = crud.get_user_tag(
        session=session, user_id=current_user.id, tag_id=tag_id
    )
    if not user_tag:
        raise HTTPException(status_code=404, detail="User tag not found")
    
    updated_user_tag = crud.update_user_tag(
        session=session, db_user_tag=user_tag, user_tag_in=user_tag_in
    )
    return updated_user_tag


@router.delete("/users/me/{tag_id}")
def delete_my_user_tag(
    session: SessionDep, current_user: CurrentUser, tag_id: uuid.UUID
) -> Message:
    """
    Remove a tag from current user's profile.
    """
    user_tag = crud.get_user_tag(
        session=session, user_id=current_user.id, tag_id=tag_id
    )
    if not user_tag:
        raise HTTPException(status_code=404, detail="User tag not found")
    
    crud.delete_user_tag(
        session=session, user_id=current_user.id, tag_id=tag_id
    )
    return Message(message="Tag removed from user profile")


@router.get("/users/{user_id}", response_model=UserTagsPublic)
def read_user_tags(session: SessionDep, user_id: uuid.UUID) -> Any:
    """
    Get user's tags (public view).
    """
    user_tags = crud.get_user_tags(session=session, user_id=user_id)
    return UserTagsPublic(data=user_tags, count=len(user_tags))


# Quest-Tag relationship endpoints
@router.get("/quests/{quest_id}", response_model=QuestTagsPublic)
def read_quest_tags(session: SessionDep, quest_id: uuid.UUID) -> Any:
    """
    Get quest's tags.
    """
    quest_tags = crud.get_quest_tags(session=session, quest_id=quest_id)
    return QuestTagsPublic(data=quest_tags, count=len(quest_tags))


@router.post("/quests/{quest_id}", response_model=QuestTagPublic)
def create_quest_tag(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
    quest_tag_in: QuestTagCreate
) -> Any:
    """
    Add a tag to a quest (quest creator only).
    """
    # Check if quest exists and user owns it
    from app.models.quest import Quest
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only quest creator can manage quest tags")
    
    # Check if tag exists
    tag = crud.get_tag(session=session, tag_id=quest_tag_in.tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if quest already has this tag
    existing = crud.get_quest_tag(
        session=session, quest_id=quest_id, tag_id=quest_tag_in.tag_id
    )
    if existing:
        raise HTTPException(status_code=400, detail="Quest already has this tag")
    
    quest_tag = crud.create_quest_tag(
        session=session, quest_tag_in=quest_tag_in, quest_id=quest_id
    )
    return quest_tag


@router.put("/quests/{quest_id}/{tag_id}", response_model=QuestTagPublic)
def update_quest_tag(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
    tag_id: uuid.UUID,
    quest_tag_in: QuestTagUpdate
) -> Any:
    """
    Update quest's tag relationship (quest creator only).
    """
    # Check if quest exists and user owns it
    from app.models.quest import Quest
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only quest creator can manage quest tags")
    
    quest_tag = crud.get_quest_tag(
        session=session, quest_id=quest_id, tag_id=tag_id
    )
    if not quest_tag:
        raise HTTPException(status_code=404, detail="Quest tag not found")
    
    updated_quest_tag = crud.update_quest_tag(
        session=session, db_quest_tag=quest_tag, quest_tag_in=quest_tag_in
    )
    return updated_quest_tag


@router.delete("/quests/{quest_id}/{tag_id}")
def delete_quest_tag(
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
    tag_id: uuid.UUID,
) -> Message:
    """
    Remove a tag from a quest (quest creator only).
    """
    # Check if quest exists and user owns it
    from app.models.quest import Quest
    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    if quest.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only quest creator can manage quest tags")
    
    quest_tag = crud.get_quest_tag(
        session=session, quest_id=quest_id, tag_id=tag_id
    )
    if not quest_tag:
        raise HTTPException(status_code=404, detail="Quest tag not found")
    
    crud.delete_quest_tag(
        session=session, quest_id=quest_id, tag_id=tag_id
    )
    return Message(message="Tag removed from quest")