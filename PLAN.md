# Look For Party (LFP) - Comprehensive Development Plan

## 📋 Executive Summary

This document outlines the complete development strategy for transforming the current FastAPI boilerplate into the Look For Party (LFP) platform - an intent-first collaboration platform where users start with objectives and find compatible party members to achieve them.

**Vision**: Create a quest-based social platform that matches people based on what they want to accomplish, not who they already know.

## 🔍 Current State Analysis

### ✅ Implemented Infrastructure (Updated September 15, 2025)
- **Backend**: FastAPI + SQLModel + PostgreSQL with streamlined, production-ready models
- **Authentication**: JWT-based auth system with user registration/login
- **Database**: Complete core models (User, Quest, Party, PartyMember, QuestApplication) with Alembic migrations
- **Tag System**: Comprehensive tag infrastructure with 300 system tags across 16 categories
- **Frontend**: React + TanStack Router + Chakra UI v3 with authentication flows
- **Testing**: Playwright for E2E, 135+ backend tests passing
- **Development**: Docker Compose development environment with hot reload

### ✅ Features Completed
- ✅ Generic "Item" model → Replaced with comprehensive Quest system
- ✅ Core models: User, Quest, Party, PartyMember, QuestApplication
- ✅ Comprehensive tag system with Tag, UserTag, QuestTag models
- ✅ User authentication system enhanced
- ✅ Settings/profile management implemented
- ✅ Landing page implemented

### 🚧 Features In Progress
- Vector database integration for semantic search
- Smart matching algorithm with tag-based compatibility

## 🎯 Platform Vision & Core Features

### How LFP Works (User Journey)
1. **Create Quest**: "Need 2 developers for weekend hackathon project"
2. **Smart Discovery**: System shows similar existing quests OR suggests merging
3. **Choose Path**: Join existing party or create new quest
4. **Apply & Connect**: Send application with message to quest master
5. **Form Party**: Quest master approves members, party is formed
6. **Execute**: Use built-in coordination tools for planning
7. **Complete & Rate**: Mark quest complete, rate teammates

### Core Innovation Points
- **Intent-First**: Start with "What do you want to do?" not "Who do you know?"
- **Temporary by Design**: Parties form for specific objectives, disband when complete
- **Smart Matching**: Algorithm finds complementary skills and compatible schedules
- **Quest Merging**: Auto-suggest merging similar requests to avoid duplication

## 🗄️ Database Schema Design

### 1. Enhanced User Model
```python
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    
    # Profile Enhancement
    bio: str | None = Field(default=None, max_length=500)
    location: str | None = Field(default=None, max_length=255)
    timezone: str | None = Field(default=None, max_length=50)
    availability: str | None = Field(default=None, max_length=1000)  # JSON string
    
    # Reputation System
    reputation_score: float = Field(default=0.0)
    quest_completion_rate: float = Field(default=0.0)
    total_quests_completed: int = Field(default=0)
    total_quests_created: int = Field(default=0)
    
    # User Settings (not search preferences)
    email_notifications_enabled: bool = Field(default=True)
    push_notifications_enabled: bool = Field(default=True)
    profile_visibility: str = Field(default="public")  # 'public', 'private', 'friends_only'
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_active_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    created_quests: list["Quest"] = Relationship(back_populates="creator")
    party_memberships: list["PartyMember"] = Relationship(back_populates="user")
    applications: list["Application"] = Relationship(back_populates="applicant")
    given_ratings: list["Rating"] = Relationship(back_populates="rater", sa_relationship_kwargs={"foreign_keys": "[Rating.rater_id]"})
    received_ratings: list["Rating"] = Relationship(back_populates="rated_user", sa_relationship_kwargs={"foreign_keys": "[Rating.rated_user_id]"})
    user_tags: list["UserTag"] = Relationship(back_populates="user", cascade_delete=True)  # ✅ Tag System
    suggested_tags: list["Tag"] = Relationship(back_populates="suggested_by_user", cascade_delete=True)  # ✅ Tag System
    sent_messages: list["Message"] = Relationship(back_populates="sender")
    notifications: list["Notification"] = Relationship(back_populates="user")
```

