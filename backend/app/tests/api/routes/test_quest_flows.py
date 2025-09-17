"""
Tests for Enhanced Quest System Flows as described in FLOWS.md

This module tests the dual-mode recruitment platform supporting:
1. Individual Quest Creation → New Party Formation
2. Party Quest Creation (Internal, Expansion, Hybrid)
3. Quest Publicizing Flow
4. Member Assignment for Internal Quests
5. Quest Closure and Party Formation Logic
"""
import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app import crud
from app.core.config import settings
from app.models import (
    ApplicationStatus,
    Party,
    PartyMember,
    PartyMemberRole,
    Quest,
    QuestApplication,
    QuestStatus,
    QuestType,
    QuestVisibility,
    User,
)
from app.tests.utils.user import create_random_user, authentication_token_from_email
from app.tests.utils.utils import random_email


class TestIndividualQuestFlow:
    """Test Individual User Creates Quest → New Party Formation Flow"""

    def test_individual_quest_creation_flow(
        self,
        client: TestClient,
        db: Session,
        quest_data: dict[str, Any],
    ) -> None:
        """Test: User Idea → Create Quest → Set Requirements → Publish → Review Applications → Approve Members → Quest Closes → New Party Created"""
        
        # Step 1: Create quest creator with proper authentication
        creator_email = random_email()
        creator_headers = authentication_token_from_email(
            client=client, email=creator_email, db=db
        )
        
        # Step 2: Create Individual Quest
        quest_data.update({
            "quest_type": QuestType.INDIVIDUAL,
            "party_size_min": 2,
            "party_size_max": 4,
        })
        
        response = client.post(
            f"{settings.API_V1_STR}/quests/",
            headers=creator_headers,
            json=quest_data,
        )
        assert response.status_code == 200
        quest = response.json()
        assert quest["quest_type"] == QuestType.INDIVIDUAL
        assert quest["status"] == QuestStatus.RECRUITING
        quest_id = quest["id"]

        # Get creator user ID from the created quest
        quest_db = db.exec(select(Quest).where(Quest.id == quest_id)).first()
        creator_id = quest_db.creator_id
        
        # Step 3: Create applicants and applications
        applicant_emails = [random_email() for _ in range(3)]
        applicant_users = []
        
        for email in applicant_emails:
            # Create user through authentication (simulates registration)
            authentication_token_from_email(client=client, email=email, db=db)
            user = db.exec(select(User).where(User.email == email)).first()
            applicant_users.append(user)
        
        # Create applications
        for applicant in applicant_users:
            application = QuestApplication(
                quest_id=quest_id,
                applicant_id=applicant.id,
                message="I'd like to join this quest",
                relevant_skills="Python, FastAPI",
            )
            db.add(application)
        db.commit()

        # Step 4: Approve 2 out of 3 applications (quest creator action)
        applications = db.exec(select(QuestApplication).where(QuestApplication.quest_id == quest_id)).all()
        applications[0].status = ApplicationStatus.APPROVED
        applications[1].status = ApplicationStatus.APPROVED
        # applications[2] remains PENDING
        db.add(applications[0])
        db.add(applications[1])
        db.commit()

        # Step 5: Close quest (triggers party formation)
        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest_id}/close",
            headers=creator_headers,
        )
        assert response.status_code == 200
        closed_quest = response.json()
        assert closed_quest["status"] == QuestStatus.IN_PROGRESS

        # Step 6: Verify new party was created
        quest_db = db.exec(select(Quest).where(Quest.id == quest_id)).first()
        party = db.exec(select(Party).where(Party.quest_id == quest_id)).first()
        assert party is not None
        assert party.name == f"Party for {quest_data['title']}"

        # Step 7: Verify party members
        party_members = db.exec(select(PartyMember).where(PartyMember.party_id == party.id)).all()
        assert len(party_members) == 3  # Creator + 2 approved applicants
        
        # Creator should be OWNER
        creator_member = next((m for m in party_members if m.user_id == creator_id), None)
        assert creator_member is not None
        assert creator_member.role == PartyMemberRole.OWNER

        # Approved applicants should be MEMBERS
        approved_member_ids = {applications[0].applicant_id, applications[1].applicant_id}
        approved_members = [m for m in party_members if m.user_id in approved_member_ids]
        assert len(approved_members) == 2
        for member in approved_members:
            assert member.role == PartyMemberRole.MEMBER


