import uuid
from typing import Any

from fastapi.testclient import TestClient
from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models.tag import (
    ProficiencyLevel,
    QuestTagCreate,
    Tag,
    TagCategory,
    TagCreate,
    TagStatus,
    UserTagCreate,
)
from app.tests.utils.factories import create_user
from app.tests.utils.quest import create_random_quest
from app.tests.utils.utils import random_lower_string


def create_test_tag(db: Session, **kwargs: Any) -> Tag:
    """Helper to create a test tag."""

    unique_suffix = str(uuid.uuid4())[:8]
    tag_data = {
        "name": f"TEST_ONLY_TAG_{unique_suffix}",  # Use TEST_ONLY_ prefix to avoid conflicts
        "slug": f"test-only-tag-{unique_suffix}",
        "category": TagCategory.PROGRAMMING,
        "description": f"Test tag description {random_lower_string()}",
        "status": TagStatus.SYSTEM,
    }
    tag_data.update(kwargs)
    tag_in = TagCreate(**tag_data)
    return crud.create_tag(session=db, tag_in=tag_in)


def test_read_tags(client: TestClient, db: Session) -> None:
    # Create test tags with unique names
    unique_name1 = f"UniqueTestTag{random_lower_string()}"
    unique_name2 = f"UniqueTestFrame{random_lower_string()}"
    _ = create_test_tag(db, category=TagCategory.PROGRAMMING, name=unique_name1)
    _ = create_test_tag(db, category=TagCategory.FRAMEWORK, name=unique_name2)

    # Test basic API structure
    response = client.get(f"{settings.API_V1_STR}/tags/")
    assert response.status_code == 200

    data = response.json()
    assert "data" in data
    assert "count" in data
    assert isinstance(data["data"], list)
    assert data["count"] >= 2  # Should have at least our tags plus system tags

    # Search for our specific tags to verify they exist
    response1 = client.get(f"{settings.API_V1_STR}/tags/?search={unique_name1}")
    assert response1.status_code == 200
    search_data1 = response1.json()
    tag_names1 = [tag["name"] for tag in search_data1["data"]]
    assert unique_name1 in tag_names1

    response2 = client.get(f"{settings.API_V1_STR}/tags/?search={unique_name2}")
    assert response2.status_code == 200
    search_data2 = response2.json()
    tag_names2 = [tag["name"] for tag in search_data2["data"]]
    assert unique_name2 in tag_names2


def test_read_tags_with_filters(client: TestClient, db: Session) -> None:
    # Create tags with different categories
    import uuid

    suffix = str(uuid.uuid4())[:8]
    programming_tag_name = f"TEST_ONLY_Python_{suffix}"
    framework_tag_name = f"TEST_ONLY_Django_{suffix}"

    _ = create_test_tag(db, category=TagCategory.PROGRAMMING, name=programming_tag_name)
    _ = create_test_tag(db, category=TagCategory.FRAMEWORK, name=framework_tag_name)

    # Test category filter
    response = client.get(
        f"{settings.API_V1_STR}/tags/?category={TagCategory.PROGRAMMING.value}"
    )
    assert response.status_code == 200

    data = response.json()
    tag_names = [tag["name"] for tag in data["data"]]
    assert programming_tag_name in tag_names
    assert framework_tag_name not in tag_names

    # Test search filter
    response = client.get(f"{settings.API_V1_STR}/tags/?search=python")
    assert response.status_code == 200

    data = response.json()
    tag_names = [tag["name"] for tag in data["data"]]
    assert programming_tag_name in tag_names


def test_read_popular_tags(client: TestClient, db: Session) -> None:
    # Create tags with different usage counts
    tag1 = create_test_tag(db)
    tag2 = create_test_tag(db)

    # Set usage counts manually
    tag1.usage_count = 10
    tag2.usage_count = 5
    db.add(tag1)
    db.add(tag2)
    db.commit()

    response = client.get(f"{settings.API_V1_STR}/tags/popular?limit=5")
    assert response.status_code == 200

    data = response.json()
    assert "data" in data
    assert len(data["data"]) > 0

    # Should be ordered by usage count (descending)
    if len(data["data"]) >= 2:
        first_tag = next(
            (tag for tag in data["data"] if tag["id"] == str(tag1.id)), None
        )
        second_tag = next(
            (tag for tag in data["data"] if tag["id"] == str(tag2.id)), None
        )
        if first_tag and second_tag:
            first_index = data["data"].index(first_tag)
            second_index = data["data"].index(second_tag)
            assert first_index < second_index  # Higher usage count should come first


