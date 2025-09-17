import uuid
from datetime import datetime

from sqlmodel import Session, case, func, select

from app.models import (
    Party,
    PartyMember,
    PartyStatus,
    Rating,
    RatingCreate,
    RatingUpdate,
    User,
    UserRatingSummary,
)


def create_rating(
    *, session: Session, rating_in: RatingCreate, rater_id: uuid.UUID
) -> Rating:
    """Create a new rating with validation."""
    # Validate that party exists and is completed/archived
    party = session.get(Party, rating_in.party_id)
    if not party:
        raise ValueError("Party not found")

    if party.status not in [PartyStatus.COMPLETED, PartyStatus.ARCHIVED]:
        raise ValueError("Can only rate members when party is completed or archived")

    # Validate that rater is a member of the party
    rater_membership = session.exec(
        select(PartyMember).where(
            PartyMember.party_id == rating_in.party_id,
            PartyMember.user_id == rater_id,
            PartyMember.status == "active",
        )
    ).first()

    if not rater_membership:
        raise ValueError("Can only rate members of parties you belong to")

    # Validate that rated user is a member of the party
    rated_user_membership = session.exec(
        select(PartyMember).where(
            PartyMember.party_id == rating_in.party_id,
            PartyMember.user_id == rating_in.rated_user_id,
            PartyMember.status == "active",
        )
    ).first()

    if not rated_user_membership:
        raise ValueError("Can only rate members of the same party")

    # Prevent self-rating
    if rater_id == rating_in.rated_user_id:
        raise ValueError("Cannot rate yourself")

    # Check for existing rating (unique constraint will also catch this)
    existing_rating = session.exec(
        select(Rating).where(
            Rating.party_id == rating_in.party_id,
            Rating.rater_id == rater_id,
            Rating.rated_user_id == rating_in.rated_user_id,
        )
    ).first()

    if existing_rating:
        raise ValueError("You have already rated this user for this party")

    # Create the rating
    db_rating = Rating.model_validate(rating_in, update={"rater_id": rater_id})
    session.add(db_rating)
    session.commit()
    session.refresh(db_rating)

    # Update user's reputation score
    _update_user_reputation(session=session, user_id=rating_in.rated_user_id)

    return db_rating


def get_rating(*, session: Session, rating_id: uuid.UUID) -> Rating | None:
    """Get rating by ID."""
    return session.get(Rating, rating_id)


def get_party_ratings(*, session: Session, party_id: uuid.UUID) -> list[Rating]:
    """Get all ratings for a party."""
    statement = (
        select(Rating)
        .where(Rating.party_id == party_id)
        .order_by(Rating.created_at.desc())
    )
    return list(session.exec(statement).all())


def get_user_received_ratings(*, session: Session, user_id: uuid.UUID) -> list[Rating]:
    """Get all ratings received by a user."""
    statement = (
        select(Rating)
        .where(Rating.rated_user_id == user_id)
        .order_by(Rating.created_at.desc())
    )
    return list(session.exec(statement).all())


def get_user_given_ratings(*, session: Session, user_id: uuid.UUID) -> list[Rating]:
    """Get all ratings given by a user."""
    statement = (
        select(Rating)
        .where(Rating.rater_id == user_id)
        .order_by(Rating.created_at.desc())
    )
    return list(session.exec(statement).all())


def get_rating_between_users(
    *,
    session: Session,
    party_id: uuid.UUID,
    rater_id: uuid.UUID,
    rated_user_id: uuid.UUID,
) -> Rating | None:
    """Get specific rating between two users in a party."""
    statement = select(Rating).where(
        Rating.party_id == party_id,
        Rating.rater_id == rater_id,
        Rating.rated_user_id == rated_user_id,
    )
    return session.exec(statement).first()


def update_rating(
    *, session: Session, db_rating: Rating, rating_in: RatingUpdate
) -> Rating:
    """Update a rating."""
    rating_data = rating_in.model_dump(exclude_unset=True)
    rating_data["updated_at"] = datetime.utcnow()

    db_rating.sqlmodel_update(rating_data)
    session.add(db_rating)
    session.commit()
    session.refresh(db_rating)

    # Update user's reputation score
    _update_user_reputation(session=session, user_id=db_rating.rated_user_id)

    return db_rating


