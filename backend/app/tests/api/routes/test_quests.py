import uuid
from typing import Any

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import (
    QuestStatus,
)
from app.tests.utils.quest import QuestFactory
from app.tests.utils.user import create_random_user
from app.tests.utils.utils import random_lower_string


def test_create_quest(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    quest_data: dict[str, Any],
) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == quest_data["title"]
    assert content["description"] == quest_data["description"]
    assert content["status"] == QuestStatus.RECRUITING
    assert "id" in content
    assert "creator_id" in content
    assert "created_at" in content


def test_create_quest_invalid_party_size(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    quest_data: dict[str, Any],
) -> None:
    quest_data["party_size_min"] = 5
    quest_data["party_size_max"] = 3

    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    assert response.status_code == 400
    assert "party size" in response.json()["detail"].lower()


def test_read_quests(client: TestClient, db: Session) -> None:
    from app.models import QuestVisibility

    creator = create_random_user(db)
    # Create PUBLIC quests to ensure they appear in the public quest list
    quest_data_1 = QuestFactory()
    quest_data_1.visibility = QuestVisibility.PUBLIC
    crud.create_quest(session=db, quest_in=quest_data_1, creator_id=creator.id)

    quest_data_2 = QuestFactory()
    quest_data_2.visibility = QuestVisibility.PUBLIC
    crud.create_quest(session=db, quest_in=quest_data_2, creator_id=creator.id)

    response = client.get(f"{settings.API_V1_STR}/quests/")
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert content["count"] >= 2


def test_read_quests_with_status_filter(client: TestClient, db: Session) -> None:
    from app.models import QuestVisibility

    creator = create_random_user(db)
    # Create a PUBLIC quest to ensure it appears in the public quest list
    quest_data = QuestFactory()
    quest_data.visibility = QuestVisibility.PUBLIC
    quest = crud.create_quest(session=db, quest_in=quest_data, creator_id=creator.id)

    response = client.get(
        f"{settings.API_V1_STR}/quests/?status={QuestStatus.RECRUITING.value}"
    )
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]
    assert str(quest.id) in quest_ids


def test_read_quests_with_search_filter(client: TestClient, db: Session) -> None:
    from app.models import QuestVisibility

    creator = create_random_user(db)
    # Create a quest with specific title and description for search testing
    quest_data = QuestFactory()
    quest_data.visibility = QuestVisibility.PUBLIC
    quest_data.title = "Python Development Quest"
    quest_data.description = (
        "Looking for experienced Python developers to join our project"
    )
    quest = crud.create_quest(session=db, quest_in=quest_data, creator_id=creator.id)

    # Test search by title
    response = client.get(f"{settings.API_V1_STR}/quests/?search=Python")
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]
    assert str(quest.id) in quest_ids

    # Test search by description
    response = client.get(f"{settings.API_V1_STR}/quests/?search=developers")
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]
    assert str(quest.id) in quest_ids

    # Test search with no results
    response = client.get(f"{settings.API_V1_STR}/quests/?search=nonexistent")
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]
    assert str(quest.id) not in quest_ids


def test_read_quests_with_party_size_filter(client: TestClient, db: Session) -> None:
    from app.models import QuestVisibility

    creator = create_random_user(db)
    # Create a quest with specific party size for testing
    quest_data = QuestFactory()
    quest_data.visibility = QuestVisibility.PUBLIC
    quest_data.party_size_min = 2
    quest_data.party_size_max = 5
    quest = crud.create_quest(session=db, quest_in=quest_data, creator_id=creator.id)

    # Test party_size_min filter (quest max should be >= filter min)
    response = client.get(f"{settings.API_V1_STR}/quests/?party_size_min=3")
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]
    assert str(quest.id) in quest_ids

    # Test party_size_max filter (quest min should be <= filter max)
    response = client.get(f"{settings.API_V1_STR}/quests/?party_size_max=4")
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]
    assert str(quest.id) in quest_ids

    # Test party size range that excludes the quest
    response = client.get(f"{settings.API_V1_STR}/quests/?party_size_min=6")
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]
    assert str(quest.id) not in quest_ids


