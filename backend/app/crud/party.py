import uuid

from sqlmodel import Session, select

from app.models import Party, PartyCreate, PartyUpdate


def create_party(*, session: Session, party_in: PartyCreate) -> Party:
    db_party = Party.model_validate(party_in)
    session.add(db_party)
    session.commit()
    session.refresh(db_party)
    return db_party


def get_party(*, session: Session, party_id: uuid.UUID) -> Party | None:
    statement = select(Party).where(Party.id == party_id)
    return session.exec(statement).first()


def get_party_by_quest(*, session: Session, quest_id: uuid.UUID) -> Party | None:
    statement = select(Party).where(Party.quest_id == quest_id)
    return session.exec(statement).first()


def update_party(*, session: Session, db_party: Party, party_in: PartyUpdate) -> Party:
    party_data = party_in.model_dump(exclude_unset=True)
    db_party.sqlmodel_update(party_data)
    session.add(db_party)
    session.commit()
    session.refresh(db_party)
    return db_party