### 2. Quest Model (Core Entity)
```python
class Quest(QuestBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    creator_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    # Basic Info
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=2000)
    objective: str = Field(min_length=1, max_length=500)
    
    # Party Requirements
    party_size_min: int = Field(ge=1, le=50)
    party_size_max: int = Field(ge=1, le=50)
    current_party_size: int = Field(default=1, ge=1)  # Creator counts as 1
    
    # Quest Details
    location_type: str = Field(default="remote")  # 'remote', 'in_person', 'hybrid'
    location: str | None = Field(default=None, max_length=255)
    
    # Timing
    start_date: datetime | None = Field(default=None)
    end_date: datetime | None = Field(default=None)
    deadline: datetime | None = Field(default=None)
    is_flexible_timing: bool = Field(default=True)
    
    # Quest State
    status: str = Field(default="draft")  # 'draft', 'active', 'in_progress', 'completed', 'cancelled', 'archived'
    visibility: str = Field(default="public")  # 'public', 'private', 'invite_only'
    auto_approve: bool = Field(default=False)
    
    # Matching & Discovery
    embedding_vector: str | None = Field(default=None, max_length=10000)  # JSON string of vector
    search_keywords: str | None = Field(default=None, max_length=1000)
    category: str | None = Field(default=None, max_length=100)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = Field(default=None)
    
    # Analytics
    view_count: int = Field(default=0)
    application_count: int = Field(default=0)
    
    # Relationships
    creator: "User" = Relationship(back_populates="created_quests")
    party: "Party" | None = Relationship(back_populates="quest")
    applications: list["Application"] = Relationship(back_populates="quest", cascade_delete=True)
    quest_tags: list["QuestTag"] = Relationship(back_populates="quest", cascade_delete=True)  # ✅ Tag System
    merged_from: list["QuestMerge"] = Relationship(back_populates="target_quest", sa_relationship_kwargs={"foreign_keys": "[QuestMerge.target_quest_id]"})
    merged_into: list["QuestMerge"] = Relationship(back_populates="source_quest", sa_relationship_kwargs={"foreign_keys": "[QuestMerge.source_quest_id]"})
```

### 3. Party Model (Formed Groups)
```python
class Party(PartyBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False)
    
    # Party Info
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    
    # Status
    status: PartyStatus = Field(default=PartyStatus.ACTIVE)  # ACTIVE, COMPLETED, ARCHIVED
    is_private: bool = Field(default=False)
    
    # Timestamps
    formed_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = Field(default=None)
    archived_at: datetime | None = Field(default=None)
    
    # Relationships
    quest: "Quest" = Relationship(back_populates="party")
    members: list["PartyMember"] = Relationship(back_populates="party", cascade_delete=True)
    messages: list["Message"] = Relationship(back_populates="party", cascade_delete=True)
```

#### Party Status Semantics
- **ACTIVE**: Party can function normally - members can chat, plan, and coordinate activities
- **COMPLETED**: Quest is finished - members can rate each other based on their work and can still chat for post-completion discussion
- **ARCHIVED**: Party is archived - members can no longer chat or make changes, but can still read past conversations and view party history

### 4. PartyMember Model (Junction with Roles)
```python
class PartyMember(PartyMemberBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    party_id: uuid.UUID = Field(foreign_key="party.id", nullable=False)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    # Role & Status
    role: PartyMemberRole = Field(default=PartyMemberRole.MEMBER)  # OWNER, MODERATOR, MEMBER
    status: str = Field(default="active")  # 'active', 'inactive', 'removed'
    
    # Note: Permissions are now role-based:
    # - OWNER: Can do anything (quest creator)
    # - MODERATOR: Can remove members and modify quest
    # - MEMBER: Basic member privileges
    
    # Timestamps
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: datetime | None = Field(default=None)
    
    # Relationships
    party: "Party" = Relationship(back_populates="members")
    user: "User" = Relationship(back_populates="party_memberships")
```

### 5. Application Model (Join Requests)
```python
class Application(ApplicationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False)
    applicant_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    # Application Details
    message: str = Field(min_length=1, max_length=1000)
    relevant_skills: str | None = Field(default=None, max_length=500)
    proposed_role: str | None = Field(default=None, max_length=100)  # Additional field for role specification
    
    # Status  
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDING, sa_column_kwargs={"server_default": ApplicationStatus.PENDING.value})
    
    # Review
    reviewed_at: datetime | None = Field(default=None)
    reviewer_feedback: str | None = Field(default=None, max_length=500)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    applied_at: datetime = Field(default_factory=datetime.utcnow)  # Backward compatibility
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    quest: "Quest" = Relationship(back_populates="applications")
    applicant: "User" = Relationship(back_populates="applications")
```

### 6. Rating Model (Post-Quest Feedback)
```python
class Rating(RatingBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False)
    rater_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    rated_user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    # Ratings (1-5 scale)
    overall_rating: int = Field(ge=1, le=5)
    reliability: int = Field(ge=1, le=5)
    skill_level: int = Field(ge=1, le=5)
    communication: int = Field(ge=1, le=5)
    teamwork: int = Field(ge=1, le=5)
    
    # Feedback
    positive_feedback: str | None = Field(default=None, max_length=500)
    constructive_feedback: str | None = Field(default=None, max_length=500)
    would_work_again: bool = Field(default=True)
    
    # Metadata
    is_public: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    rater: "User" = Relationship(back_populates="given_ratings", sa_relationship_kwargs={"foreign_keys": "[Rating.rater_id]"})
    rated_user: "User" = Relationship(back_populates="received_ratings", sa_relationship_kwargs={"foreign_keys": "[Rating.rated_user_id]"})
```

