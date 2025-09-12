import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import ApplicationStatus
from app.tests.utils.quest import QuestApplicationFactory, create_random_quest
from app.tests.utils.user import create_random_user


def test_apply_to_quest(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
    quest_application_data: dict,
) -> None:
    # Create a quest with different user
    creator = create_random_user(db)
    quest = create_random_quest(db, creator_id=creator.id)

    # Apply to quest
    # application_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quest-applications/quests/{quest.id}/apply",
        headers=normal_user_token_headers,
        json=quest_application_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == quest_application_data["message"]
    assert content["quest_id"] == str(quest.id)
    assert content["status"] == ApplicationStatus.PENDING


def test_apply_to_quest_not_found(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    quest_application_data: dict,
) -> None:
    quest_id = uuid.uuid4()
    # application_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/apply",
        headers=normal_user_token_headers,
        json=quest_application_data,
    )
    assert response.status_code == 404


def test_apply_to_own_quest(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
    quest_application_data: dict,
) -> None:
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me", headers=normal_user_token_headers
    )
    user_id = user_response.json()["id"]

    # Create quest as current user
    quest = create_random_quest(db, creator_id=uuid.UUID(user_id))

    # Try to apply to own quest
    # application_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quest-applications/quests/{quest.id}/apply",
        headers=normal_user_token_headers,
        json=quest_application_data,
    )
    assert response.status_code == 400
    assert "own quest" in response.json()["detail"]


def test_apply_to_quest_twice(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
    quest_application_data: dict,
) -> None:
    # Create a quest with different user
    creator = create_random_user(db)
    quest = create_random_quest(db, creator_id=creator.id)

    # Apply to quest first time
    # application_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quest-applications/quests/{quest.id}/apply",
        headers=normal_user_token_headers,
        json=quest_application_data,
    )
    assert response.status_code == 200

    # Try to apply again
    response = client.post(
        f"{settings.API_V1_STR}/quest-applications/quests/{quest.id}/apply",
        headers=normal_user_token_headers,
        json=quest_application_data,
    )
    assert response.status_code == 400
    assert "already applied" in response.json()["detail"].lower()


def test_read_my_applications(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
    quest_application_data: dict,
) -> None:
    # Create quest and apply to it
    creator = create_random_user(db)
    quest = create_random_quest(db, creator_id=creator.id)

    # application_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quest-applications/quests/{quest.id}/apply",
        headers=normal_user_token_headers,
        json=quest_application_data,
    )
    application = response.json()

    # Read my applications
    response = client.get(
        f"{settings.API_V1_STR}/quest-applications/my",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 1

    application_ids = [app["id"] for app in content["data"]]
    assert application["id"] in application_ids


def test_read_quest_applications_as_creator(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
    quest_data: dict,
) -> None:
    # Create quest as superuser
    # quest_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    # Create an applicant and apply to quest
    applicant = create_random_user(db)
    # application_data provided by fixture
    application = crud.create_quest_application(
        session=db,
        application_in=QuestApplicationFactory(),
        quest_id=uuid.UUID(quest["id"]),
        applicant_id=applicant.id,
    )

    # Read applications as quest creator
    response = client.get(
        f"{settings.API_V1_STR}/quest-applications/quests/{quest['id']}/applications",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 1

    application_ids = [app["id"] for app in content["data"]]
    assert str(application.id) in application_ids


def test_read_quest_applications_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Create quest with different user
    creator = create_random_user(db)
    quest = create_random_quest(db, creator_id=creator.id)

    # Try to read applications as non-creator
    response = client.get(
        f"{settings.API_V1_STR}/quest-applications/quests/{quest.id}/applications",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403


def test_approve_application(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
    quest_data: dict,
) -> None:
    # Create quest as superuser
    # quest_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    # Create an applicant and apply to quest
    applicant = create_random_user(db)
    application = crud.create_quest_application(
        session=db,
        application_in=QuestApplicationFactory(),
        quest_id=uuid.UUID(quest["id"]),
        applicant_id=applicant.id,
    )

    # Approve application as quest creator
    update_data = {
        "status": ApplicationStatus.APPROVED,
        "reviewer_feedback": "Great application!",
    }
    response = client.put(
        f"{settings.API_V1_STR}/quest-applications/{application.id}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == ApplicationStatus.APPROVED
    assert content["reviewer_feedback"] == "Great application!"


def test_withdraw_application(
    client: TestClient,
    normal_user_token_headers: dict[str, str],
    db: Session,
    quest_application_data: dict,
) -> None:
    # Create quest and apply to it
    creator = create_random_user(db)
    quest = create_random_quest(db, creator_id=creator.id)

    # application_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quest-applications/quests/{quest.id}/apply",
        headers=normal_user_token_headers,
        json=quest_application_data,
    )
    application = response.json()

    # Withdraw application
    response = client.delete(
        f"{settings.API_V1_STR}/quest-applications/{application['id']}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    # Verify application is withdrawn
    response = client.get(
        f"{settings.API_V1_STR}/quest-applications/{application['id']}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == ApplicationStatus.WITHDRAWN
