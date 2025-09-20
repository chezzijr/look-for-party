"""
Tests for Profile Flow as described in FLOWS.md

This module tests the complete profile management system supporting:
1. User Registration & Onboarding
2. Profile Setup (First-time users)
3. Profile Management (Ongoing)
4. Skills Management
5. Reputation Monitoring
6. Complete Profile Journey
"""

import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app import crud
from app.core.config import settings
from app.models import User
from app.models.tag import (
    ProficiencyLevel,
    Tag,
    TagCategory,
    TagCreate,
    TagStatus,
)
from app.tests.utils.user import authentication_token_from_email
from app.tests.utils.utils import random_email, random_lower_string


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


class TestUserRegistrationFlow:
    """Test User Registration & Onboarding Flow"""

    def test_user_registration_flow(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: User → Landing Page → Sign Up → Email Verification → Profile Setup → Dashboard"""

        # Step 1: User signup (simulates landing page -> sign up)
        email = random_email()
        password = random_lower_string()
        full_name = "Test User"

        signup_data = {
            "email": email,
            "password": password,
            "full_name": full_name,
        }

        response = client.post(
            f"{settings.API_V1_STR}/users/signup",
            json=signup_data,
        )
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == email
        assert user_data["full_name"] == full_name
        assert (
            user_data["is_active"] is True
        )  # In test environment, email verification is skipped

        # Step 2: Verify user in database
        user_db = db.exec(select(User).where(User.email == email)).first()
        assert user_db is not None
        assert user_db.email == email
        assert user_db.full_name == full_name
        assert user_db.is_active is True
        assert user_db.reputation_score == Decimal("0.0")
        assert user_db.total_completed_quests == 0

        # Step 3: User can now login and access protected routes (simulates dashboard access)
        headers = authentication_token_from_email(client=client, email=email, db=db)

        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
        )
        assert response.status_code == 200
        me_data = response.json()
        assert me_data["email"] == email

    def test_registration_with_duplicate_email_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Registration with existing email should fail"""
        email = random_email()
        password = random_lower_string()

        # Create first user
        signup_data = {
            "email": email,
            "password": password,
            "full_name": "First User",
        }

        response = client.post(
            f"{settings.API_V1_STR}/users/signup",
            json=signup_data,
        )
        assert response.status_code == 200

        # Try to create second user with same email
        duplicate_signup_data = {
            "email": email,
            "password": random_lower_string(),
            "full_name": "Second User",
        }

        response = client.post(
            f"{settings.API_V1_STR}/users/signup",
            json=duplicate_signup_data,
        )
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_registration_with_weak_password_fails(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Registration with weak password should fail"""
        email = random_email()
        weak_password = "123"  # Too short

        signup_data = {
            "email": email,
            "password": weak_password,
            "full_name": "Test User",
        }

        response = client.post(
            f"{settings.API_V1_STR}/users/signup",
            json=signup_data,
        )
        assert response.status_code == 422  # Validation error


class TestProfileSetupFlow:
    """Test Profile Setup (First-time users)"""

    @pytest.fixture
    def new_user_headers(self, client: TestClient, db: Session) -> dict[str, str]:
        """Create a new user and return authentication headers"""
        email = random_email()
        return authentication_token_from_email(client=client, email=email, db=db)

    def test_initial_profile_setup_flow(
        self,
        client: TestClient,
        db: Session,
        new_user_headers: dict[str, str],
    ) -> None:
        """Test: Required profile setup with basic info and minimum 3 skills"""

        # Step 1: Update basic profile information (required fields)
        profile_update = {
            "full_name": "John Doe",
            "bio": "Software developer passionate about creating impactful applications",
            "location": "San Francisco, CA",
            "timezone": "America/Los_Angeles",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=new_user_headers,
            json=profile_update,
        )
        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user["full_name"] == profile_update["full_name"]
        assert updated_user["bio"] == profile_update["bio"]
        assert updated_user["location"] == profile_update["location"]
        assert updated_user["timezone"] == profile_update["timezone"]

        # Step 2: Add minimum 3 initial skills
        # Create system tags for skills
        python_tag = create_system_tag(db, "Python", TagCategory.PROGRAMMING)
        react_tag = create_system_tag(db, "React", TagCategory.FRAMEWORK)
        leadership_tag = create_system_tag(db, "Leadership", TagCategory.SKILL)

        # Add first skill (Python - Advanced)
        skill_data = {
            "tag_id": str(python_tag.id),
            "proficiency_level": ProficiencyLevel.ADVANCED.value,
            "is_primary": True,
        }
        response = client.post(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=new_user_headers,
            json=skill_data,
        )
        assert response.status_code == 200
        user_tag = response.json()
        assert user_tag["proficiency_level"] == ProficiencyLevel.ADVANCED.value
        assert user_tag["is_primary"] is True

        # Add second skill (React - Intermediate)
        skill_data = {
            "tag_id": str(react_tag.id),
            "proficiency_level": ProficiencyLevel.INTERMEDIATE.value,
            "is_primary": False,
        }
        response = client.post(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=new_user_headers,
            json=skill_data,
        )
        assert response.status_code == 200

        # Add third skill (Leadership - Beginner)
        skill_data = {
            "tag_id": str(leadership_tag.id),
            "proficiency_level": ProficiencyLevel.BEGINNER.value,
            "is_primary": False,
        }
        response = client.post(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=new_user_headers,
            json=skill_data,
        )
        assert response.status_code == 200

        # Step 3: Verify profile has minimum 3 skills
        response = client.get(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=new_user_headers,
        )
        assert response.status_code == 200
        user_tags = response.json()
        assert user_tags["count"] == 3

        # Verify one primary skill
        primary_skills = [tag for tag in user_tags["data"] if tag["is_primary"]]
        assert len(primary_skills) == 1
        assert primary_skills[0]["tag"]["name"] == python_tag.name

    def test_profile_setup_validation(
        self,
        client: TestClient,
        db: Session,
        new_user_headers: dict[str, str],
    ) -> None:
        """Test: Profile setup validation for required fields"""

        # Test timezone validation (invalid timezone)
        invalid_profile = {
            "timezone": "Invalid/Timezone",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=new_user_headers,
            json=invalid_profile,
        )
        # Note: The actual validation depends on your timezone validation logic
        # This is a placeholder for timezone validation testing

        # Test adding duplicate skill should fail
        skill_tag = create_system_tag(db, "JavaScript", TagCategory.PROGRAMMING)

        skill_data = {
            "tag_id": str(skill_tag.id),
            "proficiency_level": ProficiencyLevel.INTERMEDIATE.value,
        }

        # Add skill first time
        response = client.post(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=new_user_headers,
            json=skill_data,
        )
        assert response.status_code == 200

        # Try to add same skill again
        response = client.post(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=new_user_headers,
            json=skill_data,
        )
        assert response.status_code == 400  # Should fail due to uniqueness constraint


class TestProfileManagementFlow:
    """Test Profile Management (Ongoing)"""

    @pytest.fixture
    def established_user(
        self, client: TestClient, db: Session
    ) -> tuple[dict[str, str], User]:
        """Create an established user with profile and skills"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)

        # Set up basic profile
        profile_data = {
            "full_name": "Established User",
            "bio": "Experienced developer",
            "location": "New York, NY",
            "timezone": "America/New_York",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
            json=profile_data,
        )
        assert response.status_code == 200

        user = db.exec(select(User).where(User.email == email)).first()
        assert user
        return headers, user

    def test_edit_profile_information(
        self,
        client: TestClient,
        db: Session,
        established_user: tuple[dict[str, str], User],
    ) -> None:
        """Test: Edit profile information"""
        headers, user = established_user

        # Update profile information
        updated_profile = {
            "full_name": "Updated Name",
            "bio": "Updated bio with new information about my interests and background",
            "location": "Los Angeles, CA",
            "timezone": "America/Los_Angeles",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
            json=updated_profile,
        )
        assert response.status_code == 200
        updated_user = response.json()
        assert updated_user["full_name"] == updated_profile["full_name"]
        assert updated_user["bio"] == updated_profile["bio"]
        assert updated_user["location"] == updated_profile["location"]
        assert updated_user["timezone"] == updated_profile["timezone"]

        # Verify changes in database
        db.refresh(user)
        assert user.full_name == updated_profile["full_name"]
        assert user.bio == updated_profile["bio"]
        assert user.location == updated_profile["location"]
        assert user.timezone == updated_profile["timezone"]

    def test_skills_management_flow(
        self,
        client: TestClient,
        db: Session,
        established_user: tuple[dict[str, str], User],
    ) -> None:
        """Test: Skills Management - Add, Update, Remove skills with proficiency levels"""
        headers, user = established_user

        # Step 1: Add new skills with different proficiency levels
        python_tag = create_system_tag(db, "Python", TagCategory.PROGRAMMING)
        docker_tag = create_system_tag(db, "Docker", TagCategory.TOOL)

        # Add Python (Expert, Primary)
        python_skill = {
            "tag_id": str(python_tag.id),
            "proficiency_level": ProficiencyLevel.EXPERT.value,
            "is_primary": True,
        }
        response = client.post(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=headers,
            json=python_skill,
        )
        assert response.status_code == 200

        # Add Docker (Intermediate, Not Primary)
        docker_skill = {
            "tag_id": str(docker_tag.id),
            "proficiency_level": ProficiencyLevel.INTERMEDIATE.value,
            "is_primary": False,
        }
        response = client.post(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=headers,
            json=docker_skill,
        )
        assert response.status_code == 200

        # Step 2: Update skill proficiency (Docker: Intermediate -> Advanced)
        updated_docker_skill = {
            "proficiency_level": ProficiencyLevel.ADVANCED.value,
            "is_primary": False,
        }
        response = client.put(
            f"{settings.API_V1_STR}/tags/users/me/{docker_tag.id}",
            headers=headers,
            json=updated_docker_skill,
        )
        assert response.status_code == 200
        updated_skill = response.json()
        assert updated_skill["proficiency_level"] == ProficiencyLevel.ADVANCED.value

        # Step 3: Change primary skill (Docker becomes primary, Python not primary)
        make_docker_primary = {
            "proficiency_level": ProficiencyLevel.ADVANCED.value,
            "is_primary": True,
        }
        response = client.put(
            f"{settings.API_V1_STR}/tags/users/me/{docker_tag.id}",
            headers=headers,
            json=make_docker_primary,
        )
        assert response.status_code == 200

        # Make Python not primary
        make_python_not_primary = {
            "proficiency_level": ProficiencyLevel.EXPERT.value,
            "is_primary": False,
        }
        response = client.put(
            f"{settings.API_V1_STR}/tags/users/me/{python_tag.id}",
            headers=headers,
            json=make_python_not_primary,
        )
        assert response.status_code == 200

        # Step 4: Verify primary skill change
        response = client.get(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=headers,
        )
        assert response.status_code == 200
        user_tags = response.json()

        primary_skills = [tag for tag in user_tags["data"] if tag["is_primary"]]
        assert len(primary_skills) == 1
        assert primary_skills[0]["tag"]["name"] == docker_tag.name

        # Step 5: Remove skill
        response = client.delete(
            f"{settings.API_V1_STR}/tags/users/me/{python_tag.id}",
            headers=headers,
        )
        assert response.status_code == 200

        # Verify skill was removed
        response = client.get(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=headers,
        )
        user_tags = response.json()
        tag_ids = [tag["tag_id"] for tag in user_tags["data"]]
        assert str(python_tag.id) not in tag_ids

    def test_availability_updates(
        self,
        client: TestClient,
        db: Session,
        established_user: tuple[dict[str, str], User],
    ) -> None:
        """Test: Availability Updates (placeholder for future availability system)"""
        headers, user = established_user

        # This is a placeholder test for future availability system
        # Currently, availability is not implemented in the user model
        # When implemented, this would test:
        # - Update weekly schedule
        # - Set temporary availability changes
        # - Configure notification preferences

        # For now, we just test that profile updates work
        availability_note = {
            "bio": "Available for part-time projects on weekends. Open to remote collaboration.",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
            json=availability_note,
        )
        assert response.status_code == 200
        assert "weekend" in response.json()["bio"].lower()


class TestReputationMonitoringFlow:
    """Test Reputation Monitoring"""

    @pytest.fixture
    def user_with_reputation(
        self, client: TestClient, db: Session
    ) -> tuple[dict[str, str], User]:
        """Create user with some reputation score"""
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)

        user = db.exec(select(User).where(User.email == email)).first()
        assert user
        # Simulate some completed quests and reputation
        user.total_completed_quests = 5
        user.reputation_score = Decimal("4.2")
        db.add(user)
        db.commit()
        db.refresh(user)

        return headers, user

    def test_view_reputation_score_breakdown(
        self,
        client: TestClient,
        db: Session,
        user_with_reputation: tuple[dict[str, str], User],
    ) -> None:
        """Test: View reputation score breakdown"""
        headers, user = user_with_reputation

        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
        )
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["reputation_score"] == "4.20"  # Decimal formatted as string
        assert user_data["total_completed_quests"] == 5

    def test_quest_completion_history_affects_reputation(
        self,
        client: TestClient,
        db: Session,
        user_with_reputation: tuple[dict[str, str], User],
    ) -> None:
        """Test: Quest completion history tracking"""
        headers, user = user_with_reputation

        initial_quests = user.total_completed_quests

        # Simulate completing another quest
        user.total_completed_quests += 1
        db.add(user)
        db.commit()

        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
        )
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["total_completed_quests"] == initial_quests + 1