### ✅ 7. Tag System (Skills & Interests) - IMPLEMENTED
```python
class Tag(TagBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Core Fields (unique constraints)
    name: str = Field(unique=True, index=True, max_length=100)
    slug: str = Field(unique=True, index=True, max_length=100)
    category: TagCategory  # Enum with 16 balanced categories
    description: str | None = Field(default=None, max_length=255)
    
    # Moderation & Status
    status: TagStatus = Field(
        default=TagStatus.SYSTEM,
        sa_column_kwargs={"server_default": TagStatus.SYSTEM.value}
    )
    suggested_by: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)
    
    # Analytics
    usage_count: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user_tags: list["UserTag"] = Relationship(back_populates="tag", cascade_delete=True)
    quest_tags: list["QuestTag"] = Relationship(back_populates="tag", cascade_delete=True)
    suggested_by_user: Optional["User"] = Relationship(
        back_populates="suggested_tags",
        sa_relationship_kwargs={"foreign_keys": "[Tag.suggested_by]"}
    )

class UserTag(UserTagBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    tag_id: uuid.UUID = Field(foreign_key="tag.id", nullable=False)
    
    # Skill Proficiency
    proficiency_level: ProficiencyLevel | None = Field(default=None)  # BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
    is_primary: bool = Field(default=False)  # Primary skills shown prominently
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: "User" = Relationship(back_populates="user_tags")
    tag: Tag = Relationship(back_populates="user_tags")
    
    # Prevent duplicates
    __table_args__ = (UniqueConstraint("user_id", "tag_id"),)

class QuestTag(QuestTagBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False)
    tag_id: uuid.UUID = Field(foreign_key="tag.id", nullable=False)
    
    # Requirements
    is_required: bool = Field(default=False)  # Required vs nice-to-have
    min_proficiency: ProficiencyLevel | None = Field(default=None)  # Minimum skill level needed
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    quest: "Quest" = Relationship(back_populates="quest_tags")
    tag: Tag = Relationship(back_populates="quest_tags")
    
    # Prevent duplicates
    __table_args__ = (UniqueConstraint("quest_id", "tag_id"),)

# Tag Categories (16 balanced categories - ACTUAL IMPLEMENTATION)
class TagCategory(str, Enum):
    # Technical
    PROGRAMMING = "PROGRAMMING"        # Python, JavaScript, C++, SQL
    FRAMEWORK = "FRAMEWORK"            # React, Django, Unity, TensorFlow
    TOOL = "TOOL"                      # Git, Docker, Photoshop, Excel, Discord
    
    # Gaming
    GAME = "GAME"                      # League of Legends, Chess, D&D, Among Us
    GAME_GENRE = "GAME_GENRE"         # FPS, MOBA, RPG, Strategy, Puzzle
    
    # Creative
    ART = "ART"                        # Drawing, Painting, Digital Art, Sculpture
    MUSIC = "MUSIC"                    # Guitar, Piano, Music Production, Jazz
    MEDIA = "MEDIA"                    # Photography, Video Editing, Streaming, Writing
    
    # Physical Activities
    SPORT = "SPORT"                    # Basketball, Soccer, Tennis, Running
    FITNESS = "FITNESS"                # Yoga, Weightlifting, CrossFit, Pilates
    
    # Knowledge & Learning
    LANGUAGE = "LANGUAGE"              # English, Spanish, Mandarin (natural languages)
    SUBJECT = "SUBJECT"                # Mathematics, Physics, History, Psychology
    
    # General
    SKILL = "SKILL"                    # Leadership, Communication, Problem Solving
    HOBBY = "HOBBY"                    # Cooking, Reading, Gardening, Board Games
    LOCATION = "LOCATION"              # Cities, Regions, Online, Countries
    STYLE = "STYLE"                    # Casual, Competitive, Beginner-friendly

class TagStatus(str, Enum):
    SYSTEM = "SYSTEM"          # Pre-approved system tags
    APPROVED = "APPROVED"      # User-suggested, admin approved (future)
    PENDING = "PENDING"        # Awaiting approval (future)
    REJECTED = "REJECTED"      # Rejected (future)

class ProficiencyLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"
```
**Implementation Status**: ✅ **COMPLETE**
- 300 system tags seeded across all 16 categories
- Complete CRUD operations for all tag models
- Full API endpoints for tag management
- User skill tagging and quest requirement tagging
- Tag-based search and filtering capabilities

### 8. Communication System
```python
class Message(MessageBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    party_id: uuid.UUID = Field(foreign_key="party.id", nullable=False)
    sender_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    # Message Content
    content: str = Field(min_length=1, max_length=2000)
    message_type: str = Field(default="text")  # 'text', 'image', 'file', 'system'
    
    # Threading
    reply_to_id: uuid.UUID | None = Field(default=None, foreign_key="message.id")
    
    # Status
    is_edited: bool = Field(default=False)
    is_deleted: bool = Field(default=False)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    party: "Party" = Relationship(back_populates="messages")
    sender: "User" = Relationship(back_populates="sent_messages")
```

