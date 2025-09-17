"""
Tests for Quest Creation Flow as described in FLOWS.md

This module tests the complete quest creation and management system supporting:
1. Individual Quest Creation (New Party Formation)
2. Quest Requirements and Validation
3. Quest Management Operations
4. Application Review Process
5. Quest Closure Scenarios
6. Expected Failure Cases
"""

import uuid
from datetime import datetime, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app import crud
from app.core.config import settings
from app.models import (
    Quest,
    QuestCategory,
    QuestStatus,
    QuestVisibility,
    QuestCreate,
    QuestUpdate,
    LocationType,
    CommitmentLevel,
    QuestType,
    User,
    QuestApplication,
    ApplicationStatus,
)
from app.models.tag import (
    Tag,
    TagCategory,
    TagCreate,
    TagStatus,
    QuestTag,
    QuestTagCreate,
    ProficiencyLevel,
)
from app.tests.utils.user import authentication_token_from_email, create_random_user
from app.tests.utils.utils import random_email, random_lower_string
from app.tests.utils.quest import create_random_quest


def create_system_tag(db: Session, name: str, category: TagCategory) -> Tag:
    """Helper to create a system tag for testing."""
    unique_suffix = str(uuid.uuid4())[:8]
    tag_data = {
        "name": f"{name}_{unique_suffix}",
        "slug": f"{name.lower().replace(' ', '-')}-{unique_suffix}",
        "category": category,
        "description": f"System tag for {name}",
        "status": TagStatus.SYSTEM,
    }
    tag_in = TagCreate(**tag_data)
    return crud.create_tag(session=db, tag_in=tag_in)


def create_basic_quest_data() -> dict[str, Any]:
    """Helper to create basic quest data."""
    return {
        "title": "Looking for teammates for weekend hackathon",
        "description": "Building a web application to solve local community problems. Need developers with React and Python experience. Great learning opportunity!",
        "objective": "Build a functional MVP in 48 hours",
        "category": QuestCategory.PROFESSIONAL,
        "party_size_min": 2,
        "party_size_max": 4,
        "required_commitment": CommitmentLevel.MODERATE,
        "location_type": LocationType.REMOTE,
        "estimated_duration": "48 hours",
        "visibility": QuestVisibility.PUBLIC,
    }


class TestQuestCreationWizard:
    """Test Individual Quest Creation with All Required Fields"""

    @pytest.fixture
    def quest_creator_headers(self, client: TestClient, db: Session) -> dict[str, str]:
        """Create a quest creator and return authentication headers"""
        email = random_email()
        return authentication_token_from_email(client=client, email=email, db=db)

    def test_individual_quest_creation_success(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: User Idea → Create Quest → Set Requirements → Publish"""

        quest_data = create_basic_quest_data()

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=quest_creator_headers,
            json=quest_data,
        )
        assert response.status_code == 200

        quest = response.json()
        assert quest["title"] == quest_data["title"]
        assert quest["description"] == quest_data["description"]
        assert quest["category"] == quest_data["category"]
        assert quest["status"] == QuestStatus.RECRUITING
        assert quest["quest_type"] == QuestType.INDIVIDUAL
        assert quest["party_size_min"] == quest_data["party_size_min"]
        assert quest["party_size_max"] == quest_data["party_size_max"]
        assert quest["visibility"] == quest_data["visibility"]

        # Verify in database
        quest_db = db.exec(select(Quest).where(Quest.id == quest["id"])).first()
        assert quest_db is not None
        assert quest_db.status == QuestStatus.RECRUITING
        assert quest_db.current_party_size == 1  # Creator counts as 1

    def test_quest_creation_with_minimum_requirements(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Quest creation with minimal required fields"""

        minimal_quest_data = {
            "title": "Simple quest",
            "description": "This is a minimal quest description that meets the minimum length requirement.",
            "objective": "Complete simple objective",
            "category": QuestCategory.SOCIAL,
            "party_size_min": 1,
            "party_size_max": 2,
            "required_commitment": CommitmentLevel.CASUAL,
            "location_type": LocationType.REMOTE,
        }

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=quest_creator_headers,
            json=minimal_quest_data,
        )
        assert response.status_code == 200

        quest = response.json()
        assert quest["title"] == minimal_quest_data["title"]
        assert quest["visibility"] == QuestVisibility.PUBLIC  # Default value
        assert quest["auto_approve"] == False  # Default value

    def test_quest_creation_with_maximum_complexity(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Quest creation with all optional fields"""

        future_date = datetime.utcnow() + timedelta(days=7)
        deadline_date = datetime.utcnow() + timedelta(days=30)

        complex_quest_data = create_basic_quest_data()
        complex_quest_data.update({
            "location_detail": "Virtual meeting room with screen sharing",
            "starts_at": future_date.isoformat(),
            "deadline": deadline_date.isoformat(),
            "estimated_duration": "2-3 weeks, 10 hours per week",
            "auto_approve": True,
            "visibility": QuestVisibility.UNLISTED,
        })

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=quest_creator_headers,
            json=complex_quest_data,
        )
        assert response.status_code == 200

        quest = response.json()
        assert quest["location_detail"] == complex_quest_data["location_detail"]
        assert quest["auto_approve"] == True
        assert quest["visibility"] == QuestVisibility.UNLISTED

    def test_quest_visibility_settings(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Different visibility settings work correctly"""

        visibility_tests = [
            QuestVisibility.PUBLIC,
            QuestVisibility.UNLISTED,
            QuestVisibility.PRIVATE,
        ]

        for visibility in visibility_tests:
            quest_data = create_basic_quest_data()
            quest_data["visibility"] = visibility
            quest_data["title"] = f"Quest with {visibility} visibility"

            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=quest_data,
            )
            assert response.status_code == 200

            quest = response.json()
            assert quest["visibility"] == visibility


