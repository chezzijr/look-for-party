import uuid

from sqlmodel import Session, select

from app.models import PartyMember, PartyMemberCreate, PartyMemberUpdate


def create_party_member(
    *, session: Session, member_in: PartyMemberCreate, party_id: uuid.UUID
) -> PartyMember:
    db_member = PartyMember.model_validate(member_in, update={"party_id": party_id})
    session.add(db_member)
    session.commit()
    session.refresh(db_member)
    return db_member


def get_party_member(*, session: Session, member_id: uuid.UUID) -> PartyMember | None:
    statement = select(PartyMember).where(PartyMember.id == member_id)
    return session.exec(statement).first()


def get_party_members(
    *, session: Session, party_id: uuid.UUID, active_only: bool = True
) -> list[PartyMember]:
    statement = select(PartyMember).where(PartyMember.party_id == party_id)
    if active_only:
        statement = statement.where(PartyMember.status == "active")
    statement = statement.order_by(PartyMember.joined_at)
    return list(session.exec(statement).all())


def get_user_party_memberships(
    *, session: Session, user_id: uuid.UUID, active_only: bool = True
) -> list[PartyMember]:
    statement = select(PartyMember).where(PartyMember.user_id == user_id)
    if active_only:
        statement = statement.where(PartyMember.status == "active")
    statement = statement.order_by(PartyMember.joined_at.desc())
    return list(session.exec(statement).all())


def update_party_member(
    *, session: Session, db_member: PartyMember, member_in: PartyMemberUpdate
) -> PartyMember:
    member_data = member_in.model_dump(exclude_unset=True)
    db_member.sqlmodel_update(member_data)
    session.add(db_member)
    session.commit()
    session.refresh(db_member)
    return db_member


def remove_party_member(*, session: Session, member_id: uuid.UUID) -> bool:
    member = get_party_member(session=session, member_id=member_id)
    if member:
        from datetime import datetime

        member.status = "inactive"
        member.left_at = datetime.utcnow()
        session.add(member)
        session.commit()
        return True
    return False