### 9. Notification System
```python
class Notification(NotificationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    # Notification Content
    title: str = Field(max_length=255)
    message: str = Field(max_length=1000)
    notification_type: str = Field(max_length=50)  # 'application', 'quest_match', 'party_invite', 'quest_complete', 'rating_received'
    
    # Related Entities
    related_quest_id: uuid.UUID | None = Field(default=None, foreign_key="quest.id")
    related_application_id: uuid.UUID | None = Field(default=None, foreign_key="application.id")
    
    # Status
    is_read: bool = Field(default=False)
    is_dismissed: bool = Field(default=False)
    
    # Delivery
    sent_via_email: bool = Field(default=False)
    sent_via_push: bool = Field(default=False)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: datetime | None = Field(default=None)
    
    # Relationships
    user: "User" = Relationship(back_populates="notifications")
```

### 10. Supporting Models
```python
class QuestMerge(QuestMergeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    source_quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False)
    target_quest_id: uuid.UUID = Field(foreign_key="quest.id", nullable=False)
    
    merge_reason: str = Field(max_length=500)
    merged_at: datetime = Field(default_factory=datetime.utcnow)
    merged_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    # Relationships
    source_quest: "Quest" = Relationship(back_populates="merged_into", sa_relationship_kwargs={"foreign_keys": "[QuestMerge.source_quest_id]"})
    target_quest: "Quest" = Relationship(back_populates="merged_from", sa_relationship_kwargs={"foreign_keys": "[QuestMerge.target_quest_id]"})

class Achievement(AchievementBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    
    achievement_type: str = Field(max_length=100)  # 'quest_master', 'reliable_teammate', 'domain_expert'
    title: str = Field(max_length=255)
    description: str = Field(max_length=500)
    badge_icon: str | None = Field(default=None, max_length=255)
    
    criteria_met: str = Field(max_length=1000)  # JSON of criteria
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    is_featured: bool = Field(default=False)
```

## 🔗 API Endpoints Design

### Quest Management API
```
POST   /api/v1/quests                      # Create new quest
GET    /api/v1/quests                      # Browse quest board with dynamic filters
       # Query params: party_size_min, party_size_max, location_radius, 
       # commitment_level, difficulty, location_type, category, urgent_only
GET    /api/v1/quests/search               # Semantic search with preferences
       # Body: { "query": "text", "preferences": { filters } }
GET    /api/v1/quests/recommendations      # Personalized recommendations with preferences
       # Query params: available_now, party_size_min, party_size_max, etc.
GET    /api/v1/quests/{quest_id}           # Get quest details
PUT    /api/v1/quests/{quest_id}           # Update quest (creator only)
DELETE /api/v1/quests/{quest_id}           # Delete quest (creator only)
POST   /api/v1/quests/{quest_id}/activate  # Activate quest for discovery
POST   /api/v1/quests/{quest_id}/complete  # Mark quest as completed
POST   /api/v1/quests/merge                # Merge similar quests
```

### Application System API
```
POST   /api/v1/quests/{quest_id}/applications      # Apply to join quest
GET    /api/v1/quests/{quest_id}/applications      # Get applications (creator only)
GET    /api/v1/applications/{application_id}       # Get application details
PUT    /api/v1/applications/{application_id}       # Update application
POST   /api/v1/applications/{application_id}/approve    # Approve application
POST   /api/v1/applications/{application_id}/reject     # Reject application
DELETE /api/v1/applications/{application_id}       # Withdraw application
```

### Party Management API
```
GET    /api/v1/parties/{party_id}                  # Get party details
PUT    /api/v1/parties/{party_id}                  # Update party settings
POST   /api/v1/parties/{party_id}/members          # Add member (invite)
DELETE /api/v1/parties/{party_id}/members/{user_id} # Remove member
GET    /api/v1/parties/{party_id}/messages         # Get party messages
POST   /api/v1/parties/{party_id}/messages         # Send message
PUT    /api/v1/parties/{party_id}/messages/{msg_id} # Edit message
DELETE /api/v1/parties/{party_id}/messages/{msg_id} # Delete message
```

### Rating & Reputation API
```
POST   /api/v1/ratings                             # Submit rating after quest
GET    /api/v1/users/{user_id}/ratings             # Get user's ratings
GET    /api/v1/users/{user_id}/reputation          # Get reputation score
GET    /api/v1/users/me/achievements               # Get my achievements
```

### User Enhancement API
```
GET    /api/v1/users/me/profile                    # Get extended profile
PUT    /api/v1/users/me/profile                    # Update profile
POST   /api/v1/users/me/tags                       # Add skills/tags
DELETE /api/v1/users/me/tags/{tag_id}              # Remove skill/tag
GET    /api/v1/users/me/quests                     # My quests (created + joined)
GET    /api/v1/users/me/applications               # My applications
GET    /api/v1/users/me/notifications              # Get notifications
PUT    /api/v1/users/me/notifications/{notif_id}   # Mark notification as read
```

