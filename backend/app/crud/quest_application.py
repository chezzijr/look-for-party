import uuid

from sqlmodel import Session, select

from app.models import (
    ApplicationStatus,
    QuestApplication,
    QuestApplicationCreate,
    QuestApplicationUpdate,
)


def create_quest_application(
    *,
    session: Session,
    application_in: QuestApplicationCreate,
    quest_id: uuid.UUID,
    applicant_id: uuid.UUID,
) -> QuestApplication:
    db_application = QuestApplication.model_validate(
        application_in, update={"quest_id": quest_id, "applicant_id": applicant_id}
    )
    session.add(db_application)
    session.commit()
    session.refresh(db_application)
    return db_application


def get_quest_application(
    *, session: Session, application_id: uuid.UUID
) -> QuestApplication | None:
    statement = select(QuestApplication).where(QuestApplication.id == application_id)
    return session.exec(statement).first()


def get_quest_applications(
    *, session: Session, quest_id: uuid.UUID, status: ApplicationStatus | None = None
) -> list[QuestApplication]:
    statement = select(QuestApplication).where(QuestApplication.quest_id == quest_id)
    if status:
        statement = statement.where(QuestApplication.status == status)
    statement = statement.order_by(QuestApplication.applied_at.desc())
    return list(session.exec(statement).all())


def get_user_applications(
    *,
    session: Session,
    applicant_id: uuid.UUID,
    status: ApplicationStatus | None = None,
) -> list[QuestApplication]:
    statement = select(QuestApplication).where(
        QuestApplication.applicant_id == applicant_id
    )
    if status:
        statement = statement.where(QuestApplication.status == status)
    statement = statement.order_by(QuestApplication.applied_at.desc())
    return list(session.exec(statement).all())


def update_quest_application(
    *,
    session: Session,
    db_application: QuestApplication,
    application_in: QuestApplicationUpdate,
) -> QuestApplication:
    from datetime import datetime

    application_data = application_in.model_dump(exclude_unset=True)

    # Always update the updated_at field
    application_data["updated_at"] = datetime.utcnow()

    # Set reviewed_at timestamp when status changes to approved/rejected
    if application_data.get("status") in [
        ApplicationStatus.APPROVED,
        ApplicationStatus.REJECTED,
    ]:
        application_data["reviewed_at"] = datetime.utcnow()

    db_application.sqlmodel_update(application_data)
    session.add(db_application)
    session.commit()
    session.refresh(db_application)
    return db_application
