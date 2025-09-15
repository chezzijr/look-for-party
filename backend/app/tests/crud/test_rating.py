import uuid
import pytest
from sqlmodel import Session

from app import crud
from app.models import (
    Rating,
    RatingCreate,
    RatingUpdate,
    Party,
    PartyStatus,
    PartyMember,
    PartyMemberRole,
    PartyMemberCreate,
)
from app.tests.utils.factories import create_user
from app.tests.utils.quest import create_random_quest
from app.tests.utils.party import create_random_party


def create_test_party_with_members(db: Session, num_members: int = 3):
    """Create a party with multiple members for testing ratings."""
    # Create users
    creator = create_user(db)
    quest = create_random_quest(db, creator_id=creator.id)
    party = create_random_party(db, quest_id=quest.id)
    
    # Add creator as owner
    creator_member = crud.create_party_member(
        session=db,
        member_in=PartyMemberCreate(user_id=creator.id, role=PartyMemberRole.OWNER),
        party_id=party.id
    )
    
    # Add additional members
    members = [creator]
    for _ in range(num_members - 1):
        user = create_user(db)
        crud.create_party_member(
            session=db,
            member_in=PartyMemberCreate(user_id=user.id),
            party_id=party.id
        )
        members.append(user)
    
    # Set party to completed to allow ratings
    party.status = PartyStatus.COMPLETED
    db.add(party)
    db.commit()
    db.refresh(party)
    
    return party, members


def test_create_rating(db: Session) -> None:
    """Test creating a rating."""
    party, members = create_test_party_with_members(db, 2)
    rater = members[0]
    rated_user = members[1]
    
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=5,
        reliability_rating=4,
        skill_rating=3,
        review_text="Great teammate!",
        would_collaborate_again=True
    )
    
    rating = crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)
    
    assert rating.party_id == party.id
    assert rating.rater_id == rater.id
    assert rating.rated_user_id == rated_user.id
    assert rating.overall_rating == 4
    assert rating.collaboration_rating == 4
    assert rating.communication_rating == 5
    assert rating.reliability_rating == 4
    assert rating.skill_rating == 3
    assert rating.review_text == "Great teammate!"
    assert rating.would_collaborate_again == True
    assert rating.id is not None


def test_create_rating_party_not_completed(db: Session) -> None:
    """Test that rating creation fails for active parties."""
    creator = create_user(db)
    quest = create_random_quest(db, creator_id=creator.id)
    party = create_random_party(db, quest_id=quest.id)
    
    # Party is ACTIVE by default
    other_user = create_user(db)
    
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=other_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    with pytest.raises(ValueError, match="Can only rate members when party is completed or archived"):
        crud.create_rating(session=db, rating_in=rating_in, rater_id=creator.id)


def test_create_rating_not_party_member(db: Session) -> None:
    """Test that only party members can create ratings."""
    party, members = create_test_party_with_members(db, 2)
    outsider = create_user(db)  # Not a party member
    rated_user = members[0]
    
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    with pytest.raises(ValueError, match="Can only rate members of parties you belong to"):
        crud.create_rating(session=db, rating_in=rating_in, rater_id=outsider.id)


def test_create_rating_self_rating(db: Session) -> None:
    """Test that users cannot rate themselves."""
    party, members = create_test_party_with_members(db, 2)
    user = members[0]
    
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=user.id,  # Same as rater
        overall_rating=5,
        collaboration_rating=5,
        communication_rating=5,
        reliability_rating=5,
        skill_rating=5
    )
    
    with pytest.raises(ValueError, match="Cannot rate yourself"):
        crud.create_rating(session=db, rating_in=rating_in, rater_id=user.id)


def test_create_rating_duplicate(db: Session) -> None:
    """Test that duplicate ratings are not allowed."""
    party, members = create_test_party_with_members(db, 2)
    rater = members[0]
    rated_user = members[1]
    
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    # Create first rating
    crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)
    
    # Try to create duplicate
    with pytest.raises(ValueError, match="You have already rated this user for this party"):
        crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)


def test_get_rating(db: Session) -> None:
    """Test getting a rating by ID."""
    party, members = create_test_party_with_members(db, 2)
    rater = members[0]
    rated_user = members[1]
    
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    created_rating = crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)
    retrieved_rating = crud.get_rating(session=db, rating_id=created_rating.id)
    
    assert retrieved_rating
    assert retrieved_rating.id == created_rating.id
    assert retrieved_rating.party_id == party.id
    assert retrieved_rating.rater_id == rater.id
    assert retrieved_rating.rated_user_id == rated_user.id


