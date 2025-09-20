from fastapi import APIRouter

from app.api.routes import (
    login,
    parties,
    private,
    quest_applications,
    quests,
    ratings,
    tags,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(quests.router)
api_router.include_router(quest_applications.router)
api_router.include_router(parties.router)
api_router.include_router(ratings.router)
api_router.include_router(tags.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
