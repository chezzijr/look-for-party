import uuid
from typing import Any, cast

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import InstrumentedAttribute, selectinload
from sqlmodel import col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    PartyMember,
    Quest,
    QuestMember,
    QuestMemberDetailedPublic,
    QuestMemberPublic,
    QuestMembersPublic,
    QuestMemberStatus,
    QuestMemberUpdate,
)
from app.models.user import User

router = APIRouter(prefix="/quest-members", tags=["quest-members"])


@router.get("/{quest_id}", response_model=QuestMembersPublic)
def read_quest_members(
    *, session: SessionDep, current_user: CurrentUser, quest_id: uuid.UUID
) -> Any:
    """Get all members of a quest."""
    # First verify quest exists and user has access
    from app.models import Quest

    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if user is quest creator, quest member, or party member (for party quests)
    user_has_access = False

    # User is quest creator
    if quest.creator_id == current_user.id:
        user_has_access = True

    # User is a quest member
    if not user_has_access:
        user_quest_member = session.exec(
            select(QuestMember).where(
                QuestMember.quest_id == quest_id,
                QuestMember.user_id == current_user.id,
                QuestMember.status == QuestMemberStatus.ACTIVE,
            )
        ).first()
        if user_quest_member:
            user_has_access = True

    # For party quests, check if user is party member
    if not user_has_access and quest.party_id:
        from app.models import PartyMember

        party_member = session.exec(
            select(PartyMember).where(
                PartyMember.party_id == quest.party_id,
                PartyMember.user_id == current_user.id,
                PartyMember.status == "active",
            )
        ).first()
        if party_member:
            user_has_access = True

    if not user_has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Get quest members
    quest_members = session.exec(
        select(QuestMember).where(QuestMember.quest_id == quest_id)
    ).all()

    return QuestMembersPublic(data=quest_members, count=len(quest_members))


@router.get("/{quest_id}/detailed", response_model=QuestMemberDetailedPublic)
def read_quest_members_detailed(
    *, session: SessionDep, current_user: CurrentUser, quest_id: uuid.UUID
) -> Any:
    """Get all members of a quest with detailed user information."""

    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    user_has_access = False

    if quest.creator_id == current_user.id:
        user_has_access = True

    if not user_has_access:
        user_quest_member = session.exec(
            select(QuestMember).where(
                QuestMember.quest_id == quest_id,
                QuestMember.user_id == current_user.id,
                QuestMember.status == QuestMemberStatus.ACTIVE,
            )
        ).first()
        if user_quest_member:
            user_has_access = True

    if not user_has_access and quest.party_id:
        from app.models import PartyMember

        party_member = session.exec(
            select(PartyMember).where(
                PartyMember.party_id == quest.party_id,
                PartyMember.user_id == current_user.id,
                PartyMember.status == "active",
            )
        ).first()
        if party_member:
            user_has_access = True

    if not user_has_access:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Get quest members with detailed information

    statement = (
        select(QuestMember)
        .options(
            selectinload(cast(InstrumentedAttribute[User], QuestMember.user)),
            selectinload(cast(InstrumentedAttribute[User], QuestMember.assigned_by)),
        )
        .where(QuestMember.quest_id == quest_id)
    )

    quest_members = session.exec(statement).all()

    return QuestMemberDetailedPublic(data=quest_members, count=len(quest_members))


