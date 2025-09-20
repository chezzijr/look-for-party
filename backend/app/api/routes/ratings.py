import uuid
from typing import Any

from fastapi import APIRouter, HTTPException

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    RatingCreate,
    RatingPublic,
    RatingsPublic,
    RatingUpdate,
    User,
    UserRatingSummary,
)

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("/", response_model=RatingPublic)
def create_rating(
    *, session: SessionDep, current_user: CurrentUser, rating_in: RatingCreate
) -> Any:
    """
    Create a new rating for a party member.
    """
    try:
        rating = crud.create_rating(
            session=session, rating_in=rating_in, rater_id=current_user.id
        )
        return rating
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{rating_id}", response_model=RatingPublic)
def read_rating(session: SessionDep, rating_id: uuid.UUID) -> Any:
    """
    Get rating by ID.
    """
    rating = crud.get_rating(session=session, rating_id=rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    return rating


@router.get("/party/{party_id}", response_model=RatingsPublic)
def read_party_ratings(session: SessionDep, party_id: uuid.UUID) -> Any:
    """
    Get all ratings for a party.
    """
    ratings = crud.get_party_ratings(session=session, party_id=party_id)
    return RatingsPublic(data=ratings, count=len(ratings))


@router.get("/users/me/received", response_model=RatingsPublic)
def read_my_received_ratings(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Get all ratings I have received.
    """
    ratings = crud.get_user_received_ratings(session=session, user_id=current_user.id)
    return RatingsPublic(data=ratings, count=len(ratings))


@router.get("/users/me/given", response_model=RatingsPublic)
def read_my_given_ratings(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Get all ratings I have given.
    """
    ratings = crud.get_user_given_ratings(session=session, user_id=current_user.id)
    return RatingsPublic(data=ratings, count=len(ratings))


@router.get("/users/{user_id}/received", response_model=RatingsPublic)
def read_user_received_ratings(session: SessionDep, user_id: uuid.UUID) -> Any:
    """
    Get all ratings received by a user (public view).
    """
    ratings = crud.get_user_received_ratings(session=session, user_id=user_id)
    return RatingsPublic(data=ratings, count=len(ratings))


@router.get("/users/{user_id}/summary", response_model=UserRatingSummary)
def read_user_rating_summary(session: SessionDep, user_id: uuid.UUID) -> Any:
    """
    Get user's rating statistics and summary.
    """
    return crud.get_user_rating_summary(session=session, user_id=user_id)


@router.get("/party/{party_id}/ratable-users", response_model=list[User])
def get_ratable_users_for_party(
    *, session: SessionDep, current_user: CurrentUser, party_id: uuid.UUID
) -> Any:
    """
    Get users that the current user can rate in a given party.
    """
    users = crud.get_ratable_users_for_party(
        session=session, party_id=party_id, current_user_id=current_user.id
    )
    return users


@router.get("/party/{party_id}/can-rate", response_model=dict[str, bool])
def check_can_rate_party(
    *, session: SessionDep, current_user: CurrentUser, party_id: uuid.UUID
) -> Any:
    """
    Check if current user can rate members in a party.
    """
    can_rate = crud.can_user_rate_party(
        session=session, party_id=party_id, user_id=current_user.id
    )
    return {"can_rate": can_rate}


@router.put("/{rating_id}", response_model=RatingPublic)
def update_rating(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    rating_id: uuid.UUID,
    rating_in: RatingUpdate,
) -> Any:
    """
    Update a rating (only by the rater).
    """
    rating = crud.get_rating(session=session, rating_id=rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    # Only allow the rater to update their own rating
    if rating.rater_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only update your own ratings"
        )

    updated_rating = crud.update_rating(
        session=session, db_rating=rating, rating_in=rating_in
    )
    return updated_rating


@router.delete("/{rating_id}")
def delete_rating(
    *, session: SessionDep, current_user: CurrentUser, rating_id: uuid.UUID
) -> Message:
    """
    Delete a rating (only by the rater).
    """
    rating = crud.get_rating(session=session, rating_id=rating_id)
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")

    # Only allow the rater to delete their own rating
    if rating.rater_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only delete your own ratings"
        )

    crud.delete_rating(session=session, rating_id=rating_id)
    return Message(message="Rating deleted successfully")


@router.get(
    "/party/{party_id}/between/{rated_user_id}", response_model=RatingPublic | None
)
def get_my_rating_for_user_in_party(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    party_id: uuid.UUID,
    rated_user_id: uuid.UUID,
) -> Any:
    """
    Get my rating for a specific user in a specific party.
    """
    rating = crud.get_rating_between_users(
        session=session,
        party_id=party_id,
        rater_id=current_user.id,
        rated_user_id=rated_user_id,
    )
    return rating
