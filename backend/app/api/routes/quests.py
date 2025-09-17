import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Party,
    PartyMember,
    PartyMemberRole,
    Quest,
    QuestCategory,
    QuestCreate,
    QuestMemberAssignmentRequest,
    QuestPublic,
    QuestPublicizeRequest,
    QuestsPublic,
    QuestStatus,
    QuestType,
    QuestUpdate,
)

router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("/", response_model=QuestsPublic)
def read_quests(
    session: SessionDep,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=100),
    status: QuestStatus | None = Query(default=None),
    category: QuestCategory | None = Query(default=None),
) -> Any:
    """
    Retrieve quests.
    """
    count_statement = select(func.count()).select_from(Quest)
    if status:
        count_statement = count_statement.where(Quest.status == status)
    if category:
        count_statement = count_statement.where(Quest.category == category)
    count = session.exec(count_statement).one()

    statement = (
        select(Quest).offset(skip).limit(limit).order_by(Quest.created_at.desc())
    )
    if status:
        statement = statement.where(Quest.status == status)
    if category:
        statement = statement.where(Quest.category == category)

    quests = session.exec(statement).all()
    return QuestsPublic(data=quests, count=count)


@router.get("/my", response_model=QuestsPublic)
def read_my_quests(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, le=100),
) -> Any:
    """
    Retrieve current user's quests.
    """
    count_statement = (
        select(func.count())
        .select_from(Quest)
        .where(Quest.creator_id == current_user.id)
    )
    count = session.exec(count_statement).one()

    quests = crud.get_quests_by_creator(
        session=session, creator_id=current_user.id, skip=skip, limit=limit
    )
    return QuestsPublic(data=quests, count=count)


@router.post("/", response_model=QuestPublic)
def create_quest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_in: QuestCreate,
) -> Any:
    """
    Create new quest.
    """
    # Validate party size
    if quest_in.party_size_min > quest_in.party_size_max:
        raise HTTPException(
            status_code=400,
            detail="Minimum party size cannot be greater than maximum party size",
        )

    # Validate timeline if provided
    from datetime import datetime

    # Check if starts_at is in the past
    if quest_in.starts_at:
        if quest_in.starts_at < datetime.utcnow():
            raise HTTPException(
                status_code=400, detail="Start date cannot be in the past"
            )

    # Check if deadline is after start date
    if quest_in.starts_at and quest_in.deadline:
        if quest_in.deadline <= quest_in.starts_at:
            raise HTTPException(
                status_code=400, detail="Deadline must be after start date"
            )

    quest = crud.create_quest(
        session=session, quest_in=quest_in, creator_id=current_user.id
    )
    return quest


@router.get("/{quest_id}", response_model=QuestPublic)
def read_quest(session: SessionDep, quest_id: uuid.UUID) -> Any:
    """
    Get quest by ID.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    return quest


@router.put("/{quest_id}", response_model=QuestPublic)
def update_quest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
    quest_in: QuestUpdate,
) -> Any:
    """
    Update quest.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if current user is the creator
    if quest.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Validate party size if being updated
    if quest_in.party_size_min is not None and quest_in.party_size_max is not None:
        if quest_in.party_size_min > quest_in.party_size_max:
            raise HTTPException(
                status_code=400,
                detail="Minimum party size cannot be greater than maximum party size",
            )

    # Validate timeline if being updated
    starts_at = (
        quest_in.starts_at if quest_in.starts_at is not None else quest.starts_at
    )
    deadline = quest_in.deadline if quest_in.deadline is not None else quest.deadline
    if starts_at and deadline and deadline <= starts_at:
        raise HTTPException(status_code=400, detail="Deadline must be after start date")

    quest = crud.update_quest(session=session, db_quest=quest, quest_in=quest_in)
    return quest


@router.delete("/{quest_id}")
def delete_quest(
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
) -> Message:
    """
    Delete quest.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if current user is the creator
    if quest.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    crud.delete_quest(session=session, quest_id=quest_id)
    return Message(message="Quest deleted successfully")


@router.post("/{quest_id}/publicize", response_model=QuestPublic)
def publicize_quest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
    publicize_request: QuestPublicizeRequest,
) -> Any:
    """
    Publicize an internal or hybrid quest to allow external applications.
    Only party owners/moderators can publicize party quests.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if quest can be publicized
    if quest.quest_type not in [QuestType.PARTY_INTERNAL, QuestType.PARTY_HYBRID]:
        raise HTTPException(
            status_code=400,
            detail="Only internal or hybrid party quests can be publicized",
        )

    if quest.is_publicized:
        raise HTTPException(status_code=400, detail="Quest is already publicized")

    # Check permissions - user must be party owner/moderator or quest creator
    if quest.parent_party_id:
        party_member = session.exec(
            select(PartyMember).where(
                PartyMember.party_id == quest.parent_party_id,
                PartyMember.user_id == current_user.id,
                PartyMember.status == "active",
            )
        ).first()

        if not party_member or party_member.role not in [
            PartyMemberRole.OWNER,
            PartyMemberRole.MODERATOR,
        ]:
            if quest.creator_id != current_user.id and not current_user.is_superuser:
                raise HTTPException(
                    status_code=403,
                    detail="Only party owners/moderators can publicize party quests",
                )

    # Update quest to publicize
    from datetime import datetime

    quest.public_slots = publicize_request.public_slots
    quest.visibility = publicize_request.visibility
    quest.is_publicized = True
    quest.publicized_at = datetime.utcnow()
    quest.updated_at = datetime.utcnow()

    session.add(quest)
    session.commit()
    session.refresh(quest)

    return quest