### Discovery & Matching API
```
GET    /api/v1/discover/similar-quests             # Find similar quests for merging
POST   /api/v1/discover/available-now              # "I'm Available Now" mode with preferences
       # Body: { "preferences": { party_size_min, party_size_max, location_radius, 
       #         commitment_level, communication_style, available_hours } }
POST   /api/v1/discover/browse                     # "Browse Opportunities" with advanced filters
       # Body: { "filters": { category, difficulty, location_type, time_commitment } }
POST   /api/v1/discover/recruit                    # "Recruit for My Quest" reverse matching
       # Body: { "quest_id": "uuid", "target_skills": [], "preferences": {} }
POST   /api/v1/discover/serendipity                # "Serendipity Mode" expanded matching
       # Body: { "expand_interests": true, "surprise_factor": 0.3, "preferences": {} }
GET    /api/v1/discover/trending                   # Trending/popular quests
GET    /api/v1/discover/urgent                     # Urgent quests needing immediate attention
```

### ✅ Tag System API - IMPLEMENTED
```
# Tag Management
GET    /api/v1/tags                                # Browse available tags with filters
POST   /api/v1/tags                                # Create new tag (admin only)
GET    /api/v1/tags/{tag_id}                       # Get tag details
GET    /api/v1/tags/slug/{slug}                    # Get tag by slug
PUT    /api/v1/tags/{tag_id}                       # Update tag (admin only)
DELETE /api/v1/tags/{tag_id}                       # Delete tag (admin only)
GET    /api/v1/tags/suggestions                    # Get tag suggestions based on query
GET    /api/v1/tags/popular                        # Get popular tags by usage
GET    /api/v1/tags/categories                     # Get tag categories with counts

# User Skill Tagging
GET    /api/v1/tags/users/me                       # Get my user tags (skills)
POST   /api/v1/tags/users/me                       # Add skill tag to my profile
PUT    /api/v1/tags/users/me/{tag_id}              # Update my skill tag
DELETE /api/v1/tags/users/me/{tag_id}              # Remove skill tag from my profile
GET    /api/v1/tags/users/{user_id}                # Get public user tags

# Quest Requirement Tagging
GET    /api/v1/tags/quests/{quest_id}              # Get quest tags (requirements)
POST   /api/v1/tags/quests/{quest_id}              # Add tag requirement to quest (owner only)
PUT    /api/v1/tags/quests/{quest_id}/{tag_id}     # Update quest tag requirement (owner only)
DELETE /api/v1/tags/quests/{quest_id}/{tag_id}     # Remove tag requirement from quest (owner only)
```

## 🧠 Business Logic & Algorithms

### Smart Matching Algorithm
```python
def calculate_quest_match_score(user: User, quest: Quest, search_preferences: dict) -> float:
    """
    Calculate compatibility score between user and quest with dynamic preferences
    Score range: 0.0 - 1.0 (higher is better match)
    
    Args:
        user: User profile with skills and reputation
        quest: Quest details and requirements
        search_preferences: Dynamic preferences from search request
    """
    
    # Skill Matching (40% weight)
    skill_score = calculate_skill_compatibility(user.user_tags, quest.quest_tags)
    
    # Availability Matching (25% weight)  
    time_score = calculate_time_compatibility(
        user.availability, 
        quest.start_date, 
        quest.end_date,
        search_preferences.get("available_hours", None)
    )
    
    # Location Matching (15% weight)
    location_score = calculate_location_compatibility(
        user.location, 
        quest.location, 
        quest.location_type,
        search_preferences.get("location_radius", 50)
    )
    
    # Reputation Matching (10% weight)
    reputation_score = normalize_reputation_score(user.reputation_score)
    
    # Search Preference Matching (10% weight)
    preference_score = calculate_search_preference_compatibility(quest, search_preferences)
    
    # Combine scores with weights
    final_score = (
        skill_score * 0.40 +
        time_score * 0.25 +
        location_score * 0.15 +
        reputation_score * 0.10 +
        preference_score * 0.10
    )
    
    return min(final_score, 1.0)

def calculate_search_preference_compatibility(quest: Quest, preferences: dict) -> float:
    """Calculate how well quest matches user's search preferences"""
    
    score = 1.0
    
    # Party size preferences
    if "party_size_min" in preferences and quest.party_size_max < preferences["party_size_min"]:
        score *= 0.5
    if "party_size_max" in preferences and quest.party_size_min > preferences["party_size_max"]:
        score *= 0.5
    
    # Communication style preferences
    if "communication_style" in preferences:
        # Compare with quest's expected communication style or party preferences
        pass
    
    # Commitment level preferences
    if "commitment_level" in preferences:
        commitment_match = calculate_commitment_compatibility(
            quest.time_commitment, 
            preferences["commitment_level"]
        )
        score *= commitment_match
    
    # Difficulty level preferences
    if "difficulty" in preferences and preferences["difficulty"] != quest.difficulty_level:
        score *= 0.8
    
    return score
```