class TestQuestRequirementsValidation:
    """Test Quest Requirements and Validation Logic"""

    @pytest.fixture
    def quest_creator_headers(self, client: TestClient, db: Session) -> dict[str, str]:
        """Create a quest creator and return authentication headers"""
        email = random_email()
        return authentication_token_from_email(client=client, email=email, db=db)

    def test_party_size_validation_success(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Valid party size combinations"""

        valid_party_sizes = [
            {"min": 1, "max": 1},  # Solo quest
            {"min": 2, "max": 2},  # Fixed size
            {"min": 3, "max": 8},  # Range
            {"min": 1, "max": 50},  # Maximum allowed
        ]

        for i, sizes in enumerate(valid_party_sizes):
            quest_data = create_basic_quest_data()
            quest_data["title"] = f"Party size test {i}"
            quest_data["party_size_min"] = sizes["min"]
            quest_data["party_size_max"] = sizes["max"]

            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=quest_data,
            )
            assert response.status_code == 200

            quest = response.json()
            assert quest["party_size_min"] == sizes["min"]
            assert quest["party_size_max"] == sizes["max"]

    def test_timeline_validation_success(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Valid timeline configurations"""

        now = datetime.utcnow()
        future_start = now + timedelta(days=7)
        future_deadline = now + timedelta(days=30)

        timeline_tests = [
            {
                "name": "No dates",
                "starts_at": None,
                "deadline": None,
            },
            {
                "name": "Only start date",
                "starts_at": future_start.isoformat(),
                "deadline": None,
            },
            {
                "name": "Only deadline",
                "starts_at": None,
                "deadline": future_deadline.isoformat(),
            },
            {
                "name": "Both dates valid",
                "starts_at": future_start.isoformat(),
                "deadline": future_deadline.isoformat(),
            },
        ]

        for test in timeline_tests:
            quest_data = create_basic_quest_data()
            quest_data["title"] = f"Timeline test: {test['name']}"
            if test["starts_at"]:
                quest_data["starts_at"] = test["starts_at"]
            if test["deadline"]:
                quest_data["deadline"] = test["deadline"]

            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=quest_data,
            )
            assert response.status_code == 200

    def test_location_type_combinations(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Different location type configurations"""

        location_tests = [
            {
                "type": LocationType.REMOTE,
                "detail": None,
            },
            {
                "type": LocationType.REMOTE,
                "detail": "Discord server with voice channels",
            },
            {
                "type": LocationType.IN_PERSON,
                "detail": "San Francisco, CA - Mission District",
            },
            {
                "type": LocationType.HYBRID,
                "detail": "Mix of online coordination and in-person meetups",
            },
        ]

        for i, test in enumerate(location_tests):
            quest_data = create_basic_quest_data()
            quest_data["title"] = f"Location test {i}"
            quest_data["location_type"] = test["type"]
            if test["detail"]:
                quest_data["location_detail"] = test["detail"]

            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=quest_data,
            )
            assert response.status_code == 200

            quest = response.json()
            assert quest["location_type"] == test["type"]
            if test["detail"]:
                assert quest["location_detail"] == test["detail"]


class TestQuestManagement:
    """Test Quest Management Operations"""

    @pytest.fixture
    def quest_with_owner(
        self, client: TestClient, db: Session
    ) -> tuple[str, dict[str, str]]:
        """Create a quest and return quest_id and owner headers"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)

        quest_data = create_basic_quest_data()
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=headers,
            json=quest_data,
        )
        assert response.status_code == 200
        quest_id = response.json()["id"]

        return quest_id, headers

    def test_edit_quest_before_applications(
        self,
        client: TestClient,
        db: Session,
        quest_with_owner: tuple[str, dict[str, str]],
    ) -> None:
        """Test: Edit quest details before applications start"""
        quest_id, owner_headers = quest_with_owner

        update_data = {
            "title": "Updated quest title with more specific requirements",
            "description": "Updated description with clearer expectations and more detailed information about the project scope.",
            "party_size_max": 6,
            "estimated_duration": "3-4 weeks",
        }

        response = client.put(
            f"{settings.API_V1_STR}/quests/{quest_id}",
            headers=owner_headers,
            json=update_data,
        )
        assert response.status_code == 200

        updated_quest = response.json()
        assert updated_quest["title"] == update_data["title"]
        assert updated_quest["description"] == update_data["description"]
        assert updated_quest["party_size_max"] == update_data["party_size_max"]
        assert updated_quest["estimated_duration"] == update_data["estimated_duration"]

    def test_view_quest_details(
        self,
        client: TestClient,
        db: Session,
        quest_with_owner: tuple[str, dict[str, str]],
    ) -> None:
        """Test: View quest details and analytics"""
        quest_id, owner_headers = quest_with_owner

        response = client.get(
            f"{settings.API_V1_STR}/quests/{quest_id}",
            headers=owner_headers,
        )
        assert response.status_code == 200

        quest_detail = response.json()
        assert quest_detail["id"] == quest_id
        assert "creator_id" in quest_detail

    def test_quest_applications_list_empty(
        self,
        client: TestClient,
        db: Session,
        quest_with_owner: tuple[str, dict[str, str]],
    ) -> None:
        """Test: View empty applications list"""
        quest_id, owner_headers = quest_with_owner

        response = client.get(
            f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/applications",
            headers=owner_headers,
        )
        assert response.status_code == 200

        applications = response.json()
        assert applications["count"] == 0
        assert applications["data"] == []