def test_get_tag_suggestions(client: TestClient) -> None:
    # Test with existing system tags instead of creating conflicting ones
    response = client.get(f"{settings.API_V1_STR}/tags/suggestions?q=py")
    assert response.status_code == 200

    data = response.json()
    tag_names = [tag["name"] for tag in data["data"]]

    # Should find system tags
    assert "Python" in tag_names
    assert "PyTorch" in tag_names

    # Test with different query
    response2 = client.get(f"{settings.API_V1_STR}/tags/suggestions?q=java")
    assert response2.status_code == 200

    data2 = response2.json()
    tag_names2 = [tag["name"] for tag in data2["data"]]
    assert "JavaScript" in tag_names2


def test_get_tag_categories_with_counts(client: TestClient, db: Session) -> None:
    # Create tags in different categories
    create_test_tag(db, category=TagCategory.PROGRAMMING)
    create_test_tag(db, category=TagCategory.PROGRAMMING)
    create_test_tag(db, category=TagCategory.FRAMEWORK)

    response = client.get(f"{settings.API_V1_STR}/tags/categories")
    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, dict)
    assert TagCategory.PROGRAMMING.value in data
    assert TagCategory.FRAMEWORK.value in data
    assert data[TagCategory.PROGRAMMING.value] >= 2
    assert data[TagCategory.FRAMEWORK.value] >= 1


def test_read_tag_by_id(client: TestClient, db: Session) -> None:
    tag = create_test_tag(db)

    response = client.get(f"{settings.API_V1_STR}/tags/{tag.id}")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == str(tag.id)
    assert data["name"] == tag.name
    assert data["slug"] == tag.slug


def test_read_tag_by_slug(client: TestClient, db: Session) -> None:
    tag = create_test_tag(db, slug="unique-test-slug")

    response = client.get(f"{settings.API_V1_STR}/tags/slug/unique-test-slug")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == str(tag.id)
    assert data["slug"] == "unique-test-slug"


def test_read_tag_not_found(client: TestClient) -> None:
    fake_id = uuid.uuid4()
    response = client.get(f"{settings.API_V1_STR}/tags/{fake_id}")
    assert response.status_code == 404