@router.post("/{quest_id}/assign-members", response_model=QuestPublic)
def assign_quest_members(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
    assignment_request: QuestMemberAssignmentRequest,
) -> Any:
    """
    Assign members to an internal party quest.
    Only party owners/moderators can assign members.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if quest is internal type
    if quest.quest_type != QuestType.PARTY_INTERNAL:
        raise HTTPException(
            status_code=400, detail="Can only assign members to internal party quests"
        )

    # Check permissions
    if quest.parent_party_id:
        party_member = session.exec(
            select(PartyMember).where(
                PartyMember.party_id == quest.parent_party_id,
                PartyMember.user_id == current_user.id,
                PartyMember.status == "active",
            )
        ).first()

        if not party_member or party_member.role not in [
            PartyMemberRole.OWNER,
            PartyMemberRole.MODERATOR,
        ]:
            if quest.creator_id != current_user.id and not current_user.is_superuser:
                raise HTTPException(
                    status_code=403,
                    detail="Only party owners/moderators can assign quest members",
                )

    # Validate that all assigned members are actually party members
    if quest.parent_party_id:
        party_member_ids = session.exec(
            select(PartyMember.user_id).where(
                PartyMember.party_id == quest.parent_party_id,
                PartyMember.status == "active",
            )
        ).all()

        invalid_members = set(assignment_request.assigned_member_ids) - set(
            party_member_ids
        )
        if invalid_members:
            raise HTTPException(
                status_code=400,
                detail=f"Members {invalid_members} are not active party members",
            )

    # Update quest with assigned members
    import json
    from datetime import datetime

    quest.assigned_member_ids = json.dumps(
        [str(uid) for uid in assignment_request.assigned_member_ids]
    )
    quest.updated_at = datetime.utcnow()

    session.add(quest)
    session.commit()
    session.refresh(quest)

    return quest


@router.post("/{quest_id}/close", response_model=QuestPublic)
def close_quest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
) -> Any:
    """
    Close a quest and handle party formation based on quest type.
    Only quest creators or party owners/moderators can close quests.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if quest can be closed
    if quest.status != QuestStatus.RECRUITING:
        raise HTTPException(
            status_code=400, detail="Only recruiting quests can be closed"
        )

    # Check permissions
    can_close = False

    # Quest creator can always close
    if quest.creator_id == current_user.id or current_user.is_superuser:
        can_close = True

    # Party owners/moderators can close party quests
    elif quest.parent_party_id:
        party_member = session.exec(
            select(PartyMember).where(
                PartyMember.party_id == quest.parent_party_id,
                PartyMember.user_id == current_user.id,
                PartyMember.status == "active",
            )
        ).first()

        if party_member and party_member.role in [
            PartyMemberRole.OWNER,
            PartyMemberRole.MODERATOR,
        ]:
            can_close = True

    if not can_close:
        raise HTTPException(
            status_code=403,
            detail="Only quest creators or party owners/moderators can close quests",
        )

    # Check minimum party size requirement before closing
    from app.models import ApplicationStatus, QuestApplication

    approved_count = session.exec(
        select(func.count())
        .select_from(QuestApplication)
        .where(
            QuestApplication.quest_id == quest.id,
            QuestApplication.status == ApplicationStatus.APPROVED,
        )
    ).one()

    total_party_size = approved_count + 1  # +1 for creator
    if total_party_size < quest.party_size_min:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot close quest: minimum party size of {quest.party_size_min} not met (current: {total_party_size})",
        )

    # Handle quest closure based on type
    from datetime import datetime

    if quest.quest_type == QuestType.INDIVIDUAL:
        # Create new party for individual quest
        party_data = Party(
            name=f"Party for {quest.title}",
            description=f"Party formed from quest: {quest.objective}",
            quest_id=quest.id,
        )
        session.add(party_data)
        session.flush()  # Get the party ID

        # Add quest creator as party owner
        creator_member = PartyMember(
            party_id=party_data.id,
            user_id=quest.creator_id,
            role=PartyMemberRole.OWNER,
        )
        session.add(creator_member)

        # Add all approved applicants as party members
        from app.models import ApplicationStatus, QuestApplication

        approved_applications = session.exec(
            select(QuestApplication).where(
                QuestApplication.quest_id == quest.id,
                QuestApplication.status == ApplicationStatus.APPROVED,
            )
        ).all()

        for app in approved_applications:
            member = PartyMember(
                party_id=party_data.id,
                user_id=app.applicant_id,
                role=PartyMemberRole.MEMBER,
            )
            session.add(member)

    elif quest.quest_type == QuestType.PARTY_EXPANSION:
        # Add approved applicants to existing party
        if quest.parent_party_id:
            from app.models import ApplicationStatus, QuestApplication

            approved_applications = session.exec(
                select(QuestApplication).where(
                    QuestApplication.quest_id == quest.id,
                    QuestApplication.status == ApplicationStatus.APPROVED,
                )
            ).all()

            for app in approved_applications:
                # Check if user is not already a party member
                existing_member = session.exec(
                    select(PartyMember).where(
                        PartyMember.party_id == quest.parent_party_id,
                        PartyMember.user_id == app.applicant_id,
                    )
                ).first()

                if not existing_member:
                    member = PartyMember(
                        party_id=quest.parent_party_id,
                        user_id=app.applicant_id,
                        role=PartyMemberRole.MEMBER,
                        status="active",
                    )
                    session.add(member)

    # elif quest.quest_type == QuestType.PARTY_INTERNAL:
    #     # Internal quests don't create or modify parties
    #     pass

    # Update quest status - quest moves to IN_PROGRESS when recruitment closes
    quest.status = QuestStatus.IN_PROGRESS
    quest.updated_at = datetime.utcnow()

    session.add(quest)
    session.commit()
    session.refresh(quest)

    return quest