class TestApplicationReviewProcess:
    """Test Application Review Process"""

    @pytest.fixture
    def quest_with_applications(
        self, client: TestClient, db: Session
    ) -> tuple[str, dict[str, str], list[dict[str, str]], list[User]]:
        """Create quest with multiple applications"""
        # Create quest owner
        owner_email = random_email()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_email, db=db
        )

        quest_data = create_basic_quest_data()
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]

        # Create applicants
        applicant_headers = []
        applicant_users = []
        for i in range(3):
            email = random_email()
            headers = authentication_token_from_email(client=client, email=email, db=db)
            applicant_headers.append(headers)

            user = db.exec(select(User).where(User.email == email)).first()
            applicant_users.append(user)

            # Create application
            application_data = {
                "message": f"I'm interested in joining this quest. Application {i + 1}",
                "relevant_skills": "Python, React, Database design",
            }
            response = client.post(
                f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/apply",
                headers=headers,
                json=application_data,
            )
            assert response.status_code == 200

        return quest_id, owner_headers, applicant_headers, applicant_users

    def test_receive_and_view_applications(
        self,
        client: TestClient,
        db: Session,
        quest_with_applications: tuple[
            str, dict[str, str], list[dict[str, str]], list[User]
        ],
    ) -> None:
        """Test: Receive Applications and view applicant profiles"""
        quest_id, owner_headers, _, _ = quest_with_applications

        response = client.get(
            f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/applications",
            headers=owner_headers,
        )
        assert response.status_code == 200

        applications = response.json()
        assert applications["count"] == 3
        assert len(applications["data"]) == 3

        for app in applications["data"]:
            assert app["status"] == ApplicationStatus.PENDING
            assert "message" in app
            assert "relevant_skills" in app
            assert "applicant_id" in app  # Should include applicant profile

    def test_approve_application_success(
        self,
        client: TestClient,
        db: Session,
        quest_with_applications: tuple[
            str, dict[str, str], list[dict[str, str]], list[User]
        ],
    ) -> None:
        """Test: Approve application with welcome message"""
        quest_id, owner_headers, _, applicant_users = quest_with_applications

        # Get first application
        response = client.get(
            f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/applications",
            headers=owner_headers,
        )
        applications = response.json()["data"]
        first_app_id = applications[0]["id"]

        # Approve application
        approval_data = {
            "status": ApplicationStatus.APPROVED,
            "reviewer_feedback": "Great application! Welcome to the team. Looking forward to working together.",
        }

        response = client.put(
            f"{settings.API_V1_STR}/quest-applications/{first_app_id}",
            headers=owner_headers,
            json=approval_data,
        )
        assert response.status_code == 200

        approved_app = response.json()
        assert approved_app["status"] == ApplicationStatus.APPROVED
        print(approval_data)
        print(approved_app)
        assert approved_app["reviewer_feedback"] == approval_data["reviewer_feedback"]
        assert approved_app["reviewed_at"] is not None

    def test_reject_application_with_feedback(
        self,
        client: TestClient,
        db: Session,
        quest_with_applications: tuple[
            str, dict[str, str], list[dict[str, str]], list[User]
        ],
    ) -> None:
        """Test: Reject application with feedback message"""
        quest_id, owner_headers, _, _ = quest_with_applications

        # Get second application
        response = client.get(
            f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/applications",
            headers=owner_headers,
        )
        applications = response.json()["data"]
        second_app_id = applications[1]["id"]

        # Reject application
        rejection_data = {
            "status": ApplicationStatus.REJECTED,
            "reviewer_feedback": "Thank you for applying. We're looking for someone with more React experience for this particular project.",
        }

        response = client.put(
            f"{settings.API_V1_STR}/quest-applications/{second_app_id}",
            headers=owner_headers,
            json=rejection_data,
        )
        assert response.status_code == 200

        rejected_app = response.json()
        assert rejected_app["status"] == ApplicationStatus.REJECTED
        assert rejected_app["reviewer_feedback"] == rejection_data["reviewer_feedback"]


