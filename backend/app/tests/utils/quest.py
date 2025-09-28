import uuid
from typing import Any

from sqlmodel import Session

from app.models import (
    Quest,
    QuestApplication,
    QuestApplicationCreate,
    QuestCreate,
)
from app.tests.utils.factories import (
    QuestApplicationCreateFactory,
    QuestCreateFactory,
    create_quest,
    create_quest_application,
)


def create_random_quest(
    db: Session,
    creator_id: uuid.UUID | None = None,
    party_id: uuid.UUID | None = None,
    **kwargs: Any,
) -> Quest:
    return create_quest(db, creator_id=creator_id, party_id=party_id, **kwargs)


def create_random_quest_application(
    db: Session,
    quest_id: uuid.UUID | None = None,
    applicant_id: uuid.UUID | None = None,
) -> QuestApplication:
    return create_quest_application(db, quest_id=quest_id, applicant_id=applicant_id)


# Re-export factories for backward compatibility
def QuestFactory() -> QuestCreate:
    return QuestCreateFactory()


def QuestApplicationFactory() -> QuestApplicationCreate:
    return QuestApplicationCreateFactory()
