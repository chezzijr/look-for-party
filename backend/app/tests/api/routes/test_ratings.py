import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import (
    Party,
    PartyMemberCreate,
    PartyMemberRole,
    PartyStatus,
    RatingCreate,
    User,
)
from app.tests.utils.factories import create_user
from app.tests.utils.party import create_random_party
from app.tests.utils.quest import create_random_quest


def create_test_party_with_members(
    db: Session, num_members: int = 3
) -> tuple[Party, list[User]]:
    """Helper to create a party with multiple members for testing ratings."""
    # Create users
    creator = create_user(db)
    quest = create_random_quest(db, creator_id=creator.id)
    party = create_random_party(db, quest_id=quest.id)

    # Add creator as owner
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=creator.id, role=PartyMemberRole.OWNER),
        party_id=party.id,
    )

    # Add additional members
    members = [creator]
    for _ in range(num_members - 1):
        user = create_user(db)
        crud.create_party_member(
            session=db, member_in=PartyMemberCreate(user_id=user.id), party_id=party.id
        )
        members.append(user)

    # Set party to completed to allow ratings
    party.status = PartyStatus.COMPLETED
    db.add(party)
    db.commit()
    db.refresh(party)

    return party, members


def test_create_rating(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test creating a rating via API."""
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    current_user = user_response.json()
    current_user_id = uuid.UUID(current_user["id"])

    # Create party with current user as member
    other_user = create_user(db)
    quest = create_random_quest(db, creator_id=current_user_id)
    party = create_random_party(db, quest_id=quest.id)

    # Add both users to party
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(
            user_id=current_user_id, role=PartyMemberRole.OWNER
        ),
        party_id=party.id,
    )
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=other_user.id),
        party_id=party.id,
    )

    # Set party to completed
    party.status = PartyStatus.COMPLETED
    db.add(party)
    db.commit()

    data = {
        "party_id": str(party.id),
        "rated_user_id": str(other_user.id),
        "overall_rating": 4,
        "collaboration_rating": 4,
        "communication_rating": 5,
        "reliability_rating": 4,
        "skill_rating": 3,
        "review_text": "Great teammate!",
        "would_collaborate_again": True,
    }

    response = client.post(
        f"{settings.API_V1_STR}/ratings/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200

    rating = response.json()
    assert rating["party_id"] == str(party.id)
    assert rating["rated_user_id"] == str(other_user.id)
    assert rating["overall_rating"] == 4
    assert rating["collaboration_rating"] == 4
    assert rating["communication_rating"] == 5
    assert rating["reliability_rating"] == 4
    assert rating["skill_rating"] == 3
    assert rating["review_text"] == "Great teammate!"
    assert rating["would_collaborate_again"] is True


def test_create_rating_party_not_completed(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test that rating creation fails for active parties."""
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    current_user = user_response.json()
    current_user_id = uuid.UUID(current_user["id"])

    # Create party with ACTIVE status (default)
    other_user = create_user(db)
    quest = create_random_quest(db, creator_id=current_user_id)
    party = create_random_party(db, quest_id=quest.id)

    # Add both users to party
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(
            user_id=current_user_id, role=PartyMemberRole.OWNER
        ),
        party_id=party.id,
    )
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=other_user.id),
        party_id=party.id,
    )

    data = {
        "party_id": str(party.id),
        "rated_user_id": str(other_user.id),
        "overall_rating": 4,
        "collaboration_rating": 4,
        "communication_rating": 4,
        "reliability_rating": 4,
        "skill_rating": 4,
    }

    response = client.post(
        f"{settings.API_V1_STR}/ratings/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 400
    assert (
        "Can only rate members when party is completed or archived"
        in response.json()["detail"]
    )


def test_create_rating_duplicate(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test that duplicate ratings are rejected."""
    party, members = create_test_party_with_members(db, 2)

    # Create user tokens - we need to simulate the second member
    other_user = members[1]

    # Create first rating directly via CRUD
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=other_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4,
    )

    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    current_user = user_response.json()
    current_user_id = uuid.UUID(current_user["id"])

    # Make current user a member of the party
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=current_user_id),
        party_id=party.id,
    )

    # Create first rating
    crud.create_rating(session=db, rating_in=rating_in, rater_id=current_user_id)

    # Try to create duplicate via API
    data = {
        "party_id": str(party.id),
        "rated_user_id": str(other_user.id),
        "overall_rating": 5,
        "collaboration_rating": 5,
        "communication_rating": 5,
        "reliability_rating": 5,
        "skill_rating": 5,
    }

    response = client.post(
        f"{settings.API_V1_STR}/ratings/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 400
    assert (
        "You have already rated this user for this party" in response.json()["detail"]
    )


def test_read_rating(client: TestClient, db: Session) -> None:
    """Test reading a rating by ID."""
    party, members = create_test_party_with_members(db, 2)
    rater = members[0]
    rated_user = members[1]

    # Create rating via CRUD
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4,
        review_text="Good work!",
    )

    rating = crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)

    response = client.get(f"{settings.API_V1_STR}/ratings/{rating.id}")
    assert response.status_code == 200

    rating_data = response.json()
    assert rating_data["id"] == str(rating.id)
    assert rating_data["party_id"] == str(party.id)
    assert rating_data["overall_rating"] == 4
    assert rating_data["review_text"] == "Good work!"


def test_read_rating_not_found(client: TestClient) -> None:
    """Test reading non-existent rating."""
    fake_id = uuid.uuid4()
    response = client.get(f"{settings.API_V1_STR}/ratings/{fake_id}")
    assert response.status_code == 404


def test_read_party_ratings(client: TestClient, db: Session) -> None:
    """Test reading all ratings for a party."""
    party, members = create_test_party_with_members(db, 3)

    # Create multiple ratings
    rating1_in = RatingCreate(
        party_id=party.id,
        rated_user_id=members[1].id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4,
    )

    rating2_in = RatingCreate(
        party_id=party.id,
        rated_user_id=members[0].id,
        overall_rating=5,
        collaboration_rating=5,
        communication_rating=5,
        reliability_rating=5,
        skill_rating=5,
    )

    crud.create_rating(session=db, rating_in=rating1_in, rater_id=members[0].id)
    crud.create_rating(session=db, rating_in=rating2_in, rater_id=members[1].id)

    response = client.get(f"{settings.API_V1_STR}/ratings/party/{party.id}")
    assert response.status_code == 200

    data = response.json()
    assert data["count"] == 2
    assert len(data["data"]) == 2

    party_ids = [rating["party_id"] for rating in data["data"]]
    assert all(pid == str(party.id) for pid in party_ids)


def test_read_my_received_ratings(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test reading my received ratings."""
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    current_user = user_response.json()
    current_user_id = uuid.UUID(current_user["id"])

    party, members = create_test_party_with_members(db, 2)
    rater = members[0]

    # Add current user to party
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=current_user_id),
        party_id=party.id,
    )

    # Create rating for current user
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=current_user_id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4,
    )

    crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)

    response = client.get(
        f"{settings.API_V1_STR}/ratings/users/me/received",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    data = response.json()
    assert data["count"] == 1
    assert len(data["data"]) == 1
    assert data["data"][0]["rated_user_id"] == str(current_user_id)


def test_read_my_given_ratings(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test reading my given ratings."""
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    current_user = user_response.json()
    current_user_id = uuid.UUID(current_user["id"])

    party, members = create_test_party_with_members(db, 2)
    rated_user = members[0]

    # Add current user to party
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=current_user_id),
        party_id=party.id,
    )

    # Create rating by current user
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4,
    )

    crud.create_rating(session=db, rating_in=rating_in, rater_id=current_user_id)

    response = client.get(
        f"{settings.API_V1_STR}/ratings/users/me/given",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    data = response.json()
    assert data["count"] >= 1
    assert len(data["data"]) >= 1

    # Verify that the rating we just created is in the response
    found_our_rating = False
    for rating in data["data"]:
        assert rating["rater_id"] == str(
            current_user_id
        )  # All ratings should be by current user
        if rating["party_id"] == str(party.id) and rating["rated_user_id"] == str(
            rated_user.id
        ):
            found_our_rating = True

    assert found_our_rating, "The rating we created should be in the response"


def test_read_user_received_ratings(client: TestClient, db: Session) -> None:
    """Test reading another user's received ratings."""
    party, members = create_test_party_with_members(db, 3)
    rated_user = members[0]
    rater = members[1]

    # Create rating for user
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=5,
        collaboration_rating=5,
        communication_rating=5,
        reliability_rating=5,
        skill_rating=5,
    )

    crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)

    response = client.get(
        f"{settings.API_V1_STR}/ratings/users/{rated_user.id}/received"
    )
    assert response.status_code == 200

    data = response.json()
    assert data["count"] == 1
    assert len(data["data"]) == 1
    assert data["data"][0]["rated_user_id"] == str(rated_user.id)