class TestQuestClosureScenarios:
    """Test Quest Closure and Party Formation"""

    def test_manual_quest_closure_creates_party(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Manual closure with approved applicants creates party"""
        # Create quest owner
        owner_email = random_email()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_email, db=db
        )
        owner_user = db.exec(select(User).where(User.email == owner_email)).first()

        quest_data = create_basic_quest_data()
        quest_data["party_size_min"] = 2
        quest_data["party_size_max"] = 4

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]

        # Create and approve 2 applications
        approved_users = []
        for i in range(2):
            applicant_email = random_email()
            applicant_headers = authentication_token_from_email(
                client=client, email=applicant_email, db=db
            )
            applicant_user = db.exec(
                select(User).where(User.email == applicant_email)
            ).first()
            approved_users.append(applicant_user)

            # Apply
            response = client.post(
                f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/apply",
                headers=applicant_headers,
                json={
                    "message": f"Application from user {i}",
                    "relevant_skills": "Python, React",
                },
            )
            app_id = response.json()["id"]

            # Approve
            response = client.put(
                f"{settings.API_V1_STR}/quest-applications/{app_id}",
                headers=owner_headers,
                json={
                    "status": ApplicationStatus.APPROVED,
                    "response_message": "Approved!",
                },
            )
            assert response.status_code == 200

        # Close quest manually
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/close",
            headers=owner_headers,
        )
        assert response.status_code == 200

        closed_quest = response.json()
        assert closed_quest["status"] == QuestStatus.IN_PROGRESS

        # Verify party was created
        from app.models import Party, PartyMember

        party = db.exec(select(Party).where(Party.quest_id == quest_id)).first()
        assert party is not None

        # Verify party members
        party_members = db.exec(
            select(PartyMember).where(PartyMember.party_id == party.id)
        ).all()
        assert len(party_members) == 3  # Owner + 2 approved applicants

        member_user_ids = {member.user_id for member in party_members}
        expected_user_ids = {owner_user.id} | {user.id for user in approved_users}
        assert member_user_ids == expected_user_ids


# FAILURE CASES START HERE


class TestQuestCreationValidationFailures:
    """Test Quest Creation Validation Failures"""

    @pytest.fixture
    def quest_creator_headers(self, client: TestClient, db: Session) -> dict[str, str]:
        """Create a quest creator and return authentication headers"""
        email = random_email()
        return authentication_token_from_email(client=client, email=email, db=db)

    def test_quest_creation_missing_required_fields(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Quest creation fails with missing required fields"""

        missing_field_tests = [
            {
                "name": "missing_title",
                "data": {
                    "description": "Valid description",
                    "objective": "Valid objective",
                },
            },
            {
                "name": "missing_description",
                "data": {"title": "Valid title", "objective": "Valid objective"},
            },
            {
                "name": "missing_objective",
                "data": {"title": "Valid title", "description": "Valid description"},
            },
            {"name": "empty_data", "data": {}},
        ]

        for test in missing_field_tests:
            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=test["data"],
            )
            assert response.status_code == 422  # Validation error
            error_detail = response.json()["detail"]
            assert isinstance(error_detail, list)
            assert len(error_detail) > 0

    def test_quest_creation_invalid_field_lengths(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Quest creation fails with invalid field lengths"""

        length_tests = [
            {
                "name": "title_too_short",
                "data": {
                    "title": "Hi",  # Less than min_length=5
                    "description": "Valid description that meets minimum length requirement",
                    "objective": "Valid objective",
                },
            },
            {
                "name": "title_too_long",
                "data": {
                    "title": "X" * 201,  # More than max_length=200
                    "description": "Valid description that meets minimum length requirement",
                    "objective": "Valid objective",
                },
            },
            {
                "name": "description_too_short",
                "data": {
                    "title": "Valid title",
                    "description": "Short",  # Less than min_length=20
                    "objective": "Valid objective",
                },
            },
        ]

        for test in length_tests:
            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=test["data"],
            )
            assert response.status_code == 422  # Validation error

    def test_quest_creation_invalid_party_size(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Quest creation fails with invalid party size"""

        quest_data = create_basic_quest_data()

        invalid_party_size_tests = [
            {"min": 0, "max": 5},  # min too small
            {"min": -1, "max": 5},  # min negative
            {"min": 1, "max": 51},  # max too large
            {"min": 1, "max": 0},  # max too small
        ]

        logically_invalid_party_size_tests = [
            {"min": 5, "max": 3},  # min > max
        ]

        for sizes in invalid_party_size_tests:
            quest_data_copy = quest_data.copy()
            quest_data_copy["party_size_min"] = sizes["min"]
            quest_data_copy["party_size_max"] = sizes["max"]
            quest_data_copy["title"] = (
                f"Invalid size test min:{sizes['min']} max:{sizes['max']}"
            )

            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=quest_data_copy,
            )
            assert response.status_code == 422  # Validation error

        for sizes in logically_invalid_party_size_tests:
            quest_data_copy = quest_data.copy()
            quest_data_copy["party_size_min"] = sizes["min"]
            quest_data_copy["party_size_max"] = sizes["max"]
            quest_data_copy["title"] = (
                f"Logically invalid size test min:{sizes['min']} max:{sizes['max']}"
            )

            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=quest_data_copy,
            )
            assert response.status_code == 400  # Validation error


    def test_quest_creation_invalid_timeline(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Quest creation fails with invalid timeline"""

        now = datetime.utcnow()
        past_date = now - timedelta(days=1)
        future_start = now + timedelta(days=7)
        invalid_deadline = now + timedelta(days=3)  # Before start

        quest_data = create_basic_quest_data()

        timeline_failure_tests = [
            {
                "name": "past_start_date",
                "starts_at": past_date.isoformat(),
                "deadline": None,
            },
            {
                "name": "deadline_before_start",
                "starts_at": future_start.isoformat(),
                "deadline": invalid_deadline.isoformat(),
            },
        ]

        for test in timeline_failure_tests:
            quest_data_copy = quest_data.copy()
            quest_data_copy["title"] = f"Timeline failure: {test['name']}"
            if test.get("starts_at"):
                quest_data_copy["starts_at"] = test["starts_at"]
            if test.get("deadline"):
                quest_data_copy["deadline"] = test["deadline"]

            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=quest_data_copy,
            )
            # Note: Timeline validation might be done at application level
            # This could be 422 (validation) or 400 (business logic)
            assert response.status_code in [400, 422]

    def test_quest_creation_unauthorized(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Quest creation fails for non-authenticated user"""

        quest_data = create_basic_quest_data()

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            json=quest_data,
        )
        assert response.status_code == 401  # Unauthorized


