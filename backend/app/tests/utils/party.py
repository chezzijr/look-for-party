import uuid

from sqlmodel import Session

from app.models import Party, PartyMember


def create_random_party(db: Session, quest_id: uuid.UUID | None = None) -> Party:
    from app.tests.utils.factories import create_party

    return create_party(db, quest_id=quest_id)


def create_random_party_member(
    db: Session,
    party_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    is_leader: bool = False,
) -> PartyMember:
    from app.tests.utils.factories import create_party_member

    return create_party_member(
        db, party_id=party_id, user_id=user_id, is_leader=is_leader
    )


# Re-export factories for backward compatibility
def PartyFactory():
    from app.tests.utils.factories import PartyCreateFactory

    return PartyCreateFactory()


def PartyMemberFactory():
    from app.tests.utils.factories import PartyMemberCreateFactory

    return PartyMemberCreateFactory()
