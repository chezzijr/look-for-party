import uuid
from typing import Any

from sqlmodel import Session

from app import crud
from app.models.tag import (
    ProficiencyLevel,
    QuestTagCreate,
    QuestTagUpdate,
    Tag,
    TagCategory,
    TagCreate,
    TagStatus,
    TagUpdate,
    UserTagCreate,
    UserTagUpdate,
)
from app.tests.utils.factories import create_user
from app.tests.utils.quest import create_random_quest
from app.tests.utils.utils import random_lower_string


def create_test_tag(db: Session, **kwargs: Any) -> Tag:
    """Create a test tag with random data."""
    unique_suffix = str(uuid.uuid4())[:8]  # Get unique 8-char suffix
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


def test_create_tag(db: Session) -> None:
    unique_suffix = str(uuid.uuid4())[:8]
    name = f"TEST_ONLY_CreateTag_{unique_suffix}"
    slug = f"test-only-create-tag-{unique_suffix}"
    description = f"Test description {random_lower_string()}"

    tag_in = TagCreate(
        name=name,
        slug=slug,
        category=TagCategory.PROGRAMMING,
        description=description,
        status=TagStatus.SYSTEM,
    )
    tag = crud.create_tag(session=db, tag_in=tag_in)

    assert tag.name == name
    assert tag.slug == slug
    assert tag.category == TagCategory.PROGRAMMING
    assert tag.description == description
    assert tag.status == TagStatus.SYSTEM
    assert tag.usage_count == 0
    assert tag.id is not None


def test_get_tag(db: Session) -> None:
    tag = create_test_tag(db)
    retrieved_tag = crud.get_tag(session=db, tag_id=tag.id)

    assert retrieved_tag
    assert retrieved_tag.id == tag.id
    assert retrieved_tag.name == tag.name


def test_get_tag_by_slug(db: Session) -> None:
    unique_slug = f"test-only-unique-slug-{str(uuid.uuid4())[:8]}"
    tag = create_test_tag(db, slug=unique_slug)
    retrieved_tag = crud.get_tag_by_slug(session=db, slug=unique_slug)

    assert retrieved_tag
    assert retrieved_tag.id == tag.id
    assert retrieved_tag.slug == unique_slug


def test_get_tag_by_name(db: Session) -> None:
    tag_name = f"TEST_ONLY_Unique_Name_{random_lower_string()}"
    tag = create_test_tag(db, name=tag_name)
    retrieved_tag = crud.get_tag_by_name(session=db, name=tag_name)

    assert retrieved_tag
    assert retrieved_tag.id == tag.id
    assert retrieved_tag.name == tag_name


def test_get_tags(db: Session) -> None:
    # Create tags with different categories and statuses
    tag1 = create_test_tag(
        db, category=TagCategory.PROGRAMMING, status=TagStatus.SYSTEM
    )
    tag2 = create_test_tag(
        db, category=TagCategory.FRAMEWORK, status=TagStatus.APPROVED
    )
    tag3 = create_test_tag(
        db, category=TagCategory.PROGRAMMING, status=TagStatus.PENDING
    )

    # Test basic retrieval (only returns SYSTEM and APPROVED by default)
    tags = crud.get_tags(session=db, limit=1000)  # Increase limit to capture more tags
    tag_ids = [tag.id for tag in tags]
    assert tag1.id in tag_ids
    assert tag2.id in tag_ids
    # tag3 should be filtered out (only SYSTEM and APPROVED by default)
    assert tag3.id not in tag_ids

    # Test category filter
    programming_tags = crud.get_tags(
        session=db, category=TagCategory.PROGRAMMING, limit=1000
    )
    programming_ids = [tag.id for tag in programming_tags]
    assert tag1.id in programming_ids
    assert tag2.id not in programming_ids

    # Test status filter
    pending_tags = crud.get_tags(session=db, status=TagStatus.PENDING)
    pending_ids = [tag.id for tag in pending_tags]
    assert tag3.id in pending_ids
    assert tag1.id not in pending_ids

    # Test search
    search_term = tag1.name[
        :8
    ].upper()  # Use first 8 chars and make uppercase to match TEST_ONLY
    searched_tags = crud.get_tags(session=db, search=search_term, limit=1000)
    searched_ids = [tag.id for tag in searched_tags]
    assert tag1.id in searched_ids