def test_get_party_ratings(db: Session) -> None:
    """Test getting all ratings for a party."""
    party, members = create_test_party_with_members(db, 3)
    
    # Create multiple ratings
    rating1_in = RatingCreate(
        party_id=party.id,
        rated_user_id=members[1].id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    rating2_in = RatingCreate(
        party_id=party.id,
        rated_user_id=members[0].id,
        overall_rating=3,
        collaboration_rating=3,
        communication_rating=3,
        reliability_rating=3,
        skill_rating=3
    )
    
    crud.create_rating(session=db, rating_in=rating1_in, rater_id=members[0].id)
    crud.create_rating(session=db, rating_in=rating2_in, rater_id=members[1].id)
    
    party_ratings = crud.get_party_ratings(session=db, party_id=party.id)
    
    assert len(party_ratings) == 2
    party_ids = [rating.party_id for rating in party_ratings]
    assert all(pid == party.id for pid in party_ids)


def test_get_user_received_ratings(db: Session) -> None:
    """Test getting all ratings received by a user."""
    party, members = create_test_party_with_members(db, 3)
    rated_user = members[0]
    
    # Create ratings from different users
    rating1_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    rating2_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=5,
        collaboration_rating=5,
        communication_rating=5,
        reliability_rating=5,
        skill_rating=5
    )
    
    crud.create_rating(session=db, rating_in=rating1_in, rater_id=members[1].id)
    crud.create_rating(session=db, rating_in=rating2_in, rater_id=members[2].id)
    
    received_ratings = crud.get_user_received_ratings(session=db, user_id=rated_user.id)
    
    assert len(received_ratings) == 2
    rated_user_ids = [rating.rated_user_id for rating in received_ratings]
    assert all(uid == rated_user.id for uid in rated_user_ids)


def test_get_user_given_ratings(db: Session) -> None:
    """Test getting all ratings given by a user."""
    party, members = create_test_party_with_members(db, 3)
    rater = members[0]
    
    # Create ratings for different users
    rating1_in = RatingCreate(
        party_id=party.id,
        rated_user_id=members[1].id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    rating2_in = RatingCreate(
        party_id=party.id,
        rated_user_id=members[2].id,
        overall_rating=5,
        collaboration_rating=5,
        communication_rating=5,
        reliability_rating=5,
        skill_rating=5
    )
    
    crud.create_rating(session=db, rating_in=rating1_in, rater_id=rater.id)
    crud.create_rating(session=db, rating_in=rating2_in, rater_id=rater.id)
    
    given_ratings = crud.get_user_given_ratings(session=db, user_id=rater.id)
    
    assert len(given_ratings) == 2
    rater_ids = [rating.rater_id for rating in given_ratings]
    assert all(rid == rater.id for rid in rater_ids)


def test_update_rating(db: Session) -> None:
    """Test updating a rating."""
    party, members = create_test_party_with_members(db, 2)
    rater = members[0]
    rated_user = members[1]
    
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=3,
        collaboration_rating=3,
        communication_rating=3,
        reliability_rating=3,
        skill_rating=3,
        review_text="Initial review"
    )
    
    rating = crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)
    
    # Update the rating
    rating_update = RatingUpdate(
        overall_rating=5,
        communication_rating=5,
        review_text="Updated review - much better!"
    )
    
    updated_rating = crud.update_rating(session=db, db_rating=rating, rating_in=rating_update)
    
    assert updated_rating.overall_rating == 5
    assert updated_rating.collaboration_rating == 3  # Unchanged
    assert updated_rating.communication_rating == 5
    assert updated_rating.review_text == "Updated review - much better!"
    assert updated_rating.updated_at > updated_rating.created_at


def test_delete_rating(db: Session) -> None:
    """Test deleting a rating."""
    party, members = create_test_party_with_members(db, 2)
    rater = members[0]
    rated_user = members[1]
    
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    rating = crud.create_rating(session=db, rating_in=rating_in, rater_id=rater.id)
    rating_id = rating.id
    
    # Delete the rating
    deleted_rating = crud.delete_rating(session=db, rating_id=rating_id)
    
    assert deleted_rating
    assert deleted_rating.id == rating_id
    
    # Verify it's deleted
    retrieved_rating = crud.get_rating(session=db, rating_id=rating_id)
    assert retrieved_rating is None


