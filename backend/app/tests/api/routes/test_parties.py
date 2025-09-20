import uuid
from typing import Any

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import PartyStatus
from app.tests.utils.factories import (
    create_party,
    create_party_member,
    create_quest,
    create_user,
)


def test_create_party(
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

    # Create party for the quest
    party_data = {"quest_id": quest["id"]}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["quest_id"] == quest["id"]
    assert content["status"] == PartyStatus.ACTIVE
    assert "id" in content
    assert "formed_at" in content


def test_create_party_quest_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    quest_id = uuid.uuid4()
    party_data = {"quest_id": str(quest_id)}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    assert response.status_code == 404


def test_create_party_not_creator(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Create quest with different user
    creator = create_user(db)
    quest = create_quest(db, creator_id=creator.id)

    # Try to create party as non-creator
    party_data = {"quest_id": str(quest.id)}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=normal_user_token_headers,
        json=party_data,
    )
    assert response.status_code == 403


def test_create_party_already_exists(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    quest_data: dict[str, Any],
) -> None:
    # Create quest as superuser
    # quest_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    # Create first party
    party_data = {"quest_id": quest["id"]}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    assert response.status_code == 200

    # Try to create second party for same quest
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    assert response.status_code == 400


def test_read_my_parties(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    quest_data: dict[str, Any],
) -> None:
    # Create quest and party as superuser
    # quest_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    party_data = {"quest_id": quest["id"]}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    party = response.json()

    # Read my parties
    response = client.get(
        f"{settings.API_V1_STR}/parties/my", headers=superuser_token_headers
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 1

    party_ids = [p["id"] for p in content["data"]]
    assert party["id"] in party_ids


def test_read_party(client: TestClient, db: Session) -> None:
    quest = create_quest(db)
    party = create_party(db, quest_id=quest.id)

    response = client.get(f"{settings.API_V1_STR}/parties/{party.id}")
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(party.id)
    assert content["quest_id"] == str(quest.id)


def test_read_party_not_found(client: TestClient) -> None:
    party_id = uuid.uuid4()
    response = client.get(f"{settings.API_V1_STR}/parties/{party_id}")
    assert response.status_code == 404


def test_update_party_as_creator(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    quest_data: dict[str, Any],
) -> None:
    # Create quest and party as superuser
    # quest_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    party_data = {"quest_id": quest["id"]}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    party = response.json()

    # Update party
    update_data = {"status": PartyStatus.ACTIVE, "chat_channel_id": "new-channel-id"}
    response = client.put(
        f"{settings.API_V1_STR}/parties/{party['id']}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["status"] == PartyStatus.ACTIVE
    assert content["chat_channel_id"] == "new-channel-id"


def test_update_party_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Create quest and party with different user
    creator = create_user(db)
    quest = create_quest(db, creator_id=creator.id)
    party = create_party(db, quest_id=quest.id)

    # Try to update party as non-creator/non-leader
    update_data = {"status": PartyStatus.ACTIVE}
    response = client.put(
        f"{settings.API_V1_STR}/parties/{party.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 403


# Party Members tests
def test_read_party_members(client: TestClient, db: Session) -> None:
    quest = create_quest(db)
    party = create_party(db, quest_id=quest.id)

    # Create some members
    member1 = create_party_member(db, party_id=party.id, role="OWNER")
    member2 = create_party_member(db, party_id=party.id, role="MEMBER")

    response = client.get(f"{settings.API_V1_STR}/parties/{party.id}/members")
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2

    member_ids = [m["id"] for m in content["data"]]
    assert str(member1.id) in member_ids
    assert str(member2.id) in member_ids


def test_add_party_member_as_creator(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
    quest_data: dict[str, Any],
) -> None:
    # Create quest as superuser
    # quest_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    # Create party
    party_data = {"quest_id": quest["id"]}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    party = response.json()

    # Create a user to add as member
    new_user = create_user(db)

    # Add member to party
    member_data = {"user_id": str(new_user.id), "role": "MEMBER"}
    response = client.post(
        f"{settings.API_V1_STR}/parties/{party['id']}/members",
        headers=superuser_token_headers,
        json=member_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["user_id"] == str(new_user.id)
    assert content["role"] == "MEMBER"


def test_add_party_member_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    # Create quest and party with different user
    creator = create_user(db)
    quest = create_quest(db, creator_id=creator.id)
    party = create_party(db, quest_id=quest.id)

    # Create a user to add as member
    new_user = create_user(db)

    # Try to add member as non-creator/non-leader
    member_data = {"user_id": str(new_user.id)}
    response = client.post(
        f"{settings.API_V1_STR}/parties/{party.id}/members",
        headers=normal_user_token_headers,
        json=member_data,
    )
    assert response.status_code == 403


def test_update_party_member_role(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
    quest_data: dict[str, Any],
) -> None:
    # Create quest and party as superuser
    # quest_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    party_data = {"quest_id": quest["id"]}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    party = response.json()

    # Add a member
    new_user = create_user(db)
    member_data = {"user_id": str(new_user.id), "role": "MEMBER"}
    response = client.post(
        f"{settings.API_V1_STR}/parties/{party['id']}/members",
        headers=superuser_token_headers,
        json=member_data,
    )
    member = response.json()

    # Update member role
    update_data = {"role": "MODERATOR"}
    response = client.put(
        f"{settings.API_V1_STR}/parties/{party['id']}/members/{member['id']}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["role"] == "MODERATOR"


def test_remove_party_member(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    db: Session,
    quest_data: dict[str, Any],
) -> None:
    # Create quest and party as superuser
    # quest_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    party_data = {"quest_id": quest["id"]}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    party = response.json()

    # Add a member
    new_user = create_user(db)
    member_data = {"user_id": str(new_user.id)}
    response = client.post(
        f"{settings.API_V1_STR}/parties/{party['id']}/members",
        headers=superuser_token_headers,
        json=member_data,
    )
    member = response.json()

    # Remove member
    response = client.delete(
        f"{settings.API_V1_STR}/parties/{party['id']}/members/{member['id']}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Verify member is no longer active
    response = client.get(f"{settings.API_V1_STR}/parties/{party['id']}/members")
    assert response.status_code == 200
    content = response.json()
    active_member_ids = [m["id"] for m in content["data"] if m["status"] == "active"]
    assert member["id"] not in active_member_ids


def test_cannot_remove_quest_creator(
    client: TestClient,
    superuser_token_headers: dict[str, str],
    quest_data: dict[str, Any],
) -> None:
    # Create quest as superuser
    # quest_data provided by fixture
    response = client.post(
        f"{settings.API_V1_STR}/quests/",
        headers=superuser_token_headers,
        json=quest_data,
    )
    quest = response.json()

    # Create party (this automatically adds creator as leader)
    party_data = {"quest_id": quest["id"]}
    response = client.post(
        f"{settings.API_V1_STR}/parties/",
        headers=superuser_token_headers,
        json=party_data,
    )
    party = response.json()

    # Get party members to find the creator member
    response = client.get(f"{settings.API_V1_STR}/parties/{party['id']}/members")
    members = response.json()["data"]
    creator_member = next(m for m in members if m["role"] == "OWNER")

    # Try to remove quest creator
    response = client.delete(
        f"{settings.API_V1_STR}/parties/{party['id']}/members/{creator_member['id']}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 400
    assert "creator" in response.json()["detail"].lower()