class TestQuestPermissionFailures:
    """Test Quest Permission Failures"""

    @pytest.fixture
    def quest_with_non_owner(
        self, client: TestClient, db: Session
    ) -> tuple[str, dict[str, str], dict[str, str]]:
        """Create quest and return quest_id, owner_headers, non_owner_headers"""
        # Create quest owner
        owner_email = random_email()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_email, db=db
        )

        quest_data = create_basic_quest_data()
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]

        # Create non-owner user
        non_owner_email = random_email()
        non_owner_headers = authentication_token_from_email(
            client=client, email=non_owner_email, db=db
        )

        return quest_id, owner_headers, non_owner_headers

    def test_non_owner_cannot_edit_quest(
        self,
        client: TestClient,
        db: Session,
        quest_with_non_owner: tuple[str, dict[str, str], dict[str, str]],
    ) -> None:
        """Test: Non-owner trying to edit quest should fail"""
        quest_id, _, non_owner_headers = quest_with_non_owner

        update_data = {
            "title": "Unauthorized edit attempt",
            "description": "This should not be allowed to change the quest description",
        }

        response = client.put(
            f"{settings.API_V1_STR}/quests/{quest_id}",
            headers=non_owner_headers,
            json=update_data,
        )
        assert response.status_code == 403  # Forbidden

    def test_non_owner_cannot_close_quest(
        self,
        client: TestClient,
        db: Session,
        quest_with_non_owner: tuple[str, dict[str, str], dict[str, str]],
    ) -> None:
        """Test: Non-owner trying to close quest should fail"""
        quest_id, _, non_owner_headers = quest_with_non_owner

        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/close",
            headers=non_owner_headers,
        )
        assert response.status_code == 403  # Forbidden

    def test_non_owner_cannot_access_applications(
        self,
        client: TestClient,
        db: Session,
        quest_with_non_owner: tuple[str, dict[str, str], dict[str, str]],
    ) -> None:
        """Test: Non-owner accessing applications should fail"""
        quest_id, _, non_owner_headers = quest_with_non_owner

        response = client.get(
            f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/applications",
            headers=non_owner_headers,
        )
        assert response.status_code == 403  # Forbidden


class TestApplicationFailures:
    """Test Application-Related Failures"""

    @pytest.fixture
    def closed_quest(
        self, client: TestClient, db: Session
    ) -> tuple[str, dict[str, str]]:
        """Create a closed quest"""
        owner_email = random_email()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_email, db=db
        )

        quest_data = create_basic_quest_data()
        quest_data["party_size_min"] = 1
        quest_data["party_size_max"] = 1

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]

        # Close the quest
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/close",
            headers=owner_headers,
        )
        assert response.status_code == 200

        return quest_id, owner_headers

    def test_apply_to_closed_quest_fails(
        self,
        client: TestClient,
        db: Session,
        closed_quest: tuple[str, dict[str, str]],
    ) -> None:
        """Test: Applying to closed quest should fail"""
        quest_id, _ = closed_quest

        applicant_email = random_email()
        applicant_headers = authentication_token_from_email(
            client=client, email=applicant_email, db=db
        )

        application_data = {
            "message": "I want to join this closed quest",
            "relevant_skills": "Too late skills",
        }

        response = client.post(
            f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/apply",
            headers=applicant_headers,
            json=application_data,
        )
        assert response.status_code == 400  # Bad Request
        assert "not accepting applications" in response.json()["detail"].lower()

    def test_duplicate_application_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Duplicate application should fail"""
        # Create quest
        owner_email = random_email()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_email, db=db
        )

        quest_data = create_basic_quest_data()
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]

        # Create applicant
        applicant_email = random_email()
        applicant_headers = authentication_token_from_email(
            client=client, email=applicant_email, db=db
        )

        application_data = {
            "message": "First application",
            "relevant_skills": "Python, React",
        }

        # First application should succeed
        response = client.post(
            f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/apply",
            headers=applicant_headers,
            json=application_data,
        )
        assert response.status_code == 200

        # Second application should fail
        application_data["message"] = "Duplicate application"
        response = client.post(
            f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/apply",
            headers=applicant_headers,
            json=application_data,
        )
        assert response.status_code == 400  # Bad Request
        assert "already applied" in response.json()["detail"].lower()

    def test_apply_to_private_quest_without_invitation_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Applying to private quest without invitation should fail"""
        # Create private quest
        owner_email = random_email()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_email, db=db
        )

        quest_data = create_basic_quest_data()
        quest_data["visibility"] = QuestVisibility.PRIVATE

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]

        # Create uninvited applicant
        applicant_email = random_email()
        applicant_headers = authentication_token_from_email(
            client=client, email=applicant_email, db=db
        )

        application_data = {
            "message": "I want to join this private quest",
            "relevant_skills": "Uninvited skills",
        }

        response = client.post(
            f"{settings.API_V1_STR}/quest-applications/quests/{quest_id}/apply",
            headers=applicant_headers,
            json=application_data,
        )
        assert response.status_code == 403  # Forbidden
        assert "private" in response.json()["detail"].lower()


