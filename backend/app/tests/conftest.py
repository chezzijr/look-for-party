from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

from app.core.config import settings
from app.core.db import engine, init_db
from app.main import app
from app.models import Party, PartyMember, Quest, QuestApplication, User
from app.models.rating import Rating
from app.models.tag import Tag, UserTag, QuestTag
from app.tests.utils.party import PartyFactory
from app.tests.utils.quest import QuestApplicationFactory, QuestFactory
from app.tests.utils.user import authentication_token_from_email
from app.tests.utils.utils import get_superuser_token_headers


@pytest.fixture(scope="session", autouse=True)
def db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        init_db(session)
        yield session
        # Delete in proper order due to foreign key constraints
        statement = delete(Rating)
        session.execute(statement)
        statement = delete(PartyMember)
        session.execute(statement)
        statement = delete(Party)
        session.execute(statement)
        statement = delete(QuestApplication)
        session.execute(statement)
        statement = delete(UserTag)
        session.execute(statement)
        statement = delete(QuestTag)
        session.execute(statement)
        statement = delete(Quest)
        session.execute(statement)
        statement = delete(Tag)
        session.execute(statement)
        statement = delete(User)
        session.execute(statement)
        session.commit()


@pytest.fixture(scope="module")
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )


# Factory data fixtures that handle JSON serialization
@pytest.fixture
def quest_data() -> dict:
    """Generate quest data properly serialized for JSON requests."""
    import json

    return json.loads(QuestFactory().model_dump_json())


@pytest.fixture
def quest_application_data() -> dict:
    """Generate quest application data properly serialized for JSON requests."""
    import json

    return json.loads(QuestApplicationFactory().model_dump_json())


@pytest.fixture
def party_data() -> dict:
    """Generate party data properly serialized for JSON requests."""
    import json

    return json.loads(PartyFactory().model_dump_json())
