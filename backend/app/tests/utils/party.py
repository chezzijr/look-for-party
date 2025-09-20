import uuid

from sqlmodel import Session

from app.models import Party, PartyMember
from app.models.party import PartyCreate, PartyMemberCreate
from app.tests.utils.factories import (
    PartyCreateFactory,
    PartyMemberCreateFactory,
    create_party,
    create_party_member,
)


def create_random_party(db: Session, quest_id: uuid.UUID | None = None) -> Party:
    return create_party(db, quest_id=quest_id)


def create_random_party_member(
    db: Session,
    party_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    is_leader: bool = False,
) -> PartyMember:
    return create_party_member(
        db, party_id=party_id, user_id=user_id, is_leader=is_leader
    )


# Re-export factories for backward compatibility
def PartyFactory() -> PartyCreate:
    return PartyCreateFactory()


def PartyMemberFactory() -> PartyMemberCreate:
    return PartyMemberCreateFactory()
