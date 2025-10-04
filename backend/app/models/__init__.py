# SQLModel base (needed for alembic migrations)
from sqlmodel import SQLModel

# Application models
from .application import (
    ApplicationStatus,
    QuestApplication,
    QuestApplicationBase,
    QuestApplicationCreate,
    QuestApplicationDetail,
    QuestApplicationPublic,
    QuestApplicationsPublic,
    QuestApplicationUpdate,
)

# Message models
from .msg import Message, NewPassword, Token, TokenPayload

# Party models
from .party import (
    PartiesPublic,
    Party,
    PartyBase,
    PartyCreate,
    PartyDetail,
    PartyDetailedMembersPublic,
    PartyMember,
    PartyMemberBase,
    PartyMemberCreate,
    PartyMemberDetail,
    PartyMemberPublic,
    PartyMemberRole,
    PartyMembersPublic,
    PartyMemberUpdate,
    PartyPublic,
    PartyStatus,
    PartyUpdate,
)

# Quest models
from .quest import (
    CommitmentLevel,
    LocationType,
    PartyQuestCreate,
    Quest,
    QuestBase,
    QuestCategory,
    QuestCreate,
    QuestDetail,
    QuestMemberAssignmentRequest,
    QuestPublic,
    QuestPublicizeRequest,
    QuestsPublic,
    QuestStatus,
    QuestType,
    QuestUpdate,
    QuestVisibility,
)

# Quest member models
from .quest_member import (
    JoinMethod,
    QuestMember,
    QuestMemberAssignRequest,
    QuestMemberBase,
    QuestMemberBulkUpdate,
    QuestMemberCreate,
    QuestMemberDetail,
    QuestMemberDetailedPublic,
    QuestMemberPublic,
    QuestMemberRole,
    QuestMembersPublic,
    QuestMemberStatus,
    QuestMemberUpdate,
)

# Rating models
from .rating import (
    Rating,
    RatingBase,
    RatingCreate,
    RatingDetail,
    RatingPublic,
    RatingsPublic,
    RatingUpdate,
    UserRatingSummary,
)

# Tag models
from .tag import (
    ProficiencyLevel,
    QuestTag,
    QuestTagBase,
    QuestTagCreate,
    QuestTagPublic,
    QuestTagsPublic,
    QuestTagUpdate,
    Tag,
    TagBase,
    TagCategory,
    TagCreate,
    TagDetail,
    TagPublic,
    TagsPublic,
    TagStatus,
    TagUpdate,
    UserTag,
    UserTagBase,
    UserTagCreate,
    UserTagPublic,
    UserTagsPublic,
    UserTagUpdate,
)

# User models
from .user import (
    UpdatePassword,
    User,
    UserBase,
    UserCreate,
    UserProfile,
    UserPublic,
    UserRegister,
    UsersPublic,
    UserUpdate,
    UserUpdateMe,
)

# Rebuild forward references
QuestPublic.model_rebuild()