class TestPartyQuestCreation:
    """Test Party Creates Quest (Team Expansion) Flow"""

    @pytest.fixture
    def existing_party(self, db: Session) -> tuple[Party, list[PartyMember]]:
        """Create an existing party with owner and members"""
        # Create quest that forms the party
        creator = create_random_user(db)
        quest = Quest(
            title="Original Quest",
            description="Quest that formed this party",
            objective="Complete the original objective",
            category="PROFESSIONAL",
            party_size_min=2,
            party_size_max=4,
            required_commitment="MODERATE",
            location_type="REMOTE",
            creator_id=creator.id,
            status=QuestStatus.COMPLETED,
        )
        db.add(quest)
        db.commit()
        db.refresh(quest)

        # Create party
        party = Party(quest_id=quest.id)
        db.add(party)
        db.commit()
        db.refresh(party)

        # Add party members
        owner_member = PartyMember(
            party_id=party.id,
            user_id=creator.id,
            role=PartyMemberRole.OWNER,
        )
        
        member1 = create_random_user(db)
        member2 = create_random_user(db)
        
        regular_member1 = PartyMember(
            party_id=party.id,
            user_id=member1.id,
            role=PartyMemberRole.MEMBER,
        )
        
        regular_member2 = PartyMember(
            party_id=party.id,
            user_id=member2.id,
            role=PartyMemberRole.MEMBER,
        )
        
        members = [owner_member, regular_member1, regular_member2]
        for member in members:
            db.add(member)
        db.commit()
        
        return party, members

    def test_party_internal_quest_creation(
        self,
        client: TestClient,
        db: Session,
        existing_party: tuple[Party, list[PartyMember]],
    ) -> None:
        """Test: Existing Party → Identify Need → Create Internal Quest → Assign Members"""
        party, members = existing_party
        owner = members[0]  # First member is owner
        
        # Get proper JWT token for owner
        from sqlmodel import select
        from app.models import User
        owner_user = db.exec(select(User).where(User.id == owner.user_id)).first()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_user.email, db=db
        )

        # Party owner creates internal quest
        internal_quest_data = {
            "title": "Research market analysis for our app",
            "description": "Internal task to research market opportunities",
            "objective": "Complete market analysis report",
            "category": "PROFESSIONAL",
            "quest_type": QuestType.PARTY_INTERNAL,
            "required_commitment": "MODERATE",
            "location_type": "REMOTE",
            "assigned_member_ids": [str(members[1].user_id), str(members[2].user_id)],
            "internal_slots": 2,
            "visibility": QuestVisibility.PRIVATE,
        }

        response = client.post(
            f"{settings.API_V1_STR}/parties/{party.id}/quests",
            headers=owner_headers,
            json=internal_quest_data,
        )
        assert response.status_code == 200
        quest = response.json()
        assert quest["quest_type"] == QuestType.PARTY_INTERNAL
        assert quest["party_id"] == str(party.id)
        assert quest["parent_party_id"] == str(party.id)
        assert quest["internal_slots"] == 2
        assert quest["visibility"] == QuestVisibility.PRIVATE

    def test_party_expansion_quest_creation(
        self,
        client: TestClient,
        db: Session,
        existing_party: tuple[Party, list[PartyMember]],
    ) -> None:
        """Test: Existing Party → Create Public Expansion Quest → Add New Members"""
        party, members = existing_party
        owner = members[0]
        
        # Get proper JWT token for owner
        from sqlmodel import select
        from app.models import User
        owner_user = db.exec(select(User).where(User.id == owner.user_id)).first()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_user.email, db=db
        )

        # Party owner creates expansion quest
        expansion_quest_data = {
            "title": "Need 1 UX designer for our 3-person dev team",
            "description": "Looking for UX expertise to complete our team",
            "objective": "Add UX design capabilities to existing development team",
            "category": "PROFESSIONAL",
            "quest_type": QuestType.PARTY_EXPANSION,
            "party_size_min": 1,
            "party_size_max": 2,
            "public_slots": 2,
            "required_commitment": "SERIOUS",
            "location_type": "HYBRID",
            "visibility": QuestVisibility.PUBLIC,
        }

        response = client.post(
            f"{settings.API_V1_STR}/parties/{party.id}/quests",
            headers=owner_headers,
            json=expansion_quest_data,
        )
        assert response.status_code == 200
        quest = response.json()
        assert quest["quest_type"] == QuestType.PARTY_EXPANSION
        assert quest["party_id"] == str(party.id)
        assert quest["parent_party_id"] == str(party.id)
        assert quest["public_slots"] == 2
        assert quest["visibility"] == QuestVisibility.PUBLIC

    def test_party_hybrid_quest_creation(
        self,
        client: TestClient,
        db: Session,
        existing_party: tuple[Party, list[PartyMember]],
    ) -> None:
        """Test: Party → Create Hybrid Quest → Start Internal → Option to Publicize Later"""
        party, members = existing_party
        owner = members[0]
        
        # Get proper JWT token for owner
        from sqlmodel import select
        from app.models import User
        owner_user = db.exec(select(User).where(User.id == owner.user_id)).first()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_user.email, db=db
        )

        # Party owner creates hybrid quest
        hybrid_quest_data = {
            "title": "Need backend dev - check with team first",
            "description": "Backend development task, try internal first then go public",
            "objective": "Implement backend API endpoints",
            "category": "PROFESSIONAL", 
            "quest_type": QuestType.PARTY_HYBRID,
            "party_size_min": 1,
            "party_size_max": 1,
            "internal_slots": 1,
            "public_slots": 0,  # Will be set when publicized
            "required_commitment": "SERIOUS",
            "location_type": "REMOTE",
            "visibility": QuestVisibility.PRIVATE,  # Starts private
        }

        response = client.post(
            f"{settings.API_V1_STR}/parties/{party.id}/quests",
            headers=owner_headers,
            json=hybrid_quest_data,
        )
        assert response.status_code == 200
        quest = response.json()
        assert quest["quest_type"] == QuestType.PARTY_HYBRID
        assert quest["visibility"] == QuestVisibility.PRIVATE
        assert quest["internal_slots"] == 1
        assert quest["public_slots"] == 0
        assert quest["is_publicized"] == False