def test_update_tag(db: Session) -> None:
    tag = create_test_tag(db)
    new_name = f"TEST_ONLY_Updated_{random_lower_string().title()}"
    new_description = f"Updated description {random_lower_string()}"

    tag_update = TagUpdate(name=new_name, description=new_description)
    updated_tag = crud.update_tag(session=db, db_tag=tag, tag_in=tag_update)

    assert updated_tag.id == tag.id
    assert updated_tag.name == new_name
    assert updated_tag.description == new_description
    assert updated_tag.slug == tag.slug  # Should remain unchanged


def test_delete_tag(db: Session) -> None:
    tag = create_test_tag(db)
    tag_id = tag.id

    crud.delete_tag(session=db, tag_id=tag_id)

    deleted_tag = crud.get_tag(session=db, tag_id=tag_id)
    assert deleted_tag is None


def test_get_popular_tags(db: Session) -> None:
    # Create tags with different usage counts
    tag1 = create_test_tag(db)
    tag2 = create_test_tag(db)
    tag3 = create_test_tag(db)

    # Manually set usage counts high enough to not be interfered with by system tags
    tag1.usage_count = 1000
    tag2.usage_count = 500
    tag3.usage_count = 1500
    db.add(tag1)
    db.add(tag2)
    db.add(tag3)
    db.commit()

    popular_tags = crud.get_popular_tags(session=db, limit=3)

    assert len(popular_tags) >= 2  # Should have at least our tags
    # Find our test tags in the results
    tag_ids = [tag.id for tag in popular_tags]
    assert tag3.id in tag_ids  # Highest usage count should be in results
    assert tag1.id in tag_ids  # Second highest should be in results

    # Check that tag3 comes before tag1 (higher usage count first)
    tag3_index = next(i for i, tag in enumerate(popular_tags) if tag.id == tag3.id)
    tag1_index = next(i for i, tag in enumerate(popular_tags) if tag.id == tag1.id)
    assert tag3_index < tag1_index


def test_get_tag_suggestions(db: Session) -> None:
    # Test with system tags that should already exist
    # Search for "py" should return Python and PyTorch from system tags
    suggestions = crud.get_tag_suggestions(session=db, query="py", limit=10)
    suggestion_names = [tag.name for tag in suggestions]

    # Should find system tags Python and PyTorch
    assert "Python" in suggestion_names
    assert "PyTorch" in suggestion_names

    # Test with a different search
    js_suggestions = crud.get_tag_suggestions(session=db, query="java", limit=10)
    js_suggestion_names = [tag.name for tag in js_suggestions]

    # Should find JavaScript and Java from system tags
    assert "JavaScript" in js_suggestion_names


def test_increment_tag_usage(db: Session) -> None:
    tag = create_test_tag(db)
    initial_count = tag.usage_count

    crud.increment_tag_usage(session=db, tag_id=tag.id)

    # Refresh tag from database
    db.refresh(tag)
    assert tag.usage_count == initial_count + 1


def test_get_tag_categories_with_counts(db: Session) -> None:
    # Create tags in different categories
    create_test_tag(db, category=TagCategory.PROGRAMMING)
    create_test_tag(db, category=TagCategory.PROGRAMMING)
    create_test_tag(db, category=TagCategory.FRAMEWORK)

    counts = crud.get_tag_categories_with_counts(session=db)

    assert TagCategory.PROGRAMMING.value in counts
    assert TagCategory.FRAMEWORK.value in counts
    assert counts[TagCategory.PROGRAMMING.value] >= 2
    assert counts[TagCategory.FRAMEWORK.value] >= 1