@router.post("/{quest_id}/complete", response_model=QuestPublic)
def complete_quest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
) -> Any:
    """
    Mark a quest as completed.
    Only quest creators or party owners/moderators can complete quests.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if quest can be completed
    if quest.status != QuestStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=400, detail="Only in-progress quests can be completed"
        )

    # Check permissions
    can_complete = False

    # Quest creator can always complete
    if quest.creator_id == current_user.id or current_user.is_superuser:
        can_complete = True

    # Party owners/moderators can complete party quests
    elif quest.parent_party_id:
        party_member = session.exec(
            select(PartyMember).where(
                PartyMember.party_id == quest.parent_party_id,
                PartyMember.user_id == current_user.id,
                PartyMember.status == "active",
            )
        ).first()

        if party_member and party_member.role in [
            PartyMemberRole.OWNER,
            PartyMemberRole.MODERATOR,
        ]:
            can_complete = True

    if not can_complete:
        raise HTTPException(
            status_code=403,
            detail="Only quest creators or party owners/moderators can complete quests",
        )

    # Update quest status
    from datetime import datetime

    quest.status = QuestStatus.COMPLETED
    quest.completed_at = datetime.utcnow()
    quest.updated_at = datetime.utcnow()

    session.add(quest)
    session.commit()
    session.refresh(quest)

    return quest


@router.post("/{quest_id}/cancel", response_model=QuestPublic)
def cancel_quest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
) -> Any:
    """
    Cancel a quest.
    Only quest creators or party owners/moderators can cancel quests.
    Cancellation is allowed for RECRUITING or IN_PROGRESS quests.
    """
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if quest can be cancelled
    if quest.status not in [QuestStatus.RECRUITING, QuestStatus.IN_PROGRESS]:
        raise HTTPException(
            status_code=400,
            detail="Only recruiting or in-progress quests can be cancelled",
        )

    # Check permissions
    can_cancel = False

    # Quest creator can always cancel
    if quest.creator_id == current_user.id or current_user.is_superuser:
        can_cancel = True

    # Party owners/moderators can cancel party quests
    elif quest.parent_party_id:
        party_member = session.exec(
            select(PartyMember).where(
                PartyMember.party_id == quest.parent_party_id,
                PartyMember.user_id == current_user.id,
                PartyMember.status == "active",
            )
        ).first()

        if party_member and party_member.role in [
            PartyMemberRole.OWNER,
            PartyMemberRole.MODERATOR,
        ]:
            can_cancel = True

    if not can_cancel:
        raise HTTPException(
            status_code=403,
            detail="Only quest creators or party owners/moderators can cancel quests",
        )

    # Update quest status
    from datetime import datetime

    quest.status = QuestStatus.CANCELLED
    quest.updated_at = datetime.utcnow()

    session.add(quest)
    session.commit()
    session.refresh(quest)

    return quest