def test_get_user_rating_summary(db: Session) -> None:
    """Test getting user's rating summary statistics."""
    party, members = create_test_party_with_members(db, 3)
    rated_user = members[0]
    
    # Create multiple ratings for the user
    rating1_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4,
        would_collaborate_again=True
    )
    
    rating2_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=5,
        collaboration_rating=5,
        communication_rating=3,
        reliability_rating=5,
        skill_rating=4,
        would_collaborate_again=True
    )
    
    crud.create_rating(session=db, rating_in=rating1_in, rater_id=members[1].id)
    crud.create_rating(session=db, rating_in=rating2_in, rater_id=members[2].id)
    
    summary = crud.get_user_rating_summary(session=db, user_id=rated_user.id)
    
    assert summary.user_id == rated_user.id
    assert summary.total_ratings == 2
    assert summary.average_overall == 4.5  # (4 + 5) / 2
    assert summary.average_collaboration == 4.5  # (4 + 5) / 2
    assert summary.average_communication == 3.5  # (4 + 3) / 2
    assert summary.average_reliability == 4.5  # (4 + 5) / 2
    assert summary.average_skill == 4.0  # (4 + 4) / 2
    assert summary.positive_feedback_percentage == 100.0  # Both True


def test_get_ratable_users_for_party(db: Session) -> None:
    """Test getting users that can be rated in a party."""
    party, members = create_test_party_with_members(db, 3)
    current_user = members[0]
    
    # Initially, user can rate all other members
    ratable_users = crud.get_ratable_users_for_party(
        session=db, party_id=party.id, current_user_id=current_user.id
    )
    
    assert len(ratable_users) == 2
    ratable_user_ids = [user.id for user in ratable_users]
    assert members[1].id in ratable_user_ids
    assert members[2].id in ratable_user_ids
    assert current_user.id not in ratable_user_ids
    
    # Rate one user
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=members[1].id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    crud.create_rating(session=db, rating_in=rating_in, rater_id=current_user.id)
    
    # Now should only have one ratable user left
    ratable_users_after = crud.get_ratable_users_for_party(
        session=db, party_id=party.id, current_user_id=current_user.id
    )
    
    assert len(ratable_users_after) == 1
    assert ratable_users_after[0].id == members[2].id


def test_can_user_rate_party(db: Session) -> None:
    """Test checking if user can rate members in a party."""
    party, members = create_test_party_with_members(db, 2)
    member = members[0]
    outsider = create_user(db)
    
    # Member can rate
    can_rate_member = crud.can_user_rate_party(session=db, party_id=party.id, user_id=member.id)
    assert can_rate_member is True
    
    # Outsider cannot rate
    can_rate_outsider = crud.can_user_rate_party(session=db, party_id=party.id, user_id=outsider.id)
    assert can_rate_outsider is False
    
    # Set party to ACTIVE - no one can rate
    party.status = PartyStatus.ACTIVE
    db.add(party)
    db.commit()
    
    can_rate_active = crud.can_user_rate_party(session=db, party_id=party.id, user_id=member.id)
    assert can_rate_active is False


def test_reputation_update_on_rating(db: Session) -> None:
    """Test that user reputation is updated when they receive ratings."""
    party, members = create_test_party_with_members(db, 3)
    rated_user = members[0]
    
    # Check initial reputation (should be 0.0)
    db.refresh(rated_user)
    initial_reputation = rated_user.reputation_score
    assert initial_reputation == 0.0
    
    # Create a rating
    rating_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=4,
        collaboration_rating=4,
        communication_rating=4,
        reliability_rating=4,
        skill_rating=4
    )
    
    crud.create_rating(session=db, rating_in=rating_in, rater_id=members[1].id)
    
    # Check reputation was updated
    db.refresh(rated_user)
    assert rated_user.reputation_score == 4.0
    
    # Add another rating
    rating2_in = RatingCreate(
        party_id=party.id,
        rated_user_id=rated_user.id,
        overall_rating=2,
        collaboration_rating=2,
        communication_rating=2,
        reliability_rating=2,
        skill_rating=2
    )
    
    crud.create_rating(session=db, rating_in=rating2_in, rater_id=members[2].id)
    
    # Check reputation is average
    db.refresh(rated_user)
    assert rated_user.reputation_score == 3.0  # (4 + 2) / 2