# UserTag tests
def test_create_user_tag(db: Session) -> None:
    user = create_user(db)
    tag = create_test_tag(db)

    user_tag_in = UserTagCreate(
        tag_id=tag.id,
        proficiency_level=ProficiencyLevel.INTERMEDIATE,
        is_primary=True,
    )
    user_tag = crud.create_user_tag(
        session=db, user_tag_in=user_tag_in, user_id=user.id
    )

    assert user_tag.user_id == user.id
    assert user_tag.tag_id == tag.id
    assert user_tag.proficiency_level == ProficiencyLevel.INTERMEDIATE
    assert user_tag.is_primary is True

    # Check that tag usage count was incremented
    db.refresh(tag)
    assert tag.usage_count == 1


def test_get_user_tags(db: Session) -> None:
    user = create_user(db)
    tag1 = create_test_tag(db)
    tag2 = create_test_tag(db)

    # Create user tags
    user_tag_in1 = UserTagCreate(
        tag_id=tag1.id, proficiency_level=ProficiencyLevel.BEGINNER
    )
    user_tag_in2 = UserTagCreate(
        tag_id=tag2.id, proficiency_level=ProficiencyLevel.EXPERT
    )

    crud.create_user_tag(session=db, user_tag_in=user_tag_in1, user_id=user.id)
    crud.create_user_tag(session=db, user_tag_in=user_tag_in2, user_id=user.id)

    user_tags = crud.get_user_tags(session=db, user_id=user.id)

    assert len(user_tags) == 2
    tag_ids = [ut.tag_id for ut in user_tags]
    assert tag1.id in tag_ids
    assert tag2.id in tag_ids


def test_get_user_tag(db: Session) -> None:
    user = create_user(db)
    tag = create_test_tag(db)

    user_tag_in = UserTagCreate(
        tag_id=tag.id, proficiency_level=ProficiencyLevel.INTERMEDIATE
    )
    _ = crud.create_user_tag(session=db, user_tag_in=user_tag_in, user_id=user.id)

    retrieved_user_tag = crud.get_user_tag(session=db, user_id=user.id, tag_id=tag.id)

    assert retrieved_user_tag
    assert retrieved_user_tag.user_id == user.id
    assert retrieved_user_tag.tag_id == tag.id
    assert retrieved_user_tag.proficiency_level == ProficiencyLevel.INTERMEDIATE


def test_update_user_tag(db: Session) -> None:
    user = create_user(db)
    tag = create_test_tag(db)

    user_tag_in = UserTagCreate(
        tag_id=tag.id, proficiency_level=ProficiencyLevel.BEGINNER
    )
    user_tag = crud.create_user_tag(
        session=db, user_tag_in=user_tag_in, user_id=user.id
    )

    user_tag_update = UserTagUpdate(
        proficiency_level=ProficiencyLevel.ADVANCED, is_primary=True
    )
    updated_user_tag = crud.update_user_tag(
        session=db, db_user_tag=user_tag, user_tag_in=user_tag_update
    )

    assert updated_user_tag.proficiency_level == ProficiencyLevel.ADVANCED
    assert updated_user_tag.is_primary is True


def test_delete_user_tag(db: Session) -> None:
    user = create_user(db)
    tag = create_test_tag(db)

    user_tag_in = UserTagCreate(
        tag_id=tag.id, proficiency_level=ProficiencyLevel.INTERMEDIATE
    )
    crud.create_user_tag(session=db, user_tag_in=user_tag_in, user_id=user.id)

    crud.delete_user_tag(session=db, user_id=user.id, tag_id=tag.id)

    deleted_user_tag = crud.get_user_tag(session=db, user_id=user.id, tag_id=tag.id)
    assert deleted_user_tag is None