class TestQuestClosureFailures:
    """Test Quest Closure Failure Cases"""

    def test_close_quest_with_no_approved_applicants_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Closing quest with no approved applicants when min > 1 should fail"""
        owner_email = random_email()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_email, db=db
        )

        quest_data = create_basic_quest_data()
        quest_data["party_size_min"] = 3  # Need at least 3 people
        quest_data["party_size_max"] = 5

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]

        # Try to close without enough approved applicants
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/close",
            headers=owner_headers,
        )
        assert response.status_code == 400  # Bad Request
        assert "minimum party size" in response.json()["detail"].lower()

    def test_close_already_closed_quest_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Closing already closed quest should fail"""
        owner_email = random_email()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_email, db=db
        )

        quest_data = create_basic_quest_data()
        quest_data["party_size_min"] = 1

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]

        # Close quest first time
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/close",
            headers=owner_headers,
        )
        assert response.status_code == 200

        # Try to close again
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/close",
            headers=owner_headers,
        )
        assert response.status_code == 400  # Bad Request
        assert (
            "only recruiting quests can be closed" in response.json()["detail"].lower()
        )


class TestDataIntegrityFailures:
    """Test Data Integrity Failure Cases"""

    @pytest.fixture
    def quest_creator_headers(self, client: TestClient, db: Session) -> dict[str, str]:
        """Create a quest creator and return authentication headers"""
        email = random_email()
        return authentication_token_from_email(client=client, email=email, db=db)

    def test_create_quest_with_invalid_category_fails(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Creating quest with invalid category should fail"""
        quest_data = create_basic_quest_data()
        quest_data["category"] = "INVALID_CATEGORY"

        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=quest_creator_headers,
            json=quest_data,
        )
        assert response.status_code == 422  # Validation error

    def test_create_quest_with_invalid_enums_fails(
        self,
        client: TestClient,
        db: Session,
        quest_creator_headers: dict[str, str],
    ) -> None:
        """Test: Creating quest with invalid enum values should fail"""
        invalid_enum_tests = [
            {"field": "location_type", "value": "INVALID_LOCATION"},
            {"field": "required_commitment", "value": "INVALID_COMMITMENT"},
            {"field": "visibility", "value": "INVALID_VISIBILITY"},
        ]

        for test in invalid_enum_tests:
            quest_data = create_basic_quest_data()
            quest_data[test["field"]] = test["value"]
            quest_data["title"] = f"Invalid enum test: {test['field']}"

            response = client.post(
                f"{settings.API_V1_STR}/quests/",
                headers=quest_creator_headers,
                json=quest_data,
            )
            assert response.status_code == 422  # Validation error

    def test_quest_update_after_applications_received_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Editing quest after applications received should fail (if this rule exists)"""
        # This test depends on business rules about when quests can be edited
        # It's a placeholder for such validation if implemented
        pass


class TestQuestCompletion:
    """Test Quest Completion Success Cases"""

    @pytest.fixture
    def in_progress_quest(
        self, client: TestClient, db: Session
    ) -> tuple[str, dict[str, str]]:
        """Create a quest in IN_PROGRESS status"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        quest_data = create_basic_quest_data()
        quest_data["party_size_min"] = 1  # Allow single person quest
        
        # Create quest
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=headers,
            json=quest_data,
        )
        assert response.status_code == 200
        quest_id = response.json()["id"]
        
        # Close quest to move it to IN_PROGRESS
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/close",
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == QuestStatus.IN_PROGRESS
        
        return quest_id, headers

    def test_complete_quest_by_creator(
        self,
        client: TestClient,
        db: Session,
        in_progress_quest: tuple[str, dict[str, str]],
    ) -> None:
        """Test: Quest creator can complete an IN_PROGRESS quest"""
        quest_id, creator_headers = in_progress_quest

        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/complete",
            headers=creator_headers,
        )
        assert response.status_code == 200

        completed_quest = response.json()
        assert completed_quest["status"] == QuestStatus.COMPLETED
        assert completed_quest["completed_at"] is not None
        assert completed_quest["updated_at"] is not None

    def test_complete_quest_sets_completed_at(
        self,
        client: TestClient,
        db: Session,
        in_progress_quest: tuple[str, dict[str, str]],
    ) -> None:
        """Test: Completing quest sets completed_at timestamp"""
        quest_id, creator_headers = in_progress_quest

        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/complete",
            headers=creator_headers,
        )
        assert response.status_code == 200

        quest_data = response.json()
        assert quest_data["completed_at"] is not None
        
        # Verify timestamp is recent (within last minute)  
        from datetime import datetime
        # Parse the timestamp - API returns datetime without Z suffix
        completed_time = datetime.fromisoformat(quest_data["completed_at"])
        now = datetime.utcnow()
        time_diff = (now - completed_time).total_seconds()
        assert time_diff < 60  # Less than 1 minute ago

    def test_complete_quest_by_party_owner(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Party owner can complete party quest"""
        # Create party owner
        owner_email = random_email()
        owner_headers = authentication_token_from_email(client=client, email=owner_email, db=db)
        owner_user = db.exec(select(User).where(User.email == owner_email)).first()
        
        # Create party
        from app.tests.utils.factories import create_party, create_party_member
        from app.models import PartyMemberRole
        
        party = create_party(db)
        create_party_member(db, party_id=party.id, user_id=owner_user.id, role=PartyMemberRole.OWNER)
        
        # Create party quest that's IN_PROGRESS
        quest = create_random_quest(db, creator_id=owner_user.id, party_id=party.id)
        quest.status = QuestStatus.IN_PROGRESS
        quest.updated_at = datetime.utcnow()
        db.add(quest)
        db.commit()
        
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest.id}/complete",
            headers=owner_headers,
        )
        assert response.status_code == 200
        
        completed_quest = response.json()
        assert completed_quest["status"] == QuestStatus.COMPLETED

    def test_complete_quest_by_party_moderator(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Party moderator can complete party quest"""
        # Create party moderator
        moderator_email = random_email()
        moderator_headers = authentication_token_from_email(client=client, email=moderator_email, db=db)
        moderator_user = db.exec(select(User).where(User.email == moderator_email)).first()
        
        # Create party with moderator
        from app.tests.utils.factories import create_party, create_party_member
        from app.models import PartyMemberRole
        
        party = create_party(db)
        create_party_member(db, party_id=party.id, user_id=moderator_user.id, role=PartyMemberRole.MODERATOR)
        
        # Create party quest that's IN_PROGRESS
        quest = create_random_quest(db, party_id=party.id)
        quest.status = QuestStatus.IN_PROGRESS
        quest.updated_at = datetime.utcnow()
        db.add(quest)
        db.commit()
        
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest.id}/complete",
            headers=moderator_headers,
        )
        assert response.status_code == 200
        
        completed_quest = response.json()
        assert completed_quest["status"] == QuestStatus.COMPLETED


class TestQuestCancellation:
    """Test Quest Cancellation Success Cases"""

    def test_cancel_recruiting_quest_by_creator(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Creator can cancel quest during RECRUITING status"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        quest_data = create_basic_quest_data()
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]
        
        # Cancel the recruiting quest
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/cancel",
            headers=headers,
        )
        assert response.status_code == 200
        
        cancelled_quest = response.json()
        assert cancelled_quest["status"] == QuestStatus.CANCELLED
        assert cancelled_quest["updated_at"] is not None

    def test_cancel_in_progress_quest_by_creator(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Creator can cancel quest during IN_PROGRESS status"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        quest_data = create_basic_quest_data()
        quest_data["party_size_min"] = 1  # Allow single person quest
        
        # Create and close quest to get IN_PROGRESS status
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]
        
        # Move to IN_PROGRESS
        client.post(f"{settings.API_V1_STR}/quests/{quest_id}/close", headers=headers)
        
        # Cancel the in-progress quest
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/cancel",
            headers=headers,
        )
        assert response.status_code == 200
        
        cancelled_quest = response.json()
        assert cancelled_quest["status"] == QuestStatus.CANCELLED

    def test_cancel_quest_by_party_owner(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Party owner can cancel party quest"""
        # Create party owner
        owner_email = random_email()
        owner_headers = authentication_token_from_email(client=client, email=owner_email, db=db)
        owner_user = db.exec(select(User).where(User.email == owner_email)).first()
        
        # Create party
        from app.tests.utils.factories import create_party, create_party_member
        from app.models import PartyMemberRole
        
        party = create_party(db)
        create_party_member(db, party_id=party.id, user_id=owner_user.id, role=PartyMemberRole.OWNER)
        
        # Create party quest
        quest = create_random_quest(db, creator_id=owner_user.id, party_id=party.id)
        
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest.id}/cancel",
            headers=owner_headers,
        )
        assert response.status_code == 200
        
        cancelled_quest = response.json()
        assert cancelled_quest["status"] == QuestStatus.CANCELLED

    def test_cancel_quest_by_party_moderator(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Party moderator can cancel party quest"""
        # Create party moderator
        moderator_email = random_email()
        moderator_headers = authentication_token_from_email(client=client, email=moderator_email, db=db)
        moderator_user = db.exec(select(User).where(User.email == moderator_email)).first()
        
        # Create party with moderator
        from app.tests.utils.factories import create_party, create_party_member
        from app.models import PartyMemberRole
        
        party = create_party(db)
        create_party_member(db, party_id=party.id, user_id=moderator_user.id, role=PartyMemberRole.MODERATOR)
        
        # Create party quest
        quest = create_random_quest(db, party_id=party.id)
        
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest.id}/cancel",
            headers=moderator_headers,
        )
        assert response.status_code == 200
        
        cancelled_quest = response.json()
        assert cancelled_quest["status"] == QuestStatus.CANCELLED


class TestQuestCompletionFailures:
    """Test Quest Completion Error Cases"""

    def test_complete_non_existent_quest_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Completing non-existent quest returns 404"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        fake_quest_id = str(uuid.uuid4())
        
        response = client.post(
            f"{settings.API_V1_STR}/quests/{fake_quest_id}/complete",
            headers=headers,
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_complete_recruiting_quest_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Cannot complete RECRUITING quest"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        quest_data = create_basic_quest_data()
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]
        
        # Try to complete recruiting quest
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/complete",
            headers=headers,
        )
        assert response.status_code == 400
        assert "only in-progress quests can be completed" in response.json()["detail"].lower()

    def test_complete_already_completed_quest_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Cannot complete already COMPLETED quest"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        quest_data = create_basic_quest_data()
        quest_data["party_size_min"] = 1
        
        # Create and close quest to get IN_PROGRESS
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]
        
        client.post(f"{settings.API_V1_STR}/quests/{quest_id}/close", headers=headers)
        
        # Complete quest once
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/complete",
            headers=headers,
        )
        assert response.status_code == 200
        
        # Try to complete again
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/complete",
            headers=headers,
        )
        assert response.status_code == 400
        assert "only in-progress quests can be completed" in response.json()["detail"].lower()

    def test_complete_cancelled_quest_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Cannot complete CANCELLED quest"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        quest_data = create_basic_quest_data()
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]
        
        # Cancel quest first
        client.post(f"{settings.API_V1_STR}/quests/{quest_id}/cancel", headers=headers)
        
        # Try to complete cancelled quest
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/complete",
            headers=headers,
        )
        assert response.status_code == 400
        assert "only in-progress quests can be completed" in response.json()["detail"].lower()

    def test_non_owner_cannot_complete_quest(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Non-owner cannot complete quest"""
        # Create quest owner
        owner_email = random_email()
        owner_headers = authentication_token_from_email(client=client, email=owner_email, db=db)
        
        quest_data = create_basic_quest_data()
        quest_data["party_size_min"] = 1
        
        # Create and close quest
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]
        client.post(f"{settings.API_V1_STR}/quests/{quest_id}/close", headers=owner_headers)
        
        # Create different user
        other_email = random_email()
        other_headers = authentication_token_from_email(client=client, email=other_email, db=db)
        
        # Try to complete as non-owner
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/complete",
            headers=other_headers,
        )
        assert response.status_code == 403
        assert "only quest creators or party owners/moderators can complete quests" in response.json()["detail"].lower()

    def test_party_member_cannot_complete_quest(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Regular party member cannot complete quest"""
        # Create party member (not owner/moderator)
        member_email = random_email()
        member_headers = authentication_token_from_email(client=client, email=member_email, db=db)
        member_user = db.exec(select(User).where(User.email == member_email)).first()
        
        # Create party with regular member
        from app.tests.utils.factories import create_party, create_party_member
        from app.models import PartyMemberRole
        
        party = create_party(db)
        create_party_member(db, party_id=party.id, user_id=member_user.id, role=PartyMemberRole.MEMBER)
        
        # Create party quest that's IN_PROGRESS
        quest = create_random_quest(db, party_id=party.id)
        quest.status = QuestStatus.IN_PROGRESS
        quest.updated_at = datetime.utcnow()
        db.add(quest)
        db.commit()
        
        # Try to complete as regular member
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest.id}/complete",
            headers=member_headers,
        )
        assert response.status_code == 403
        assert "only quest creators or party owners/moderators can complete quests" in response.json()["detail"].lower()


class TestQuestCancellationFailures:
    """Test Quest Cancellation Error Cases"""

    def test_cancel_non_existent_quest_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Cancelling non-existent quest returns 404"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        fake_quest_id = str(uuid.uuid4())
        
        response = client.post(
            f"{settings.API_V1_STR}/quests/{fake_quest_id}/cancel",
            headers=headers,
        )
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_cancel_completed_quest_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Cannot cancel COMPLETED quest"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        quest_data = create_basic_quest_data()
        quest_data["party_size_min"] = 1
        
        # Create, close, and complete quest
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]
        
        client.post(f"{settings.API_V1_STR}/quests/{quest_id}/close", headers=headers)
        client.post(f"{settings.API_V1_STR}/quests/{quest_id}/complete", headers=headers)
        
        # Try to cancel completed quest
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/cancel",
            headers=headers,
        )
        assert response.status_code == 400
        assert "only recruiting or in-progress quests can be cancelled" in response.json()["detail"].lower()

    def test_cancel_already_cancelled_quest_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Cannot cancel already CANCELLED quest"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)
        
        quest_data = create_basic_quest_data()
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]
        
        # Cancel quest once
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/cancel",
            headers=headers,
        )
        assert response.status_code == 200
        
        # Try to cancel again
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/cancel",
            headers=headers,
        )
        assert response.status_code == 400
        assert "only recruiting or in-progress quests can be cancelled" in response.json()["detail"].lower()

    def test_non_owner_cannot_cancel_quest(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Non-owner cannot cancel quest"""
        # Create quest owner
        owner_email = random_email()
        owner_headers = authentication_token_from_email(client=client, email=owner_email, db=db)
        
        quest_data = create_basic_quest_data()
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=owner_headers,
            json=quest_data,
        )
        quest_id = response.json()["id"]
        
        # Create different user
        other_email = random_email()
        other_headers = authentication_token_from_email(client=client, email=other_email, db=db)
        
        # Try to cancel as non-owner
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/cancel",
            headers=other_headers,
        )
        assert response.status_code == 403
        assert "only quest creators or party owners/moderators can cancel quests" in response.json()["detail"].lower()

    def test_party_member_cannot_cancel_quest(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Regular party member cannot cancel quest"""
        # Create party member (not owner/moderator)
        member_email = random_email()
        member_headers = authentication_token_from_email(client=client, email=member_email, db=db)
        member_user = db.exec(select(User).where(User.email == member_email)).first()
        
        # Create party with regular member
        from app.tests.utils.factories import create_party, create_party_member
        from app.models import PartyMemberRole
        
        party = create_party(db)
        create_party_member(db, party_id=party.id, user_id=member_user.id, role=PartyMemberRole.MEMBER)
        
        # Create party quest
        quest = create_random_quest(db, party_id=party.id)
        
        # Try to cancel as regular member
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest.id}/cancel",
            headers=member_headers,
        )
        assert response.status_code == 403
        assert "only quest creators or party owners/moderators can cancel quests" in response.json()["detail"].lower()
