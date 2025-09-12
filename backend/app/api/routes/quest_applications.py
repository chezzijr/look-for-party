import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    ApplicationStatus,
    Message,
    QuestApplicationCreate,
    QuestApplicationPublic,
    QuestApplicationsPublic,
    QuestApplicationUpdate,
    QuestStatus,
)

router = APIRouter(prefix="/quest-applications", tags=["quest-applications"])


@router.post("/quests/{quest_id}/apply", response_model=QuestApplicationPublic)
def apply_to_quest(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
    application_in: QuestApplicationCreate,
) -> Any:
    """
    Apply to a quest.
    """
    # Check if quest exists
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Check if quest is accepting applications
    if quest.status != QuestStatus.RECRUITING:
        raise HTTPException(
            status_code=400, detail="Quest is not accepting applications"
        )

    # Check if user is not the creator
    if quest.creator_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot apply to your own quest")

    # Check if user already applied
    existing_applications = crud.get_user_applications(
        session=session, applicant_id=current_user.id
    )
    for app in existing_applications:
        if app.quest_id == quest_id and app.status in [
            ApplicationStatus.PENDING,
            ApplicationStatus.APPROVED,
        ]:
            raise HTTPException(status_code=400, detail="Already applied to this quest")

    application = crud.create_quest_application(
        session=session,
        application_in=application_in,
        quest_id=quest_id,
        applicant_id=current_user.id,
    )
    return application


@router.get("/my", response_model=QuestApplicationsPublic)
def read_my_applications(
    session: SessionDep,
    current_user: CurrentUser,
    status: ApplicationStatus | None = Query(default=None),
) -> Any:
    """
    Get current user's applications.
    """
    applications = crud.get_user_applications(
        session=session, applicant_id=current_user.id, status=status
    )
    return QuestApplicationsPublic(data=applications, count=len(applications))


@router.get("/quests/{quest_id}/applications", response_model=QuestApplicationsPublic)
def read_quest_applications(
    session: SessionDep,
    current_user: CurrentUser,
    quest_id: uuid.UUID,
    status: ApplicationStatus | None = Query(default=None),
) -> Any:
    """
    Get applications for a quest (quest creator only).
    """
    # Check if quest exists and user is the creator
    quest = crud.get_quest(session=session, quest_id=quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if quest.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    applications = crud.get_quest_applications(
        session=session, quest_id=quest_id, status=status
    )
    return QuestApplicationsPublic(data=applications, count=len(applications))


@router.get("/{application_id}", response_model=QuestApplicationPublic)
def read_application(
    session: SessionDep,
    current_user: CurrentUser,
    application_id: uuid.UUID,
) -> Any:
    """
    Get application by ID.
    """
    application = crud.get_quest_application(
        session=session, application_id=application_id
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check permissions - applicant or quest creator can view
    quest = crud.get_quest(session=session, quest_id=application.quest_id)
    if (
        application.applicant_id != current_user.id
        and quest
        and quest.creator_id != current_user.id
        and not current_user.is_superuser
    ):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return application


@router.put("/{application_id}", response_model=QuestApplicationPublic)
def update_application(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    application_id: uuid.UUID,
    application_in: QuestApplicationUpdate,
) -> Any:
    """
    Update application (approve/reject by quest creator, or edit by applicant).
    """
    application = crud.get_quest_application(
        session=session, application_id=application_id
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    quest = crud.get_quest(session=session, quest_id=application.quest_id)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    # Determine permissions based on what's being updated
    is_creator = quest.creator_id == current_user.id
    is_applicant = application.applicant_id == current_user.id

    # Status changes (approve/reject) can only be done by quest creator
    if application_in.status is not None:
        if not is_creator and not current_user.is_superuser:
            raise HTTPException(
                status_code=403,
                detail="Only quest creator can change application status",
            )

        # Can only change from pending
        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=400, detail="Can only approve/reject pending applications"
            )

    # Message/role changes can only be done by applicant (and only if pending)
    if application_in.message is not None or application_in.proposed_role is not None:
        if not is_applicant and not current_user.is_superuser:
            raise HTTPException(
                status_code=403, detail="Only applicant can edit application details"
            )

        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=400, detail="Can only edit pending applications"
            )

    application = crud.update_quest_application(
        session=session, db_application=application, application_in=application_in
    )
    return application


@router.delete("/{application_id}")
def withdraw_application(
    session: SessionDep,
    current_user: CurrentUser,
    application_id: uuid.UUID,
) -> Message:
    """
    Withdraw application (applicant only).
    """
    application = crud.get_quest_application(
        session=session, application_id=application_id
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check permissions - only applicant can withdraw
    if application.applicant_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Can only withdraw pending applications
    if application.status != ApplicationStatus.PENDING:
        raise HTTPException(
            status_code=400, detail="Can only withdraw pending applications"
        )

    # Update status to withdrawn
    application_update = QuestApplicationUpdate(status=ApplicationStatus.WITHDRAWN)
    crud.update_quest_application(
        session=session, db_application=application, application_in=application_update
    )
    return Message(message="Application withdrawn successfully")