def test_read_quests_only_returns_public_visibility(
    client: TestClient, db: Session
) -> None:
    from app.models import QuestVisibility

    creator = create_random_user(db)

    # Create quests with different visibility levels
    public_quest_data = QuestFactory()
    public_quest_data.visibility = QuestVisibility.PUBLIC
    public_quest = crud.create_quest(
        session=db, quest_in=public_quest_data, creator_id=creator.id
    )

    private_quest_data = QuestFactory()
    private_quest_data.visibility = QuestVisibility.PRIVATE
    private_quest = crud.create_quest(
        session=db, quest_in=private_quest_data, creator_id=creator.id
    )

    unlisted_quest_data = QuestFactory()
    unlisted_quest_data.visibility = QuestVisibility.UNLISTED
    unlisted_quest = crud.create_quest(
        session=db, quest_in=unlisted_quest_data, creator_id=creator.id
    )

    # Only public quest should appear in the public quest list
    response = client.get(f"{settings.API_V1_STR}/quests/")
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]

    assert str(public_quest.id) in quest_ids
    assert str(private_quest.id) not in quest_ids
    assert str(unlisted_quest.id) not in quest_ids


def test_read_my_quests(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    quest_data: dict[str, Any],
) -> None:
    # Get superuser info (not needed for this test)
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    assert response.status_code == 200
    quest = response.json()

    response = client.get(
        f"{settings.API_V1_STR}/quests/my", headers=superuser_token_headers
    )
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]
    assert quest["id"] in quest_ids


def test_read_quest(client: TestClient, db: Session) -> None:
    creator = create_random_user(db)
    quest = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator.id
    )

    response = client.get(f"{settings.API_V1_STR}/quests/{quest.id}")
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(quest.id)
    assert content["title"] == quest.title


def test_read_quest_not_found(client: TestClient) -> None:
    quest_id = uuid.uuid4()
    response = client.get(f"{settings.API_V1_STR}/quests/{quest_id}")
    assert response.status_code == 404


def test_update_quest(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    quest_data: dict[str, Any],
) -> None:
    # Create quest as superuser
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    # Update quest
    new_title = random_lower_string()
    update_data = {"title": new_title, "status": QuestStatus.IN_PROGRESS}
    response = client.patch(
        f"{settings.API_V1_STR}/quests/{quest['id']}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["title"] == new_title
    assert content["status"] == QuestStatus.IN_PROGRESS


def test_update_quest_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    quest_id = uuid.uuid4()
    update_data = {"title": "New Title"}
    response = client.patch(
        f"{settings.API_V1_STR}/quests/{quest_id}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert response.status_code == 404


def test_update_quest_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Create quest with different user
    creator = create_random_user(db)
    quest = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator.id
    )

    # Try to update with normal user (not creator)
    update_data = {"title": "New Title"}
    response = client.patch(
        f"{settings.API_V1_STR}/quests/{quest.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 403


def test_delete_quest(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    quest_data: dict[str, Any],
) -> None:
    # Create quest as superuser
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    # Delete quest
    response = client.delete(
        f"{settings.API_V1_STR}/quests/{quest['id']}", headers=superuser_token_headers
    )
    assert response.status_code == 200

    # Verify quest is deleted
    response = client.get(f"{settings.API_V1_STR}/quests/{quest['id']}")
    assert response.status_code == 404


def test_delete_quest_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    quest_id = uuid.uuid4()
    response = client.delete(
        f"{settings.API_V1_STR}/quests/{quest_id}", headers=superuser_token_headers
    )
    assert response.status_code == 404


def test_delete_quest_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Create quest with different user
    creator = create_random_user(db)
    quest = crud.create_quest(
        session=db, quest_in=QuestFactory(), creator_id=creator.id
    )

    # Try to delete with normal user (not creator)
    response = client.delete(
        f"{settings.API_V1_STR}/quests/{quest.id}", headers=normal_user_token_headers
    )
    assert response.status_code == 403
