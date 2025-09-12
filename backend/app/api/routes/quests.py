import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Quest,
    QuestCreate,
    QuestPublic,
    QuestUpdate,
    QuestsPublic,
    QuestStatus,
    QuestCategory,
    Message,
)

router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("/", response_model=QuestsPublic)
def read_quests(
    session: SessionDep,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=100),
    status: QuestStatus | None = Query(default=None),
    category: QuestCategory | None = Query(default=None),
) -> Any:
    """
    Retrieve quests.
    """
    count_statement = select(func.count()).select_from(Quest)
    if status:
        count_statement = count_statement.where(Quest.status == status)
    if category:
        count_statement = count_statement.where(Quest.category == category)
    count = session.exec(count_statement).one()

    statement = select(Quest).offset(skip).limit(limit).order_by(Quest.created_at.desc())
    if status:
        statement = statement.where(Quest.status == status)
    if category:
        statement = statement.where(Quest.category == category)
    
    quests = session.exec(statement).all()
    return QuestsPublic(data=quests, count=count)


@router.get("/my", response_model=QuestsPublic)
def read_my_quests(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=100),
) -> Any:
    """
    Retrieve current user's quests.
    """
    count_statement = select(func.count()).select_from(Quest).where(Quest.creator_id == current_user.id)
    count = session.exec(count_statement).one()

    quests = crud.get_quests_by_creator(
        session=session, creator_id=current_user.id, skip=skip, limit=limit
    )
    return QuestsPublic(data=quests, count=count)


@router.post("/", response_model=QuestPublic)
def create_quest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_in: QuestCreate,
) -> Any:
    """
    Create new quest.
    """
    # Validate party size
    if quest_in.party_size_min > quest_in.party_size_max:
        raise HTTPException(
            status_code=400,
            detail="Minimum party size cannot be greater than maximum party size"
        )
    
    # Validate timeline if provided
    if quest_in.starts_at and quest_in.deadline:
        if quest_in.deadline <= quest_in.starts_at:
            raise HTTPException(
                status_code=400,
                detail="Deadline must be after start date"
            )
    
    quest = crud.create_quest(
        session=session, quest_in=quest_in, creator_id=current_user.id
    )
    return quest


@router.get("/{quest_id}", response_model=QuestPublic)
def read_quest(
    session: SessionDep, quest_id: uuid.UUID
) -> Any:
    """
    Get quest by ID.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    return quest


@router.put("/{quest_id}", response_model=QuestPublic)
def update_quest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
    quest_in: QuestUpdate,
) -> Any:
    """
    Update quest.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Check if current user is the creator
    if quest.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Validate party size if being updated
    if quest_in.party_size_min is not None and quest_in.party_size_max is not None:
        if quest_in.party_size_min > quest_in.party_size_max:
            raise HTTPException(
                status_code=400,
                detail="Minimum party size cannot be greater than maximum party size"
            )
    
    # Validate timeline if being updated
    starts_at = quest_in.starts_at if quest_in.starts_at is not None else quest.starts_at
    deadline = quest_in.deadline if quest_in.deadline is not None else quest.deadline
    if starts_at and deadline and deadline <= starts_at:
        raise HTTPException(
            status_code=400,
            detail="Deadline must be after start date"
        )
    
    quest = crud.update_quest(session=session, db_quest=quest, quest_in=quest_in)
    return quest


@router.delete("/{quest_id}")
def delete_quest(
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
) -> Message:
    """
    Delete quest.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    # Check if current user is the creator
    if quest.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    crud.delete_quest(session=session, quest_id=quest_id)
    return Message(message="Quest deleted successfully")