def test_read_user_rating_summary(client: TestClient, db: Session) -> None:
    """Test reading user's rating summary."""
    party, members = create_test_party_with_members(db, 3)
    rated_user = members[0]

    # Create multiple ratings
    rating1_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4,
        would_collaborate_again=True,
    )

    rating2_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=5,
        collaboration_rating=5,
        communication_rating=3,
        reliability_rating=5,
        skill_rating=4,
        would_collaborate_again=True,
    )

    crud.create_rating(session=db, rating_in=rating1_in, rater_id=members[1].id)
    crud.create_rating(session=db, rating_in=rating2_in, rater_id=members[2].id)

    response = client.get(
        f"{settings.API_V1_STR}/ratings/users/{rated_user.id}/summary"
    )
    assert response.status_code == 200

    summary = response.json()
    assert summary["user_id"] == str(rated_user.id)
    assert summary["total_ratings"] == 2
    assert summary["average_overall"] == 4.5
    assert summary["average_collaboration"] == 4.5
    assert summary["average_communication"] == 3.5
    assert summary["positive_feedback_percentage"] == 100.0


def test_get_ratable_users_for_party(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test getting users that can be rated in a party."""
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    current_user = user_response.json()
    current_user_id = uuid.UUID(current_user["id"])

    party, members = create_test_party_with_members(db, 2)

    # Add current user to party
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=current_user_id),
        party_id=party.id,
    )

    response = client.get(
        f"{settings.API_V1_STR}/ratings/party/{party.id}/ratable-users",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    users = response.json()
    assert len(users) == 2  # Can rate the other 2 party members

    user_ids = [user["id"] for user in users]
    assert str(current_user_id) not in user_ids  # Cannot rate self


def test_check_can_rate_party(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test checking if user can rate in a party."""
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    current_user = user_response.json()
    current_user_id = uuid.UUID(current_user["id"])

    party, members = create_test_party_with_members(db, 2)

    # Add current user to party
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=current_user_id),
        party_id=party.id,
    )

    response = client.get(
        f"{settings.API_V1_STR}/ratings/party/{party.id}/can-rate",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    result = response.json()
    assert result["can_rate"] is True


def test_update_rating(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test updating a rating."""
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    current_user = user_response.json()
    current_user_id = uuid.UUID(current_user["id"])

    party, members = create_test_party_with_members(db, 2)
    rated_user = members[0]

    # Add current user to party
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=current_user_id),
        party_id=party.id,
    )

    # Create rating
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=3,
        collaboration_rating=3,
        communication_rating=3,
        reliability_rating=3,
        skill_rating=3,
        review_text="Initial review",
    )

    rating = crud.create_rating(
        session=db, rating_in=rating_in, rater_id=current_user_id
    )

    # Update rating
    update_data = {
        "overall_rating": 5,
        "communication_rating": 5,
        "review_text": "Much better after working together more!",
    }

    response = client.patch(
        f"{settings.API_V1_STR}/ratings/{rating.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 200

    updated_rating = response.json()
    assert updated_rating["overall_rating"] == 5
    assert updated_rating["collaboration_rating"] == 3  # Unchanged
    assert updated_rating["communication_rating"] == 5
    assert updated_rating["review_text"] == "Much better after working together more!"


def test_update_rating_not_owner(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test that only rater can update their rating."""
    party, members = create_test_party_with_members(db, 2)
    rater = members[0]
    rated_user = members[1]

    # Create rating by different user
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=3,
        collaboration_rating=3,
        communication_rating=3,
        reliability_rating=3,
        skill_rating=3,
    )

    rating = crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)

    # Try to update as different user
    update_data = {"overall_rating": 5}

    response = client.patch(
        f"{settings.API_V1_STR}/ratings/{rating.id}",
        headers=normal_user_token_headers,
        json=update_data,
    )
    assert response.status_code == 403
    assert "You can only update your own ratings" in response.json()["detail"]


def test_delete_rating(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test deleting a rating."""
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    current_user = user_response.json()
    current_user_id = uuid.UUID(current_user["id"])

    party, members = create_test_party_with_members(db, 2)
    rated_user = members[0]

    # Add current user to party
    crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=current_user_id),
        party_id=party.id,
    )

    # Create rating
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4,
    )

    rating = crud.create_rating(
        session=db, rating_in=rating_in, rater_id=current_user_id
    )

    # Delete rating
    response = client.delete(
        f"{settings.API_V1_STR}/ratings/{rating.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    result = response.json()
    assert result["message"] == "Rating deleted successfully"

    # Verify deletion
    get_response = client.get(f"{settings.API_V1_STR}/ratings/{rating.id}")
    assert get_response.status_code == 404


def test_delete_rating_not_owner(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    """Test that only rater can delete their rating."""
    party, members = create_test_party_with_members(db, 2)
    rater = members[0]
    rated_user = members[1]

    # Create rating by different user
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4,
    )

    rating = crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)

    # Try to delete as different user
    response = client.delete(
        f"{settings.API_V1_STR}/ratings/{rating.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert "You can only delete your own ratings" in response.json()["detail"]