### Discovery Mode Implementations
```python
def handle_available_now_mode(user: User, preferences: dict) -> List[Quest]:
    """
    "I'm Available Now" - Immediate matching for users ready to join activities
    
    Args:
        preferences: {
            "party_size_min": 2,
            "party_size_max": 5,
            "location_radius": 25,
            "commitment_level": "short",  # 'short', 'medium', 'long'
            "communication_style": "casual",
            "available_hours": 4
        }
    """
    
    # Filter quests that can start immediately or within next few hours
    immediate_quests = filter_quests_by_timing(hours_ahead=preferences.get("available_hours", 2))
    
    # Score and rank by compatibility
    scored_quests = []
    for quest in immediate_quests:
        score = calculate_quest_match_score(user, quest, preferences)
        if score >= 0.6:  # High threshold for immediate matching
            scored_quests.append((quest, score))
    
    # Return top matches sorted by score
    return sorted(scored_quests, key=lambda x: x[1], reverse=True)[:10]

def handle_browse_opportunities_mode(user: User, filters: dict) -> List[Quest]:
    """
    "Browse Opportunities" - Traditional search and filter through available parties
    
    Args:
        filters: {
            "category": "gaming",
            "difficulty": "medium",
            "location_type": "remote",
            "time_commitment": "weekend",
            "party_size_min": 3,
            "urgent_only": false
        }
    """
    
    # Apply hard filters first
    filtered_quests = apply_quest_filters(filters)
    
    # Sort by relevance and activity
    return rank_quests_by_activity_and_match(user, filtered_quests, filters)

def handle_recruit_mode(quest: Quest, target_skills: List[str], preferences: dict) -> List[User]:
    """
    "Recruit for My Quest" - Reverse matching to find suitable people for user's party
    
    Find users who would be good matches for the given quest
    """
    
    # Find users with complementary skills
    potential_users = find_users_by_skills(target_skills)
    
    # Score users based on how well they'd fit the quest
    scored_users = []
    for user in potential_users:
        # Reverse the matching - how well does user fit the quest?
        score = calculate_user_quest_fit_score(user, quest, preferences)
        if score >= 0.5:
            scored_users.append((user, score))
    
    return sorted(scored_users, key=lambda x: x[1], reverse=True)[:20]

def handle_serendipity_mode(user: User, preferences: dict) -> List[Quest]:
    """
    "Serendipity Mode" - Algorithm suggests unexpected but compatible opportunities
    
    Args:
        preferences: {
            "expand_interests": true,
            "surprise_factor": 0.3,  # 0.0 = safe matches, 1.0 = wild suggestions
            "base_preferences": { normal preference dict }
        }
    """
    
    surprise_factor = preferences.get("surprise_factor", 0.3)
    base_prefs = preferences.get("base_preferences", {})
    
    # Expand user's interests and skills for broader matching
    expanded_interests = expand_user_interests(user, surprise_factor)
    
    # Find quests in adjacent or related categories
    serendipitous_quests = find_adjacent_category_quests(user, expanded_interests)
    
    # Score with relaxed criteria and serendipity bonus
    scored_quests = []
    for quest in serendipitous_quests:
        base_score = calculate_quest_match_score(user, quest, base_prefs)
        serendipity_bonus = calculate_serendipity_bonus(user, quest, surprise_factor)
        final_score = min(base_score + serendipity_bonus, 1.0)
        
        if final_score >= 0.4:  # Lower threshold for serendipitous matches
            scored_quests.append((quest, final_score))
    
    return sorted(scored_quests, key=lambda x: x[1], reverse=True)[:15]
```

### Quest Merging Logic
```python
def suggest_quest_merge(new_quest: Quest) -> List[Quest]:
    """
    Find similar quests that could be merged with the new quest
    """
    
    # Semantic similarity using embeddings
    similar_quests = find_semantically_similar_quests(
        new_quest.embedding_vector,
        similarity_threshold=0.75
    )
    
    # Filter by additional criteria
    mergeable_quests = []
    for quest in similar_quests:
        if is_mergeable(new_quest, quest):
            mergeable_quests.append(quest)
    
    return mergeable_quests[:5]  # Return top 5 suggestions

def is_mergeable(quest1: Quest, quest2: Quest) -> bool:
    """Check if two quests are compatible for merging"""
    
    # Must be in compatible states
    if quest1.status != "draft" or quest2.status not in ["draft", "active"]:
        return False
    
    # Time compatibility
    if not is_time_compatible(quest1, quest2):
        return False
    
    # Location compatibility  
    if not is_location_compatible(quest1, quest2):
        return False
    
    # Party size compatibility
    combined_size = quest1.current_party_size + quest2.current_party_size
    if combined_size > max(quest1.party_size_max, quest2.party_size_max):
        return False
    
    return True
```

### Reputation System
```python
def update_user_reputation(user: User, new_rating: Rating):
    """Update user's reputation score based on new rating"""
    
    # Get all ratings for this user
    all_ratings = get_user_ratings(user.id)
    
    # Calculate weighted average (recent ratings weighted more)
    weighted_score = calculate_weighted_reputation(all_ratings)
    
    # Apply completion rate bonus
    completion_bonus = user.quest_completion_rate * 0.1
    
    # Apply consistency bonus (for users with many ratings)
    consistency_bonus = min(len(all_ratings) / 100, 0.2)
    
    # Final reputation score
    user.reputation_score = min(weighted_score + completion_bonus + consistency_bonus, 5.0)
    
    # Update completion rate
    user.quest_completion_rate = calculate_completion_rate(user.id)
```

