import uuid

from sqlmodel import Session

from app import crud
from app.models import (
    QuestStatus,
    QuestUpdate,
)
from app.tests.utils.quest import QuestFactory
from app.tests.utils.user import create_random_user
from app.tests.utils.utils import random_lower_string


def test_create_quest(db: Session) -> None:
    creator = create_random_user(db)
    quest_in = QuestFactory()
    quest = crud.create_quest(session=db, quest_in=quest_in, creator_id=creator.id)

    assert quest.title == quest_in.title
    assert quest.description == quest_in.description
    assert quest.creator_id == creator.id
    assert quest.status == QuestStatus.RECRUITING


def test_get_quest(db: Session) -> None:
    creator = create_random_user(db)
    quest_in = QuestFactory()
    quest = crud.create_quest(session=db, quest_in=quest_in, creator_id=creator.id)

    stored_quest = crud.get_quest(session=db, quest_id=quest.id)
    assert stored_quest
    assert stored_quest.id == quest.id
    assert stored_quest.title == quest.title


def test_get_quest_not_found(db: Session) -> None:
    quest_id = uuid.uuid4()
    quest = crud.get_quest(session=db, quest_id=quest_id)
    assert quest is None


def test_get_quests(db: Session) -> None:
    creator1 = create_random_user(db)
    creator2 = create_random_user(db)

    quest1 = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator1.id
    )
    quest2 = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator2.id
    )

    quests = crud.get_quests(session=db)
    assert len(quests) >= 2

    quest_ids = [q.id for q in quests]
    assert quest1.id in quest_ids
    assert quest2.id in quest_ids


def test_get_quests_with_status_filter(db: Session) -> None:
    creator = create_random_user(db)

    # Create recruiting quest
    quest_recruiting = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator.id
    )

    # Create completed quest
    quest_completed_data = QuestFactory()
    quest_completed = crud.create_quest(
        session=db, quest_in=quest_completed_data, creator_id=creator.id
    )
    crud.update_quest(
        session=db,
        db_quest=quest_completed,
        quest_in=QuestUpdate(status=QuestStatus.COMPLETED),
    )

    # Filter by recruiting status
    recruiting_quests = crud.get_quests(session=db, status=QuestStatus.RECRUITING)
    recruiting_ids = [q.id for q in recruiting_quests]
    assert quest_recruiting.id in recruiting_ids
    assert quest_completed.id not in recruiting_ids


def test_get_quests_by_creator(db: Session) -> None:
    creator1 = create_random_user(db)
    creator2 = create_random_user(db)

    quest1 = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator1.id
    )
    quest2 = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator1.id
    )
    quest3 = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator2.id
    )

    creator1_quests = crud.get_quests_by_creator(session=db, creator_id=creator1.id)
    creator1_quest_ids = [q.id for q in creator1_quests]

    assert quest1.id in creator1_quest_ids
    assert quest2.id in creator1_quest_ids
    assert quest3.id not in creator1_quest_ids


def test_update_quest(db: Session) -> None:
    creator = create_random_user(db)
    quest = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator.id
    )

    new_title = random_lower_string()
    quest_update = QuestUpdate(title=new_title, status=QuestStatus.IN_PROGRESS)

    updated_quest = crud.update_quest(session=db, db_quest=quest, quest_in=quest_update)

    assert updated_quest.id == quest.id
    assert updated_quest.title == new_title
    assert updated_quest.status == QuestStatus.IN_PROGRESS
    assert updated_quest.creator_id == creator.id


def test_delete_quest(db: Session) -> None:
    creator = create_random_user(db)
    quest = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator.id
    )

    quest_id = quest.id
    deleted = crud.delete_quest(session=db, quest_id=quest_id)
    assert deleted is True

    # Verify quest is deleted
    deleted_quest = crud.get_quest(session=db, quest_id=quest_id)
    assert deleted_quest is None


def test_delete_quest_not_found(db: Session) -> None:
    quest_id = uuid.uuid4()
    deleted = crud.delete_quest(session=db, quest_id=quest_id)
    assert deleted is False
