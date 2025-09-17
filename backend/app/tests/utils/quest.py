import uuid

from sqlmodel import Session

from app.models import Quest, QuestApplication


def create_random_quest(
    db: Session, creator_id: uuid.UUID | None = None, party_id: uuid.UUID | None = None
) -> Quest:
    from app.tests.utils.factories import create_quest

    return create_quest(db, creator_id=creator_id, party_id=party_id)


def create_random_quest_application(
    db: Session,
    quest_id: uuid.UUID | None = None,
    applicant_id: uuid.UUID | None = None,
) -> QuestApplication:
    from app.tests.utils.factories import create_quest_application

    return create_quest_application(db, quest_id=quest_id, applicant_id=applicant_id)


# Re-export factories for backward compatibility
def QuestFactory():
    from app.tests.utils.factories import QuestCreateFactory

    return QuestCreateFactory()


def QuestApplicationFactory():
    from app.tests.utils.factories import QuestApplicationCreateFactory

    return QuestApplicationCreateFactory()