### Real-time Notifications
```python
def notify_quest_match(user: User, quest: Quest, match_score: float):
    """Send notification about highly matched quest"""
    
    if match_score >= 0.85:  # High match threshold
        notification = Notification(
            user_id=user.id,
            title="Perfect Quest Match Found!",
            message=f"We found a quest that matches your skills: {quest.title}",
            notification_type="quest_match",
            related_quest_id=quest.id
        )
        
        # Send via WebSocket for real-time
        send_websocket_notification(user.id, notification)
        
        # Send email if user preferences allow
        if user.email_notifications_enabled:
            send_email_notification(user.email, notification)
```

## 🚀 Implementation Roadmap

### ✅ Phase 1: Foundation (Week 1-2) - **100% COMPLETE**
**Database & Models**
- ✅ Create all SQLModel classes with proper relationships
- ✅ Write comprehensive Alembic migrations  
- ✅ Implement basic CRUD operations for all models
- ✅ Set up proper foreign key constraints and indexes

**Core Quest System**
- ✅ Quest creation and management endpoints
- ✅ Basic quest board with filtering
- ✅ Quest status lifecycle management
- ✅ Application system (apply, approve, reject)

**Enhanced Features (Beyond Original Plan)**
- ✅ **Tag System**: Complete skill/interest tagging with UserTag and QuestTag
- ✅ **Rating System**: Post-quest feedback and reputation calculation
- ✅ **Message System**: Party communication with threading support
- ✅ **Notification System**: User engagement and system announcements
- ✅ **Achievement System**: Gamification with automatic achievement checking
- ✅ **Enhanced Party System**: Simplified role-based permissions (OWNER/MODERATOR/MEMBER)
- ✅ **Model Refactoring**: Removed user search preferences, quest complexity fields, and party communication settings for cleaner architecture

**Testing**
- ⚠️ Write unit tests for all models *(moved to next phase)*
- ⚠️ Create test data fixtures *(moved to next phase)*
- ⚠️ Basic API endpoint tests *(moved to next phase)*

### 🚧 Phase 2: Smart Features (Week 3-4) - **30% COMPLETE**
**Foundation Ready ✅**
- ✅ **Tag System Infrastructure**: Complete UserTag/QuestTag system for skill matching
- ✅ **User Profile Enhancement**: Skills, availability, reputation tracking
- ✅ **Analytics Tracking**: Quest views, application rates, completion statistics
- ✅ **Database Schema**: Embedding vector fields ready for semantic search
- ✅ **CRUD Operations**: All matching data available through comprehensive APIs

**Matching Engine**
- ⚠️ Integrate vector database (Pinecone/Milvus) *(database ready)*
- ⚠️ Implement semantic embedding generation *(embedding fields exist)*
- ⚠️ Build recommendation algorithm *(tag matching foundation complete)*
- ⚠️ Quest merging suggestion system *(similarity detection ready)*

**Enhanced APIs**
- ⚠️ Semantic search endpoint *(tag search implemented, needs embedding enhancement)*
- ⚠️ Recommendation endpoint *(user/quest data available, needs algorithm)*
- ⚠️ Similar quest detection *(quest comparison logic needed)*
- ✅ Advanced filtering and sorting *(comprehensive filtering implemented)*

**Background Tasks**
- ⚠️ Set up Celery for async processing
- ⚠️ Embedding generation pipeline *(vector fields ready)*
- ✅ Notification dispatch system *(notification CRUD complete)*
- ✅ Reputation score updates *(rating system with reputation calculation complete)*

### Phase 3: User Experience (Week 5-6)
**Frontend Components**
- [ ] Quest board with MMO-style cards
- [ ] Quest creation wizard
- [ ] Application flow UI
- [ ] Party management interface
- [ ] User profile enhancement

**Real-time Features**
- [ ] WebSocket integration for live updates
- [ ] Real-time party chat
- [ ] Live quest status updates
- [ ] Push notifications

**Mobile Responsive**
- [ ] Responsive design for all components
- [ ] Touch-friendly interactions
- [ ] Mobile-optimized quest browsing

### Phase 4: Communication & Collaboration (Week 7)
**Party Communication**
- [ ] In-party chat system
- [ ] Message threading and replies
- [ ] File sharing capabilities
- [ ] @mention notifications

**Coordination Tools**
- [ ] Scheduling polls
- [ ] Shared task lists
- [ ] Meeting coordination
- [ ] Progress tracking

### Phase 5: Gamification & Polish (Week 8)
**Reputation & Achievements**
- [ ] Achievement system
- [ ] Reputation display and badges
- [ ] Quest completion certificates
- [ ] Leaderboards and stats

