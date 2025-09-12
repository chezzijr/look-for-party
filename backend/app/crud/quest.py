import uuid

from sqlmodel import Session, select

from app.models import Quest, QuestCreate, QuestStatus, QuestUpdate


def create_quest(
    *, session: Session, quest_in: QuestCreate, creator_id: uuid.UUID
) -> Quest:
    db_quest = Quest.model_validate(quest_in, update={"creator_id": creator_id})
    session.add(db_quest)
    session.commit()
    session.refresh(db_quest)
    return db_quest


def get_quest(*, session: Session, quest_id: uuid.UUID) -> Quest | None:
    statement = select(Quest).where(Quest.id == quest_id)
    return session.exec(statement).first()


def get_quests(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    status: QuestStatus | None = None,
) -> list[Quest]:
    statement = select(Quest)
    if status:
        statement = statement.where(Quest.status == status)
    statement = statement.offset(skip).limit(limit).order_by(Quest.created_at.desc())
    return list(session.exec(statement).all())


def get_quests_by_creator(
    *, session: Session, creator_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Quest]:
    statement = (
        select(Quest)
        .where(Quest.creator_id == creator_id)
        .offset(skip)
        .limit(limit)
        .order_by(Quest.created_at.desc())
    )
    return list(session.exec(statement).all())


def update_quest(*, session: Session, db_quest: Quest, quest_in: QuestUpdate) -> Quest:
    quest_data = quest_in.model_dump(exclude_unset=True)
    db_quest.sqlmodel_update(quest_data)
    session.add(db_quest)
    session.commit()
    session.refresh(db_quest)
    return db_quest


def delete_quest(*, session: Session, quest_id: uuid.UUID) -> bool:
    quest = get_quest(session=session, quest_id=quest_id)
    if quest:
        session.delete(quest)
        session.commit()
        return True
    return False
