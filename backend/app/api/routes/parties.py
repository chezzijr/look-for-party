import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    PartiesPublic,
    PartyCreate,
    PartyMemberCreate,
    PartyMemberPublic,
    PartyMembersPublic,
    PartyMemberUpdate,
    PartyPublic,
    PartyUpdate,
)

router = APIRouter(prefix="/parties", tags=["parties"])


@router.post("/", response_model=PartyPublic)
def create_party(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    party_in: PartyCreate,
) -> Any:
    """
    Create party for a quest (quest creator only).
    """
    # Check if quest exists
    quest = crud.get_quest(session=session, quest_id=party_in.quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if current user is the creator
    if quest.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="Only quest creator can form a party"
        )

    # Check if party already exists
    existing_party = crud.get_party_by_quest(
        session=session, quest_id=party_in.quest_id
    )
    if existing_party:
        raise HTTPException(
            status_code=400, detail="Party already exists for this quest"
        )

    party = crud.create_party(session=session, party_in=party_in)

    # Add the quest creator as the first member and leader
    member_create = PartyMemberCreate(user_id=current_user.id, role="OWNER")
    crud.create_party_member(
        session=session, member_in=member_create, party_id=party.id
    )

    return party


@router.get("/my", response_model=PartiesPublic)
def read_my_parties(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get current user's party memberships.
    """
    memberships = crud.get_user_party_memberships(
        session=session, user_id=current_user.id
    )
    parties = [membership.party for membership in memberships]
    return PartiesPublic(data=parties, count=len(parties))


@router.get("/{party_id}", response_model=PartyPublic)
def read_party(session: SessionDep, party_id: uuid.UUID) -> Any:
    """
    Get party by ID.
    """
    party = crud.get_party(session=session, party_id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    return party


@router.put("/{party_id}", response_model=PartyPublic)
def update_party(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    party_id: uuid.UUID,
    party_in: PartyUpdate,
) -> Any:
    """
    Update party (party leaders and quest creator only).
    """
    party = crud.get_party(session=session, party_id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    # Check permissions - quest creator or party leader
    quest = crud.get_quest(session=session, quest_id=party.quest_id)
    is_creator = quest and quest.creator_id == current_user.id

    # Check if user is a party leader
    members = crud.get_party_members(session=session, party_id=party_id)
    is_leader = any(m.user_id == current_user.id and m.role in ["OWNER", "MODERATOR"] for m in members)

    if not is_creator and not is_leader and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    party = crud.update_party(session=session, db_party=party, party_in=party_in)
    return party


# Party Member endpoints
@router.get("/{party_id}/members", response_model=PartyMembersPublic)
def read_party_members(
    session: SessionDep,
    party_id: uuid.UUID,
    active_only: bool = Query(default=True),
) -> Any:
    """
    Get party members.
    """
    party = crud.get_party(session=session, party_id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    members = crud.get_party_members(
        session=session, party_id=party_id, active_only=active_only
    )
    return PartyMembersPublic(data=members, count=len(members))


@router.post("/{party_id}/members", response_model=PartyMemberPublic)
def add_party_member(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    party_id: uuid.UUID,
    member_in: PartyMemberCreate,
) -> Any:
    """
    Add member to party (party leaders and quest creator only).
    """
    party = crud.get_party(session=session, party_id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    # Check permissions - quest creator or party leader
    quest = crud.get_quest(session=session, quest_id=party.quest_id)
    is_creator = quest and quest.creator_id == current_user.id

    members = crud.get_party_members(session=session, party_id=party_id)
    is_leader = any(m.user_id == current_user.id and m.role in ["OWNER", "MODERATOR"] for m in members)

    if not is_creator and not is_leader and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if user is already a member
    existing_member = any(
        m.user_id == member_in.user_id and m.status == "active" for m in members
    )
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a party member")

    # Check party size limits
    if quest:
        active_count = len([m for m in members if m.status == "active"])
        if active_count >= quest.party_size_max:
            raise HTTPException(status_code=400, detail="Party is at maximum capacity")

    member = crud.create_party_member(
        session=session, member_in=member_in, party_id=party_id
    )
    return member


@router.put("/{party_id}/members/{member_id}", response_model=PartyMemberPublic)
def update_party_member(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    party_id: uuid.UUID,
    member_id: uuid.UUID,
    member_in: PartyMemberUpdate,
) -> Any:
    """
    Update party member (party leaders, quest creator, or the member themselves).
    """
    party = crud.get_party(session=session, party_id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    member = crud.get_party_member(session=session, member_id=member_id)
    if not member or member.party_id != party_id:
        raise HTTPException(status_code=404, detail="Party member not found")

    # Check permissions
    quest = crud.get_quest(session=session, quest_id=party.quest_id)
    is_creator = quest and quest.creator_id == current_user.id
    is_self = member.user_id == current_user.id

    members = crud.get_party_members(session=session, party_id=party_id)
    is_leader = any(m.user_id == current_user.id and m.role in ["OWNER", "MODERATOR"] for m in members)

    # Role changes to leadership roles can only be done by quest creator or existing leaders
    if member_in.role is not None and member_in.role in ["OWNER", "MODERATOR"]:
        if not is_creator and not is_leader and not current_user.is_superuser:
            raise HTTPException(
                status_code=403, detail="Not enough permissions to change leadership"
            )

    # Role changes can be done by leaders, creator, or the member themselves
    if member_in.role is not None:
        if (
            not is_creator
            and not is_leader
            and not is_self
            and not current_user.is_superuser
        ):
            raise HTTPException(
                status_code=403, detail="Not enough permissions to change role"
            )

    member = crud.update_party_member(
        session=session, db_member=member, member_in=member_in
    )
    return member


@router.delete("/{party_id}/members/{member_id}")
def remove_party_member(
    session: SessionDep,
    current_user: CurrentUser,
    party_id: uuid.UUID,
    member_id: uuid.UUID,
) -> Message:
    """
    Remove member from party (party leaders, quest creator, or the member themselves).
    """
    party = crud.get_party(session=session, party_id=party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    member = crud.get_party_member(session=session, member_id=member_id)
    if not member or member.party_id != party_id:
        raise HTTPException(status_code=404, detail="Party member not found")

    # Check permissions
    quest = crud.get_quest(session=session, quest_id=party.quest_id)
    is_creator = quest and quest.creator_id == current_user.id
    is_self = member.user_id == current_user.id

    members = crud.get_party_members(session=session, party_id=party_id)
    is_leader = any(m.user_id == current_user.id and m.role in ["OWNER", "MODERATOR"] for m in members)

    if (
        not is_creator
        and not is_leader
        and not is_self
        and not current_user.is_superuser
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if trying to remove the quest creator (not allowed)
    if quest and member.user_id == quest.creator_id:
        raise HTTPException(
            status_code=400, detail="Cannot remove quest creator from party"
        )

    crud.remove_party_member(session=session, member_id=member_id)
    return Message(message="Party member removed successfully")