def test_create_tag_admin(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    tag_name = f"New Tag {random_lower_string().title()}"
    tag_slug = random_lower_string()

    data = {
        "name": tag_name,
        "slug": tag_slug,
        "category": TagCategory.PROGRAMMING.value,
        "description": "A new test tag",
        "status": TagStatus.APPROVED.value,
    }

    response = client.post(
        f"{settings.API_V1_STR}/tags/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200

    created_tag = response.json()
    assert created_tag["name"] == tag_name
    assert created_tag["slug"] == tag_slug
    assert created_tag["category"] == TagCategory.PROGRAMMING.value


def test_create_tag_normal_user_forbidden(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    data = {
        "name": "Test Tag",
        "slug": "test-tag",
        "category": TagCategory.PROGRAMMING.value,
        "description": "A test tag",
    }

    response = client.post(
        f"{settings.API_V1_STR}/tags/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_create_tag_duplicate_name(
    client: TestClient, db: Session, superuser_token_headers: dict[str, str]
) -> None:
    # Create existing tag
    _ = create_test_tag(db, name="Duplicate Tag")

    # Try to create tag with same name
    data = {
        "name": "Duplicate Tag",
        "slug": "different-slug",
        "category": TagCategory.PROGRAMMING.value,
        "description": "Should fail",
    }

    response = client.post(
        f"{settings.API_V1_STR}/tags/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 400


def test_update_tag_admin(
    client: TestClient, db: Session, superuser_token_headers: dict[str, str]
) -> None:
    tag = create_test_tag(db)
    new_name = f"Updated {random_lower_string().title()}"

    data = {
        "name": new_name,
        "description": "Updated description",
    }

    response = client.patch(
        f"{settings.API_V1_STR}/tags/{tag.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200

    updated_tag = response.json()
    assert updated_tag["name"] == new_name
    assert updated_tag["description"] == "Updated description"


def test_delete_tag_admin(
    client: TestClient, db: Session, superuser_token_headers: dict[str, str]
) -> None:
    tag = create_test_tag(db)

    response = client.delete(
        f"{settings.API_V1_STR}/tags/{tag.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200

    # Verify tag is deleted
    response = client.get(f"{settings.API_V1_STR}/tags/{tag.id}")
    assert response.status_code == 404


# User Tag endpoints tests
def test_read_my_user_tags(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    # Get the normal user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    user = user_response.json()
    user_id = uuid.UUID(user["id"])

    # Create tags and user-tag relationships
    tag1 = create_test_tag(db)
    tag2 = create_test_tag(db)

    user_tag_in1 = UserTagCreate(
        tag_id=tag1.id, proficiency_level=ProficiencyLevel.INTERMEDIATE
    )
    user_tag_in2 = UserTagCreate(
        tag_id=tag2.id, proficiency_level=ProficiencyLevel.EXPERT
    )

    crud.create_user_tag(session=db, user_tag_in=user_tag_in1, user_id=user_id)
    crud.create_user_tag(session=db, user_tag_in=user_tag_in2, user_id=user_id)

    response = client.get(
        f"{settings.API_V1_STR}/tags/users/me",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    data = response.json()
    assert len(data["data"]) == 2
    tag_ids = [ut["tag_id"] for ut in data["data"]]
    assert str(tag1.id) in tag_ids
    assert str(tag2.id) in tag_ids


def test_create_my_user_tag(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    tag = create_test_tag(db)

    data = {
        "tag_id": str(tag.id),
        "proficiency_level": ProficiencyLevel.INTERMEDIATE.value,
        "is_primary": True,
    }

    response = client.post(
        f"{settings.API_V1_STR}/tags/users/me",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200

    user_tag = response.json()
    assert user_tag["tag_id"] == str(tag.id)
    assert user_tag["proficiency_level"] == ProficiencyLevel.INTERMEDIATE.value
    assert user_tag["is_primary"] is True


def test_create_user_tag_nonexistent_tag(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    fake_tag_id = uuid.uuid4()

    data = {
        "tag_id": str(fake_tag_id),
        "proficiency_level": ProficiencyLevel.INTERMEDIATE.value,
    }

    response = client.post(
        f"{settings.API_V1_STR}/tags/users/me",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 404


def test_update_my_user_tag(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    user = user_response.json()
    user_id = uuid.UUID(user["id"])

    tag = create_test_tag(db)

    # Create user tag
    user_tag_in = UserTagCreate(
        tag_id=tag.id, proficiency_level=ProficiencyLevel.BEGINNER
    )
    crud.create_user_tag(session=db, user_tag_in=user_tag_in, user_id=user_id)

    # Update it
    data = {
        "proficiency_level": ProficiencyLevel.EXPERT.value,
        "is_primary": True,
    }

    response = client.patch(
        f"{settings.API_V1_STR}/tags/users/me/{tag.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200

    updated_user_tag = response.json()
    assert updated_user_tag["proficiency_level"] == ProficiencyLevel.EXPERT.value
    assert updated_user_tag["is_primary"] is True


def test_delete_my_user_tag(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    user = user_response.json()
    user_id = uuid.UUID(user["id"])

    tag = create_test_tag(db)

    # Create user tag
    user_tag_in = UserTagCreate(
        tag_id=tag.id, proficiency_level=ProficiencyLevel.INTERMEDIATE
    )
    crud.create_user_tag(session=db, user_tag_in=user_tag_in, user_id=user_id)

    # Delete it
    response = client.delete(
        f"{settings.API_V1_STR}/tags/users/me/{tag.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    # Verify it's deleted
    response = client.get(
        f"{settings.API_V1_STR}/tags/users/me",
        headers=normal_user_token_headers,
    )
    data = response.json()
    tag_ids = [ut["tag_id"] for ut in data["data"]]
    assert str(tag.id) not in tag_ids


def test_read_user_tags_public(client: TestClient, db: Session) -> None:
    user = create_user(db)
    tag = create_test_tag(db)

    # Create user tag
    user_tag_in = UserTagCreate(
        tag_id=tag.id, proficiency_level=ProficiencyLevel.INTERMEDIATE
    )
    crud.create_user_tag(session=db, user_tag_in=user_tag_in, user_id=user.id)

    response = client.get(f"{settings.API_V1_STR}/tags/users/{user.id}")
    assert response.status_code == 200

    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["tag_id"] == str(tag.id)


# Quest Tag endpoints tests
def test_read_quest_tags(client: TestClient, db: Session) -> None:
    user = create_user(db)
    quest = create_random_quest(db, creator_id=user.id)
    tag = create_test_tag(db)

    # Create quest tag
    quest_tag_in = QuestTagCreate(
        tag_id=tag.id, is_required=True, min_proficiency=ProficiencyLevel.ADVANCED
    )
    crud.create_quest_tag(session=db, quest_tag_in=quest_tag_in, quest_id=quest.id)

    response = client.get(f"{settings.API_V1_STR}/tags/quests/{quest.id}")
    assert response.status_code == 200

    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["tag_id"] == str(tag.id)
    assert data["data"][0]["is_required"] is True
    assert data["data"][0]["min_proficiency"] == ProficiencyLevel.ADVANCED.value


def test_create_quest_tag_owner(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    user = user_response.json()
    user_id = uuid.UUID(user["id"])

    quest = create_random_quest(db, creator_id=user_id)
    tag = create_test_tag(db)

    data = {
        "tag_id": str(tag.id),
        "is_required": True,
        "min_proficiency": ProficiencyLevel.INTERMEDIATE.value,
    }

    response = client.post(
        f"{settings.API_V1_STR}/tags/quests/{quest.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200

    quest_tag = response.json()
    assert quest_tag["tag_id"] == str(tag.id)
    assert quest_tag["is_required"] is True
    assert quest_tag["min_proficiency"] == ProficiencyLevel.INTERMEDIATE.value


def test_create_quest_tag_non_owner_forbidden(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    # Create quest owned by different user
    other_user = create_user(db)
    quest = create_random_quest(db, creator_id=other_user.id)
    tag = create_test_tag(db)

    data = {
        "tag_id": str(tag.id),
        "is_required": True,
        "min_proficiency": ProficiencyLevel.ADVANCED.value,
    }

    response = client.post(
        f"{settings.API_V1_STR}/tags/quests/{quest.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403


def test_update_quest_tag_owner(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    user = user_response.json()
    user_id = uuid.UUID(user["id"])

    quest = create_random_quest(db, creator_id=user_id)
    tag = create_test_tag(db)

    # Create quest tag
    quest_tag_in = QuestTagCreate(
        tag_id=tag.id, is_required=False, min_proficiency=ProficiencyLevel.BEGINNER
    )
    crud.create_quest_tag(session=db, quest_tag_in=quest_tag_in, quest_id=quest.id)

    # Update it
    data = {
        "is_required": True,
        "min_proficiency": ProficiencyLevel.EXPERT.value,
    }

    response = client.patch(
        f"{settings.API_V1_STR}/tags/quests/{quest.id}/{tag.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 200

    updated_quest_tag = response.json()
    assert updated_quest_tag["is_required"] is True
    assert updated_quest_tag["min_proficiency"] == ProficiencyLevel.EXPERT.value


def test_delete_quest_tag_owner(
    client: TestClient, db: Session, normal_user_token_headers: dict[str, str]
) -> None:
    # Get current user
    user_response = client.get(
        f"{settings.API_V1_STR}/users/me",
        headers=normal_user_token_headers,
    )
    user = user_response.json()
    user_id = uuid.UUID(user["id"])

    quest = create_random_quest(db, creator_id=user_id)
    tag = create_test_tag(db)

    # Create quest tag
    quest_tag_in = QuestTagCreate(
        tag_id=tag.id, is_required=False, min_proficiency=ProficiencyLevel.BEGINNER
    )
    crud.create_quest_tag(session=db, quest_tag_in=quest_tag_in, quest_id=quest.id)

    # Delete it
    response = client.delete(
        f"{settings.API_V1_STR}/tags/quests/{quest.id}/{tag.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 200

    # Verify it's deleted
    response = client.get(f"{settings.API_V1_STR}/tags/quests/{quest.id}")
    data = response.json()
    tag_ids = [qt["tag_id"] for qt in data["data"]]
    assert str(tag.id) not in tag_ids