def delete_rating(*, session: Session, rating_id: uuid.UUID) -> Rating | None:
    """Delete a rating."""
    rating = get_rating(session=session, rating_id=rating_id)
    if rating:
        rated_user_id = rating.rated_user_id
        session.delete(rating)
        session.commit()

        # Update user's reputation score
        _update_user_reputation(session=session, user_id=rated_user_id)

    return rating


def get_user_rating_summary(
    *, session: Session, user_id: uuid.UUID
) -> UserRatingSummary:
    """Get user's rating statistics."""
    # Get basic statistics
    basic_stats = select(
        func.count(Rating.id).label("total_ratings"),
        func.avg(Rating.overall_rating).label("average_overall"),
        func.avg(Rating.collaboration_rating).label("average_collaboration"),
        func.avg(Rating.communication_rating).label("average_communication"),
        func.avg(Rating.reliability_rating).label("average_reliability"),
        func.avg(Rating.skill_rating).label("average_skill"),
    ).where(Rating.rated_user_id == user_id)

    # Get positive feedback percentage separately
    positive_feedback_stats = select(
        func.count(Rating.id).label("total_count"),
        func.sum(case((Rating.would_collaborate_again is True, 1), else_=0)).label(
            "positive_count"
        ),
    ).where(Rating.rated_user_id == user_id)

    basic_result = session.exec(basic_stats).first()
    feedback_result = session.exec(positive_feedback_stats).first()

    if not basic_result or basic_result.total_ratings == 0:
        return UserRatingSummary(
            user_id=user_id,
            total_ratings=0,
            average_overall=0.0,
            average_collaboration=0.0,
            average_communication=0.0,
            average_reliability=0.0,
            average_skill=0.0,
            positive_feedback_percentage=0.0,
        )

    # Calculate positive feedback percentage
    positive_percentage = 0.0
    if feedback_result and feedback_result.total_count > 0:
        positive_percentage = (
            (feedback_result.positive_count or 0) / feedback_result.total_count * 100
        )

    return UserRatingSummary(
        user_id=user_id,
        total_ratings=basic_result.total_ratings,
        average_overall=round(basic_result.average_overall or 0.0, 2),
        average_collaboration=round(basic_result.average_collaboration or 0.0, 2),
        average_communication=round(basic_result.average_communication or 0.0, 2),
        average_reliability=round(basic_result.average_reliability or 0.0, 2),
        average_skill=round(basic_result.average_skill or 0.0, 2),
        positive_feedback_percentage=round(positive_percentage, 1),
    )


def get_ratable_users_for_party(
    *, session: Session, party_id: uuid.UUID, current_user_id: uuid.UUID
) -> list[User]:
    """Get users that the current user can rate in a given party."""
    # First check if party allows rating (COMPLETED or ARCHIVED)
    party = session.get(Party, party_id)
    if not party or party.status not in [PartyStatus.COMPLETED, PartyStatus.ARCHIVED]:
        return []

    # Get all active party members except current user
    statement = (
        select(User)
        .join(PartyMember)
        .where(
            PartyMember.party_id == party_id,
            PartyMember.status == "active",
            PartyMember.user_id != current_user_id,
        )
    )

    all_ratable_users = list(session.exec(statement).all())

    # Filter out users already rated by current user
    already_rated_users = session.exec(
        select(Rating.rated_user_id).where(
            Rating.party_id == party_id, Rating.rater_id == current_user_id
        )
    ).all()

    already_rated_user_ids = set(already_rated_users)

    return [user for user in all_ratable_users if user.id not in already_rated_user_ids]


def _update_user_reputation(*, session: Session, user_id: uuid.UUID) -> None:
    """Update a user's reputation score based on their ratings."""
    summary = get_user_rating_summary(session=session, user_id=user_id)

    # Calculate reputation score (0.0 - 5.0 based on average overall rating)
    reputation_score = summary.average_overall

    # Get user and update reputation
    user = session.get(User, user_id)
    if user:
        user.reputation_score = reputation_score
        session.add(user)
        session.commit()


def can_user_rate_party(
    *, session: Session, party_id: uuid.UUID, user_id: uuid.UUID
) -> bool:
    """Check if user can rate members in a party."""
    party = session.get(Party, party_id)
    if not party or party.status not in [PartyStatus.COMPLETED, PartyStatus.ARCHIVED]:
        return False

    # Check if user is an active member of the party
    membership = session.exec(
        select(PartyMember).where(
            PartyMember.party_id == party_id,
            PartyMember.user_id == user_id,
            PartyMember.status == "active",
        )
    ).first()

    return membership is not None