class TestCompleteProfileJourneyFlow:
    """Test Complete Profile Journey End-to-End"""

    def test_complete_profile_journey(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Complete journey from Registration → Profile Setup → Skills → Updates → Reputation"""

        # Step 1: Registration
        email = random_email()
        password = random_lower_string()
        signup_data = {
            "email": email,
            "password": password,
            "full_name": "Journey User",
        }

        response = client.post(
            f"{settings.API_V1_STR}/users/signup",
            json=signup_data,
        )
        assert response.status_code == 200

        # Step 2: Get authentication and verify initial state
        headers = authentication_token_from_email(client=client, email=email, db=db)

        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
        )
        assert response.status_code == 200
        initial_user = response.json()
        assert initial_user["reputation_score"] == "0.00"
        assert initial_user["total_completed_quests"] == 0
        assert initial_user["bio"] is None

        # Step 3: Complete Profile Setup
        profile_setup = {
            "full_name": "Complete Journey User",
            "bio": "Full-stack developer passionate about collaborative projects",
            "location": "Austin, TX",
            "timezone": "America/Chicago",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
            json=profile_setup,
        )
        assert response.status_code == 200

        # Step 4: Add Skills (minimum 3)
        # Create system tags
        javascript_tag = create_system_tag(db, "JavaScript", TagCategory.PROGRAMMING)
        node_tag = create_system_tag(db, "Node.js", TagCategory.FRAMEWORK)
        git_tag = create_system_tag(db, "Git", TagCategory.TOOL)
        teamwork_tag = create_system_tag(db, "Teamwork", TagCategory.SKILL)

        skills_to_add = [
            {
                "tag": javascript_tag,
                "level": ProficiencyLevel.ADVANCED,
                "primary": True,
            },
            {"tag": node_tag, "level": ProficiencyLevel.INTERMEDIATE, "primary": False},
            {"tag": git_tag, "level": ProficiencyLevel.EXPERT, "primary": False},
            {"tag": teamwork_tag, "level": ProficiencyLevel.ADVANCED, "primary": False},
        ]

        for skill in skills_to_add:
            tag = skill["tag"]
            assert isinstance(tag, Tag)
            skill_level = skill["level"]
            assert isinstance(skill_level, ProficiencyLevel)
            skill_data = {
                "tag_id": str(tag.id),
                "proficiency_level": skill_level.value,
                "is_primary": skill["primary"],
            }
            response = client.post(
                f"{settings.API_V1_STR}/tags/users/me",
                headers=headers,
                json=skill_data,
            )
            assert response.status_code == 200

        # Step 5: Verify Skills Added
        response = client.get(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=headers,
        )
        assert response.status_code == 200
        user_tags = response.json()
        assert user_tags["count"] == 4

        primary_skills = [tag for tag in user_tags["data"] if tag["is_primary"]]
        assert len(primary_skills) == 1
        assert primary_skills[0]["tag"]["name"] == javascript_tag.name

        # Step 6: Update Profile Information
        profile_update = {
            "bio": "Updated: Senior full-stack developer with expertise in JavaScript ecosystem and team leadership",
            "location": "Remote (based in Austin, TX)",
        }

        response = client.patch(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
            json=profile_update,
        )
        assert response.status_code == 200

        # Step 7: Check Final Profile State
        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
        )
        assert response.status_code == 200
        final_user = response.json()

        # Verify all profile elements are complete
        assert final_user["full_name"] == "Complete Journey User"
        assert "Updated:" in final_user["bio"]
        assert final_user["location"] == "Remote (based in Austin, TX)"
        assert final_user["timezone"] == "America/Chicago"
        assert (
            final_user["reputation_score"] == "0.00"
        )  # Still 0 until quest completion
        assert final_user["is_active"] is True

        # Step 8: Verify Profile Completeness
        # A complete profile should have:
        # - Full name ✓
        # - Bio ✓
        # - Location ✓
        # - Timezone ✓
        # - At least 3 skills ✓
        # - At least 1 primary skill ✓

        assert all(
            [
                final_user["full_name"],
                final_user["bio"],
                final_user["location"],
                final_user["timezone"],
            ]
        )

        # Verify skills count
        response = client.get(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=headers,
        )
        user_tags = response.json()
        assert user_tags["count"] >= 3

        primary_skills = [tag for tag in user_tags["data"] if tag["is_primary"]]
        assert len(primary_skills) >= 1

    def test_profile_completeness_validation(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Profile completeness validation for quest creation readiness"""

        # Create user with incomplete profile
        email = random_email()
        headers = authentication_token_from_email(client=client, email=email, db=db)

        # User with minimal profile (just from registration)
        response = client.get(
            f"{settings.API_V1_STR}/users/me",
            headers=headers,
        )
        assert response.status_code == 200
        user_data = response.json()

        # Check incomplete profile state
        profile_completeness_issues = []
        if not user_data.get("bio"):
            profile_completeness_issues.append("missing_bio")
        if not user_data.get("location"):
            profile_completeness_issues.append("missing_location")
        if not user_data.get("timezone"):
            profile_completeness_issues.append("missing_timezone")

        # Check skills
        response = client.get(
            f"{settings.API_V1_STR}/tags/users/me",
            headers=headers,
        )
        user_tags = response.json()
        if user_tags["count"] < 3:
            profile_completeness_issues.append("insufficient_skills")

        # New users should have incomplete profiles
        assert len(profile_completeness_issues) > 0
        assert "missing_bio" in profile_completeness_issues
        assert "missing_location" in profile_completeness_issues
        assert "missing_timezone" in profile_completeness_issues
        assert "insufficient_skills" in profile_completeness_issues
