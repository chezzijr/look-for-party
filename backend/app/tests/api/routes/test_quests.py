import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import QuestCreate, QuestUpdate, QuestStatus, QuestCategory, CommitmentLevel, LocationType
from app.tests.utils.quest import QuestFactory
from app.tests.utils.user import create_random_user
from app.tests.utils.utils import random_lower_string


def test_create_quest(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session, quest_data: dict
) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/quests/", headers=superuser_token_headers, json=quest_data
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
    client: TestClient, superuser_token_headers: dict[str, str], quest_data: dict
) -> None:
    quest_data["party_size_min"] = 5
    quest_data["party_size_max"] = 3
    
    response = client.post(
        f"{settings.API_V1_STR}/quests/", headers=superuser_token_headers, json=quest_data
    )
    assert response.status_code == 400
    assert "party size" in response.json()["detail"].lower()


def test_read_quests(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    creator = create_random_user(db)
    quest1 = crud.create_quest(session=db, quest_in=QuestFactory(), creator_id=creator.id)
    quest2 = crud.create_quest(session=db, quest_in=QuestFactory(), creator_id=creator.id)
    
    response = client.get(f"{settings.API_V1_STR}/quests/")
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2
    assert content["count"] >= 2


def test_read_quests_with_status_filter(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    creator = create_random_user(db)
    quest = crud.create_quest(session=db, quest_in=QuestFactory(), creator_id=creator.id)
    
    response = client.get(
        f"{settings.API_V1_STR}/quests/?status={QuestStatus.RECRUITING.value}"
    )
    assert response.status_code == 200
    content = response.json()
    quest_ids = [q["id"] for q in content["data"]]
    assert str(quest.id) in quest_ids


def test_read_my_quests(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session, quest_data: dict
) -> None:
    # Get superuser info
    superuser_response = client.get(
        f"{settings.API_V1_STR}/users/me", headers=superuser_token_headers
    )
    superuser_id = superuser_response.json()["id"]
    response = client.post(
        f"{settings.API_V1_STR}/quests/", headers=superuser_token_headers, json=quest_data
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


def test_read_quest(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    creator = create_random_user(db)
    quest = crud.create_quest(session=db, quest_in=QuestFactory(), creator_id=creator.id)
    
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
    client: TestClient, superuser_token_headers: dict[str, str], db: Session, quest_data: dict
) -> None:
    # Create quest as superuser
    response = client.post(
        f"{settings.API_V1_STR}/quests/", headers=superuser_token_headers, json=quest_data
    )
    quest = response.json()
    
    # Update quest
    new_title = random_lower_string()
    update_data = {"title": new_title, "status": QuestStatus.IN_PROGRESS}
    response = client.put(
        f"{settings.API_V1_STR}/quests/{quest['id']}", 
        headers=superuser_token_headers, 
        json=update_data
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
    response = client.put(
        f"{settings.API_V1_STR}/quests/{quest_id}", 
        headers=superuser_token_headers, 
        json=update_data
    )
    assert response.status_code == 404


def test_update_quest_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Create quest with different user
    creator = create_random_user(db)
    quest = crud.create_quest(session=db, quest_in=QuestFactory(), creator_id=creator.id)
    
    # Try to update with normal user (not creator)
    update_data = {"title": "New Title"}
    response = client.put(
        f"{settings.API_V1_STR}/quests/{quest.id}", 
        headers=normal_user_token_headers, 
        json=update_data
    )
    assert response.status_code == 403


def test_delete_quest(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session, quest_data: dict
) -> None:
    # Create quest as superuser
    response = client.post(
        f"{settings.API_V1_STR}/quests/", headers=superuser_token_headers, json=quest_data
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
    quest = crud.create_quest(session=db, quest_in=QuestFactory(), creator_id=creator.id)
    
    # Try to delete with normal user (not creator)
    response = client.delete(
        f"{settings.API_V1_STR}/quests/{quest.id}", headers=normal_user_token_headers
    )
    assert response.status_code == 403