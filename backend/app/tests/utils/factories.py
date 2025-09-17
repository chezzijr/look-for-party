import uuid
from datetime import timedelta

import factory
from sqlmodel import Session

from app import crud
from app.models import (
    LocationType,
    CommitmentLevel,
    Party,
    PartyCreate,
    PartyMember,
    PartyMemberCreate,
    PartyMemberRole,
    PartyStatus,
    Quest,
    QuestApplication,
    QuestApplicationCreate,
    QuestCategory,
    QuestCreate,
    QuestType,
    QuestVisibility,
    User,
    UserCreate,
)
from app.tests.utils.utils import random_email, random_lower_string


# User Factories
class UserCreateFactory(factory.Factory):
    class Meta:
        model = UserCreate

    email = factory.LazyFunction(random_email)
    password = factory.LazyFunction(random_lower_string)
    full_name = factory.Faker("name")
    bio = factory.Faker("paragraph", nb_sentences=3)
    location = factory.Faker("city")
    timezone = factory.Faker("timezone")


def create_user(db: Session, **kwargs) -> User:
    """Create a user with factory-generated data."""
    user_in = UserCreateFactory(**kwargs)
    return crud.create_user(session=db, user_create=user_in)


# Quest Factories
class QuestCreateFactory(factory.Factory):
    class Meta:
        model = QuestCreate

    title = factory.Faker("sentence", nb_words=4)
    description = factory.Faker("text", max_nb_chars=500)
    objective = factory.Faker("sentence", nb_words=8)
    category = factory.Faker(
        "random_element", elements=[e.value for e in QuestCategory]
    )
    party_size_min = factory.Faker("random_int", min=1, max=3)
    party_size_max = factory.Faker("random_int", min=4, max=8)
    required_commitment = factory.Faker(
        "random_element", elements=[e.value for e in CommitmentLevel]
    )
    location_type = factory.Faker(
        "random_element", elements=[e.value for e in LocationType]
    )
    location_detail = factory.Faker("address")
    starts_at = factory.Faker("future_datetime", end_date="+30d")
    deadline = factory.LazyAttribute(
        lambda obj: obj.starts_at + timedelta(days=1) if obj.starts_at else None
    )
    estimated_duration = factory.Faker(
        "random_element",
        elements=["1-2 hours", "Half day", "Full day", "Weekend", "1 week"],
    )
    auto_approve = factory.Faker("boolean")
    visibility = factory.Faker(
        "random_element", elements=[e.value for e in QuestVisibility]
    )


def create_quest(db: Session, creator_id: uuid.UUID | None = None, party_id: uuid.UUID | None = None, **kwargs) -> Quest:
    """Create a quest with factory-generated data.
    
    Args:
        db: Database session
        creator_id: ID of quest creator. If None, creates a new user.
        party_id: ID of party for internal quests. If provided, creates PARTY_INTERNAL quest.
        **kwargs: Additional quest attributes to override factory defaults
    """
    if creator_id is None:
        creator = create_user(db)
        creator_id = creator.id

    # Set party-specific defaults if party_id is provided
    if party_id is not None:
        kwargs.setdefault('quest_type', QuestType.PARTY_INTERNAL)
        kwargs.setdefault('visibility', QuestVisibility.PRIVATE)
    else:
        kwargs.setdefault('quest_type', QuestType.INDIVIDUAL)
        kwargs.setdefault('visibility', QuestVisibility.PUBLIC)

    quest_in = QuestCreateFactory(**kwargs)
    quest = crud.create_quest(session=db, quest_in=quest_in, creator_id=creator_id)
    
    # Set parent_party_id after creation since it's not in QuestCreate model
    if party_id is not None:
        quest.parent_party_id = party_id
        quest.quest_type = QuestType.PARTY_INTERNAL
        quest.visibility = QuestVisibility.PRIVATE
        db.add(quest)
        db.commit()
        db.refresh(quest)
    
    return quest


# Quest Application Factories
class QuestApplicationCreateFactory(factory.Factory):
    class Meta:
        model = QuestApplicationCreate

    message = factory.Faker("paragraph", nb_sentences=3)
    proposed_role = factory.Faker("job")
    relevant_skills = factory.Faker("sentence", nb_words=8)


def create_quest_application(
    db: Session, quest_id: uuid.UUID = None, applicant_id: uuid.UUID = None, **kwargs
) -> QuestApplication:
    """Create a quest application with factory-generated data."""
    if quest_id is None:
        quest = create_quest(db)
        quest_id = quest.id

    if applicant_id is None:
        applicant = create_user(db)
        applicant_id = applicant.id

    application_in = QuestApplicationCreateFactory(**kwargs)
    return crud.create_quest_application(
        session=db,
        application_in=application_in,
        quest_id=quest_id,
        applicant_id=applicant_id,
    )


# Party Factories
class PartyCreateFactory(factory.Factory):
    class Meta:
        model = PartyCreate

    quest_id = factory.LazyFunction(uuid.uuid4)
    status = factory.Faker("random_element", elements=[e.value for e in PartyStatus])
    chat_channel_id = factory.Faker("uuid4")


def create_party(db: Session, quest_id: uuid.UUID = None, **kwargs) -> Party:
    """Create a party with factory-generated data."""
    if quest_id is None:
        quest = create_quest(db)
        quest_id = quest.id

    party_in = PartyCreate(quest_id=quest_id, **kwargs)
    return crud.create_party(session=db, party_in=party_in)


# Party Member Factories
class PartyMemberCreateFactory(factory.Factory):
    class Meta:
        model = PartyMemberCreate

    user_id = factory.LazyFunction(uuid.uuid4)
    role = factory.Faker(
        "random_element", elements=[e.value for e in PartyMemberRole]
    )
    status = "active"


def create_party_member(
    db: Session, party_id: uuid.UUID = None, user_id: uuid.UUID = None, **kwargs
) -> PartyMember:
    """Create a party member with factory-generated data."""
    if party_id is None:
        party = create_party(db)
        party_id = party.id

    if user_id is None:
        user = create_user(db)
        user_id = user.id

    member_in = PartyMemberCreateFactory(user_id=user_id, **kwargs)
    return crud.create_party_member(session=db, member_in=member_in, party_id=party_id)


# Convenience functions for creating complete scenarios
def create_quest_with_applications(
    db: Session, num_applications: int = 3
) -> tuple[Quest, list[QuestApplication]]:
    """Create a quest with multiple applications."""
    quest = create_quest(db)
    applications = []

    for _ in range(num_applications):
        application = create_quest_application(db, quest_id=quest.id)
        applications.append(application)

    return quest, applications


def create_party_with_members(
    db: Session, num_members: int = 3
) -> tuple[Party, list[PartyMember]]:
    """Create a party with multiple members."""
    quest = create_quest(db)
    party = create_party(db, quest_id=quest.id)
    members = []

    # Add quest creator as owner
    creator_member = create_party_member(
        db, party_id=party.id, user_id=quest.creator_id, role=PartyMemberRole.OWNER
    )
    members.append(creator_member)

    # Add additional members
    for _ in range(num_members - 1):
        member = create_party_member(db, party_id=party.id)
        members.append(member)

    return party, members