# QuestTag tests
def test_create_quest_tag(db: Session) -> None:
    user = create_user(db)
    quest = create_random_quest(db, creator_id=user.id)
    tag = create_test_tag(db)

    quest_tag_in = QuestTagCreate(
        tag_id=tag.id,
        is_required=True,
        min_proficiency=ProficiencyLevel.INTERMEDIATE,
    )
    quest_tag = crud.create_quest_tag(
        session=db, quest_tag_in=quest_tag_in, quest_id=quest.id
    )

    assert quest_tag.quest_id == quest.id
    assert quest_tag.tag_id == tag.id
    assert quest_tag.is_required is True
    assert quest_tag.min_proficiency == ProficiencyLevel.INTERMEDIATE

    # Check that tag usage count was incremented
    db.refresh(tag)
    assert tag.usage_count == 1


def test_get_quest_tags(db: Session) -> None:
    user = create_user(db)
    quest = create_random_quest(db, creator_id=user.id)
    tag1 = create_test_tag(db)
    tag2 = create_test_tag(db)

    # Create quest tags
    quest_tag_in1 = QuestTagCreate(
        tag_id=tag1.id, is_required=True, min_proficiency=ProficiencyLevel.INTERMEDIATE
    )
    quest_tag_in2 = QuestTagCreate(
        tag_id=tag2.id, is_required=False, min_proficiency=ProficiencyLevel.BEGINNER
    )

    crud.create_quest_tag(session=db, quest_tag_in=quest_tag_in1, quest_id=quest.id)
    crud.create_quest_tag(session=db, quest_tag_in=quest_tag_in2, quest_id=quest.id)

    quest_tags = crud.get_quest_tags(session=db, quest_id=quest.id)

    assert len(quest_tags) == 2
    tag_ids = [qt.tag_id for qt in quest_tags]
    assert tag1.id in tag_ids
    assert tag2.id in tag_ids


def test_get_quest_tag(db: Session) -> None:
    user = create_user(db)
    quest = create_random_quest(db, creator_id=user.id)
    tag = create_test_tag(db)

    quest_tag_in = QuestTagCreate(
        tag_id=tag.id, is_required=True, min_proficiency=ProficiencyLevel.INTERMEDIATE
    )
    _ = crud.create_quest_tag(session=db, quest_tag_in=quest_tag_in, quest_id=quest.id)

    retrieved_quest_tag = crud.get_quest_tag(
        session=db, quest_id=quest.id, tag_id=tag.id
    )

    assert retrieved_quest_tag
    assert retrieved_quest_tag.quest_id == quest.id
    assert retrieved_quest_tag.tag_id == tag.id
    assert retrieved_quest_tag.is_required is True
    assert retrieved_quest_tag.min_proficiency == ProficiencyLevel.INTERMEDIATE


def test_update_quest_tag(db: Session) -> None:
    user = create_user(db)
    quest = create_random_quest(db, creator_id=user.id)
    tag = create_test_tag(db)

    quest_tag_in = QuestTagCreate(
        tag_id=tag.id, is_required=False, min_proficiency=ProficiencyLevel.BEGINNER
    )
    quest_tag = crud.create_quest_tag(
        session=db, quest_tag_in=quest_tag_in, quest_id=quest.id
    )

    quest_tag_update = QuestTagUpdate(
        is_required=True, min_proficiency=ProficiencyLevel.EXPERT
    )
    updated_quest_tag = crud.update_quest_tag(
        session=db, db_quest_tag=quest_tag, quest_tag_in=quest_tag_update
    )

    assert updated_quest_tag.is_required is True
    assert updated_quest_tag.min_proficiency == ProficiencyLevel.EXPERT


def test_delete_quest_tag(db: Session) -> None:
    user = create_user(db)
    quest = create_random_quest(db, creator_id=user.id)
    tag = create_test_tag(db)

    quest_tag_in = QuestTagCreate(
        tag_id=tag.id, is_required=False, min_proficiency=ProficiencyLevel.BEGINNER
    )
    crud.create_quest_tag(session=db, quest_tag_in=quest_tag_in, quest_id=quest.id)

    crud.delete_quest_tag(session=db, quest_id=quest.id, tag_id=tag.id)

    deleted_quest_tag = crud.get_quest_tag(session=db, quest_id=quest.id, tag_id=tag.id)
    assert deleted_quest_tag is None