class TestQuestPublicizingFlow:
    """Test Quest Publicizing Flow (Internal/Hybrid → Public)"""

    @pytest.fixture
    def hybrid_quest_setup(self, db: Session) -> tuple[Quest, PartyMember]:
        """Create hybrid quest and party owner for testing publicizing"""
        # Create party owner
        owner = create_random_user(db)
        
        # Create original quest and party
        original_quest = Quest(
            title="Original Quest",
            description="Original quest description",
            objective="Original objective",
            category="PROFESSIONAL",
            party_size_min=2,
            party_size_max=4,
            required_commitment="MODERATE",
            location_type="REMOTE",
            creator_id=owner.id,
            status=QuestStatus.COMPLETED,
        )
        db.add(original_quest)
        db.commit()
        db.refresh(original_quest)

        party = Party(quest_id=original_quest.id)
        db.add(party)
        db.commit()
        db.refresh(party)

        party_member = PartyMember(
            party_id=party.id,
            user_id=owner.id,
            role=PartyMemberRole.OWNER,
        )
        db.add(party_member)
        db.commit()

        # Create hybrid quest
        hybrid_quest = Quest(
            title="Hybrid Quest to Publicize",
            description="Quest that can be publicized",
            objective="Test publicizing",
            category="PROFESSIONAL",
            quest_type=QuestType.PARTY_HYBRID,
            party_size_min=1,
            party_size_max=2,
            required_commitment="MODERATE",
            location_type="REMOTE",
            visibility=QuestVisibility.PRIVATE,
            creator_id=owner.id,
            party_id=party.id,
            parent_party_id=party.id,
            internal_slots=1,
            public_slots=0,
            is_publicized=False,
        )
        db.add(hybrid_quest)
        db.commit()
        db.refresh(hybrid_quest)

        return hybrid_quest, party_member

    def test_quest_publicizing_flow(
        self,
        client: TestClient,
        db: Session,
        hybrid_quest_setup: tuple[Quest, PartyMember],
    ) -> None:
        """Test: Internal/Hybrid Quest → Emergency Publicizing → "publicize 2 slots" """
        quest, owner_member = hybrid_quest_setup
        
        # Get proper JWT token for owner
        from sqlmodel import select
        from app.models import User
        owner_user = db.exec(select(User).where(User.id == owner_member.user_id)).first()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_user.email, db=db
        )

        # Publicize the quest
        publicize_request = {
            "public_slots": 2,
            "visibility": QuestVisibility.PUBLIC,
        }

        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest.id}/publicize",
            headers=owner_headers,
            json=publicize_request,
        )
        assert response.status_code == 200
        publicized_quest = response.json()
        
        assert publicized_quest["is_publicized"] == True
        assert publicized_quest["public_slots"] == 2
        assert publicized_quest["visibility"] == QuestVisibility.PUBLIC
        assert publicized_quest["publicized_at"] is not None

    def test_cannot_publicize_individual_quest(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Only internal/hybrid quests can be publicized"""
        # Create individual quest
        creator = create_random_user(db)
        individual_quest = Quest(
            title="Individual Quest",
            description="Cannot be publicized",
            objective="Test error handling",
            category="PROFESSIONAL",
            quest_type=QuestType.INDIVIDUAL,
            party_size_min=2,
            party_size_max=4,
            required_commitment="MODERATE",
            location_type="REMOTE",
            creator_id=creator.id,
        )
        db.add(individual_quest)
        db.commit()

        creator_headers = authentication_token_from_email(
            client=client, email=creator.email, db=db
        )
        publicize_request = {
            "public_slots": 2,
            "visibility": QuestVisibility.PUBLIC,
        }

        response = client.post(
            f"{settings.API_V1_STR}/quests/{individual_quest.id}/publicize",
            headers=creator_headers,
            json=publicize_request,
        )
        assert response.status_code == 400
        assert "Only internal or hybrid party quests can be publicized" in response.json()["detail"]


class TestMemberAssignmentFlow:
    """Test Member Assignment to Internal Quests"""

    @pytest.fixture
    def internal_quest_setup(self, db: Session) -> tuple[Quest, list[PartyMember]]:
        """Create internal quest and party members for testing assignment"""
        # Create party owner and members
        owner = create_random_user(db)
        member1 = create_random_user(db)
        member2 = create_random_user(db)
        
        # Create original quest and party
        original_quest = Quest(
            title="Original Quest",
            description="Original quest description",
            objective="Original objective", 
            category="PROFESSIONAL",
            party_size_min=3,
            party_size_max=5,
            required_commitment="MODERATE",
            location_type="REMOTE",
            creator_id=owner.id,
            status=QuestStatus.COMPLETED,
        )
        db.add(original_quest)
        db.commit()
        db.refresh(original_quest)

        party = Party(quest_id=original_quest.id)
        db.add(party)
        db.commit()
        db.refresh(party)

        # Create party members
        owner_member = PartyMember(
            party_id=party.id,
            user_id=owner.id,
            role=PartyMemberRole.OWNER,
        )
        party_member1 = PartyMember(
            party_id=party.id,
            user_id=member1.id,
            role=PartyMemberRole.MEMBER,
        )
        party_member2 = PartyMember(
            party_id=party.id,
            user_id=member2.id,
            role=PartyMemberRole.MEMBER,
        )
        
        members = [owner_member, party_member1, party_member2]
        for member in members:
            db.add(member)
        db.commit()

        # Create internal quest
        internal_quest = Quest(
            title="Internal Task Assignment",
            description="Assign specific task to existing party members",
            objective="Complete internal objective",
            category="PROFESSIONAL",
            quest_type=QuestType.PARTY_INTERNAL,
            party_size_min=2,
            party_size_max=2,
            required_commitment="MODERATE",
            location_type="REMOTE",
            visibility=QuestVisibility.PRIVATE,
            creator_id=owner.id,
            party_id=party.id,
            parent_party_id=party.id,
            internal_slots=2,
        )
        db.add(internal_quest)
        db.commit()
        db.refresh(internal_quest)

        return internal_quest, members

    def test_member_assignment_flow(
        self,
        client: TestClient,
        db: Session,
        internal_quest_setup: tuple[Quest, list[PartyMember]],
    ) -> None:
        """Test: Select specific party members to assign → Set deadline and requirements → Add description and context"""
        quest, members = internal_quest_setup
        owner = members[0]  # Owner
        assignees = members[1:3]  # Two regular members
        
        # Get proper JWT token for owner
        from sqlmodel import select
        from app.models import User
        owner_user = db.exec(select(User).where(User.id == owner.user_id)).first()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_user.email, db=db
        )

        # Assign specific members to internal quest
        assignment_request = {
            "assigned_member_ids": [str(member.user_id) for member in assignees]
        }

        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest.id}/assign-members",
            headers=owner_headers,
            json=assignment_request,
        )
        assert response.status_code == 200
        updated_quest = response.json()
        
        # Verify assignment was saved
        import json
        assigned_ids = json.loads(updated_quest["assigned_member_ids"])
        expected_ids = [str(member.user_id) for member in assignees]
        assert set(assigned_ids) == set(expected_ids)

    def test_cannot_assign_non_party_members(
        self,
        client: TestClient,
        db: Session,
        internal_quest_setup: tuple[Quest, list[PartyMember]],
    ) -> None:
        """Test: Cannot assign users who are not party members"""
        quest, members = internal_quest_setup
        owner = members[0]
        
        # Create user who is NOT a party member
        non_member = create_random_user(db)
        
        # Get proper JWT token for owner
        from sqlmodel import select
        from app.models import User
        owner_user = db.exec(select(User).where(User.id == owner.user_id)).first()
        owner_headers = authentication_token_from_email(
            client=client, email=owner_user.email, db=db
        )

        assignment_request = {
            "assigned_member_ids": [str(non_member.id)]
        }

        response = client.post(
            f"{settings.API_V1_STR}/quests/{quest.id}/assign-members",
            headers=owner_headers,
            json=assignment_request,
        )
        assert response.status_code == 400
        assert "are not active party members" in response.json()["detail"]


class TestQuestClosureFlow:
    """Test Quest Closure and Party Formation Logic"""

    def test_expansion_quest_closure_adds_to_existing_party(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Party Expansion Quest → Approved applicants added to existing party"""
        # Create existing party
        owner = create_random_user(db)
        existing_member = create_random_user(db)
        
        original_quest = Quest(
            title="Original Quest",
            description="Quest that formed the original party",
            objective="Original objective",
            category="PROFESSIONAL", 
            party_size_min=2,
            party_size_max=4,
            required_commitment="MODERATE",
            location_type="REMOTE",
            creator_id=owner.id,
            status=QuestStatus.COMPLETED,
        )
        db.add(original_quest)
        db.commit()
        db.refresh(original_quest)

        party = Party(quest_id=original_quest.id)
        db.add(party)
        db.commit()
        db.refresh(party)

        # Add existing members
        owner_member = PartyMember(
            party_id=party.id,
            user_id=owner.id,
            role=PartyMemberRole.OWNER,
        )
        existing_party_member = PartyMember(
            party_id=party.id,
            user_id=existing_member.id,
            role=PartyMemberRole.MEMBER,
        )
        db.add(owner_member)
        db.add(existing_party_member)
        db.commit()

        # Create expansion quest
        expansion_quest = Quest(
            title="Team Expansion Quest",
            description="Need to expand our existing team",
            objective="Add new team members",
            category="PROFESSIONAL",
            quest_type=QuestType.PARTY_EXPANSION,
            party_size_min=1,
            party_size_max=2,
            required_commitment="MODERATE",
            location_type="REMOTE",
            creator_id=owner.id,
            party_id=party.id,
            parent_party_id=party.id,
            public_slots=2,
        )
        db.add(expansion_quest)
        db.commit()
        db.refresh(expansion_quest)

        # Create applicants and approve them
        new_applicant1 = create_random_user(db)
        new_applicant2 = create_random_user(db)
        
        for applicant in [new_applicant1, new_applicant2]:
            application = QuestApplication(
                quest_id=expansion_quest.id,
                applicant_id=applicant.id,
                message="I want to join the team",
                status=ApplicationStatus.APPROVED,
            )
            db.add(application)
        db.commit()

        # Close expansion quest
        owner_headers = authentication_token_from_email(
            client=client, email=owner.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/quests/{expansion_quest.id}/close",
            headers=owner_headers,
        )
        assert response.status_code == 200

        # Verify new members were added to existing party
        all_party_members = db.exec(select(PartyMember).where(PartyMember.party_id == party.id)).all()
        assert len(all_party_members) == 4  # 2 original + 2 new

        # Verify new members have correct roles
        new_member_ids = {new_applicant1.id, new_applicant2.id}
        new_members = [m for m in all_party_members if m.user_id in new_member_ids]
        assert len(new_members) == 2
        for member in new_members:
            assert member.role == PartyMemberRole.MEMBER
            assert member.status == "active"

    def test_internal_quest_closure_no_party_changes(
        self,
        client: TestClient,
        db: Session,
    ) -> None:
        """Test: Internal Quest completion → No party changes, just mark complete"""
        # Create party and internal quest
        owner = create_random_user(db)
        
        original_quest = Quest(
            title="Original Quest",
            description="Quest that formed the party",
            objective="Original objective",
            category="PROFESSIONAL",
            party_size_min=1,
            party_size_max=2,
            required_commitment="MODERATE",
            location_type="REMOTE",
            creator_id=owner.id,
            status=QuestStatus.COMPLETED,
        )
        db.add(original_quest)
        db.commit()
        db.refresh(original_quest)

        party = Party(quest_id=original_quest.id)
        db.add(party)
        db.commit()
        db.refresh(party)

        owner_member = PartyMember(
            party_id=party.id,
            user_id=owner.id,
            role=PartyMemberRole.OWNER,
        )
        db.add(owner_member)
        db.commit()

        # Create internal quest
        internal_quest = Quest(
            title="Internal Task",
            description="Internal task for existing party",
            objective="Complete internal work",
            category="PROFESSIONAL",
            quest_type=QuestType.PARTY_INTERNAL,
            party_size_min=1,
            party_size_max=1,
            required_commitment="MODERATE",
            location_type="REMOTE",
            creator_id=owner.id,
            party_id=party.id,
            parent_party_id=party.id,
            internal_slots=1,
        )
        db.add(internal_quest)
        db.commit()
        db.refresh(internal_quest)

        # Get initial party member count
        initial_members = db.exec(select(PartyMember).where(PartyMember.party_id == party.id)).all()
        initial_count = len(initial_members)

        # Close internal quest
        owner_headers = authentication_token_from_email(
            client=client, email=owner.email, db=db
        )
        response = client.post(
            f"{settings.API_V1_STR}/quests/{internal_quest.id}/close",
            headers=owner_headers,
        )
        assert response.status_code == 200

        # Verify quest is completed
        completed_quest = response.json()
        assert completed_quest["status"] == QuestStatus.IN_PROGRESS

        # Verify no party changes (same member count)
        final_members = db.exec(select(PartyMember).where(PartyMember.party_id == party.id)).all()
        assert len(final_members) == initial_count