**Analytics & Insights**
- [ ] User analytics dashboard
- [ ] Quest success metrics
- [ ] Matching effectiveness tracking
- [ ] Platform usage statistics

**Performance & Security**
- [ ] API rate limiting
- [ ] Query optimization
- [ ] Security audit
- [ ] Performance testing

## 🔧 Technical Architecture

### Backend Stack
- **Core**: FastAPI + SQLModel + PostgreSQL
- **Vector DB**: Pinecone (for semantic search)
- **Cache**: Redis (sessions, frequent queries)
- **Queue**: Celery + Redis (background tasks)
- **AI**: OpenAI API (embeddings, LLM features)
- **Storage**: AWS S3 (file uploads)
- **Monitoring**: Sentry (error tracking)

### Frontend Stack
- **Framework**: React 18 + TanStack Router
- **UI Library**: Chakra UI v3
- **State**: TanStack Query + Zustand
- **Real-time**: Socket.io client
- **Forms**: React Hook Form + Zod validation
- **Testing**: Playwright (E2E) + Vitest (unit)

### Infrastructure
- **Deployment**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Database**: PostgreSQL with pgvector extension
- **Reverse Proxy**: Traefik
- **SSL**: Let's Encrypt (production)

### Development Workflow
1. **Local Development**: Docker Compose with hot reload
2. **Testing**: Comprehensive test suite with CI
3. **Code Quality**: Pre-commit hooks + ESLint + Ruff
4. **Database**: Alembic migrations with proper rollback
5. **API Documentation**: Auto-generated OpenAPI docs

## 📊 Success Metrics & KPIs

### User Engagement
- **Daily Active Users (DAU)**
- **Quest Creation Rate** (quests created per user per week)
- **Application Success Rate** (applications leading to party formation)
- **Quest Completion Rate** (started quests that reach completion)
- **User Retention** (7-day, 30-day retention rates)

### Platform Health
- **Time to Party Formation** (average time from quest creation to full party)
- **Match Quality Score** (user satisfaction with recommendations)
- **Quest Merge Success Rate** (percentage of suggested merges accepted)
- **Average Party Size** vs **Optimal Party Size**
- **Platform Growth Rate** (new user acquisition)

### Technical Metrics
- **API Response Times** (95th percentile < 200ms)
- **Search Accuracy** (semantic search relevance scores)
- **Recommendation CTR** (click-through rate on recommendations)
- **System Uptime** (99.9% target)
- **Database Performance** (query execution times)

## 🚨 Risk Assessment & Mitigation

### Technical Risks
1. **Vector Database Scaling**
   - Risk: Performance degradation with large user base
   - Mitigation: Implement proper indexing, consider sharding strategy

2. **Real-time Communication Load**
   - Risk: WebSocket connections overwhelming server
   - Mitigation: Connection pooling, horizontal scaling, message queuing

3. **Recommendation Algorithm Accuracy**
   - Risk: Poor matches leading to user frustration
   - Mitigation: A/B testing, feedback loops, manual override options

### Business Risks
1. **Cold Start Problem**
   - Risk: Low initial user base leads to few quests/parties
   - Mitigation: Seed with sample quests, influencer partnerships, gradual rollout

2. **User Safety & Moderation**
   - Risk: Inappropriate content or behavior in parties
   - Mitigation: Reporting system, automated content moderation, manual review process

3. **Quest Quality Control**
   - Risk: Low-quality or fake quests degrading platform value
   - Mitigation: Quest validation, reputation system, community moderation

## 📚 Next Steps

### Immediate Actions (This Week)
1. **Set up development environment** with new database models
2. **Create comprehensive Alembic migration** for all new tables
3. **Implement Quest CRUD operations** with proper validation
4. **Build basic quest board API** with filtering capabilities
5. **Create simple frontend quest display** component

### Following Week
1. **Implement application system** (apply → review → approve flow)
2. **Add party formation logic** when quest reaches required members
3. **Build user profile enhancement** with skills/tags
4. **Create quest creation wizard** with proper UX
5. **Set up basic matching algorithm** without AI initially

### Long-term Milestones
- **Month 1**: Core quest and party system fully functional
- **Month 2**: Smart matching and recommendation engine live  
- **Month 3**: Real-time communication and coordination tools
- **Month 4**: Reputation system and gamification features
- **Month 5**: Mobile optimization and performance tuning
- **Month 6**: Beta launch with initial user group

---

## 📝 Conclusion

This plan transforms the current FastAPI boilerplate into a comprehensive quest-based collaboration platform. The design prioritizes user experience while maintaining technical scalability and includes detailed implementation steps for each component.

**Key Success Factors:**
1. **User-Centric Design**: Every feature serves the core user journey
2. **Technical Excellence**: Scalable architecture with proper testing
3. **Iterative Development**: MVP approach with continuous improvement
4. **Data-Driven Decisions**: Analytics and feedback drive feature development
5. **Community Building**: Features that encourage positive user interactions

The next phase involves implementing the database models and core quest system, establishing the foundation for all subsequent features.