@router.get("/{quest_id}/count")
def get_quest_members_count(
    *, session: SessionDep, current_user: CurrentUser, quest_id: uuid.UUID
) -> dict[str, int]:
    """Get count of quest members."""
    from app.models import Quest

    quest = session.get(Quest, quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Public quests can be viewed by anyone, private quests need access check
    if quest.visibility.value == "PRIVATE":
        user_has_access = False

        if quest.creator_id == current_user.id:
            user_has_access = True

        if not user_has_access:
            user_quest_member = session.exec(
                select(QuestMember).where(
                    QuestMember.quest_id == quest_id,
                    QuestMember.user_id == current_user.id,
                    QuestMember.status == QuestMemberStatus.ACTIVE,
                )
            ).first()
            if user_quest_member:
                user_has_access = True

        if not user_has_access and quest.party_id:
            from app.models import PartyMember

            party_member = session.exec(
                select(PartyMember).where(
                    PartyMember.party_id == quest.party_id,
                    PartyMember.user_id == current_user.id,
                    PartyMember.status == "active",
                )
            ).first()
            if party_member:
                user_has_access = True

        if not user_has_access:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    # Get count of active quest members
    count = session.exec(
        select(func.count(col(QuestMember.id))).where(
            QuestMember.quest_id == quest_id,
            QuestMember.status == QuestMemberStatus.ACTIVE,
        )
    ).one()

    return {"count": count}


@router.put("/{member_id}/status", response_model=QuestMemberPublic)
def update_quest_member_status(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    member_id: uuid.UUID,
    quest_member_update: QuestMemberUpdate,
) -> Any:
    """Update quest member status."""
    quest_member = session.get(QuestMember, member_id)
    if not quest_member:
        raise HTTPException(status_code=404, detail="Quest member not found")

    # Check permissions - user can update their own status, or quest creator/party owner can update others
    can_update = False

    # User can update their own status
    if quest_member.user_id == current_user.id:
        can_update = True

    # Quest creator can update member status
    if not can_update:
        from app.models import Quest

        quest = session.get(Quest, quest_member.quest_id)
        if quest and quest.creator_id == current_user.id:
            can_update = True

    # Party owner/moderator can update member status for party quests
    if not can_update:
        quest = session.get(Quest, quest_member.quest_id)
        if quest and quest.party_id:
            party_member = session.exec(
                select(PartyMember).where(
                    PartyMember.party_id == quest.party_id,
                    PartyMember.user_id == current_user.id,
                    PartyMember.status == "active",
                )
            ).first()
            if party_member and party_member.role in ["OWNER", "MODERATOR"]:
                can_update = True

    if not can_update:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Update quest member
    quest_member_data = quest_member_update.model_dump(exclude_unset=True)
    quest_member.sqlmodel_update(quest_member_data)

    # Set timestamps based on status change
    from datetime import datetime

    if quest_member_update.status == QuestMemberStatus.COMPLETED:
        quest_member.completed_at = datetime.utcnow()
    elif quest_member_update.status in [
        QuestMemberStatus.LEFT,
        QuestMemberStatus.REMOVED,
    ]:
        quest_member.left_at = datetime.utcnow()

    quest_member.updated_at = datetime.utcnow()
    session.add(quest_member)
    session.commit()
    session.refresh(quest_member)

    return quest_member


@router.delete("/{member_id}")
def remove_quest_member(
    *, session: SessionDep, current_user: CurrentUser, member_id: uuid.UUID
) -> dict[str, str]:
    """Remove a quest member."""
    quest_member = session.get(QuestMember, member_id)
    if not quest_member:
        raise HTTPException(status_code=404, detail="Quest member not found")

    # Check permissions - quest creator or party owner/moderator can remove members
    can_remove = False

    # Quest creator can remove members
    from app.models import Quest

    quest = session.get(Quest, quest_member.quest_id)
    if quest and quest.creator_id == current_user.id:
        can_remove = True

    # Party owner/moderator can remove members for party quests
    if not can_remove and quest and quest.party_id:
        from app.models import PartyMember

        party_member = session.exec(
            select(PartyMember).where(
                PartyMember.party_id == quest.party_id,
                PartyMember.user_id == current_user.id,
                PartyMember.status == "active",
            )
        ).first()
        if party_member and party_member.role in ["OWNER", "MODERATOR"]:
            can_remove = True

    # User can remove themselves
    if not can_remove and quest_member.user_id == current_user.id:
        can_remove = True

    if not can_remove:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Cannot remove quest creator
    if quest and quest_member.user_id == quest.creator_id:
        raise HTTPException(status_code=400, detail="Cannot remove quest creator")

    session.delete(quest_member)
    session.commit()

    return {"message": "Quest member removed successfully"}
