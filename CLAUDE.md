# Look For Party (LFP) - Intent-First Quest Collaboration Platform

## Context & Overview
- **Project Vision**: Intent-first platform where users start with what they want to accomplish and find compatible party members
- **Core Innovation**: Quest-based collaboration system that matches people based on objectives, not existing connections
- **Technical Foundation**: FastAPI + SQLModel + React + TanStack Router + Chakra UI v3
- **Github URL**: github.com/chezzijr/look-for-party

## Key Reference Documents
- **PLAN.md** - Comprehensive development roadmap, database schema, API design, and implementation strategy
- **README.md** & **PROJECT.md** - Platform vision, features, and user journey
- **FLOWS.md** - Core user flows and interaction patterns
- **development.md** - Development setup and workflow
- **@justfile** - Development commands and scripts

## Development Standards
- Commands for development: `@justfile`
- Development workflow: `@development.md` 
- Database migrations: Use Alembic, always test rollbacks
- API design: RESTful with OpenAPI docs, consistent naming
- Code quality: Pre-commit hooks, comprehensive testing, type safety

## Development Workflow & Documentation Standards

### Feature Completion Workflow
When completing features or development phases, ALWAYS follow this documentation update sequence:

1. **Complete the Implementation**
   - Finish coding, testing, and verification of the feature/phase
   - Ensure all CRUD operations, API endpoints, and business logic are working

2. **Update PROGRESS.md**
   - Update overall completion percentage
   - Mark completed tasks with ✅ 
   - Add new milestones and achievement dates
   - Update "What's Working Now" and "What's Ready to Build" sections
   - Document any technical insights or implementation decisions

3. **Update PLAN.md** 
   - Update the implementation status section at the top
   - Mark completed phases/features with ✅ in the roadmap
   - Update progress percentages for each phase
   - Add notes about features completed beyond the original plan
   - Update "Still Needed" sections with current priorities

4. **Update CLAUDE.md (if applicable)**
   - Update implementation status sections
   - Mark completed features with ✅
   - Update phase descriptions and priorities
   - Add new technical architecture details if infrastructure changed
   - Update development scripts if new commands were added

5. **Update README.md (if applicable)**
   - Update development status and implementation progress
   - Update tech stack or feature descriptions if significantly changed
   - Keep "What's Implemented & Working" section current

6. **Commit Documentation Updates**
   - Create a dedicated commit for documentation updates
   - Use descriptive commit messages like "docs: update progress after completing Phase 1 foundation"

### Documentation Consistency Rules
- **Status Indicators**: Use ✅ for completed, 🚧 for in-progress, ⚠️ for pending/needed
- **Percentage Updates**: Keep percentages consistent across PROGRESS.md and PLAN.md  
- **Date Stamps**: Always update "Last Updated" dates when making changes
- **Cross-References**: Ensure all three docs reference the same completion status
- **Implementation Insights**: Document key decisions, challenges, and solutions in PROGRESS.md

### When to Update Documentation
- **After completing any major feature or system** (e.g., completing CRUD operations for a model)
- **After completing a development phase** (e.g., Phase 1: Foundation) 
- **After significant architectural changes** (e.g., adding new API routes, database migrations)
- **Before starting the next major development phase**
- **When implementation significantly exceeds or deviates from the original PLAN.md**
- **MANDATORY: After implementing any new model, API endpoint, or core functionality** - Documentation updates are not optional

### Documentation Update Priority
**CRITICAL**: Documentation updates must be treated as part of the implementation, not an afterthought. The feature is not considered complete until all relevant documentation (PROGRESS.md, PLAN.md, CLAUDE.md, README.md) accurately reflects the current state.

This workflow ensures project documentation always reflects current reality and provides accurate guidance for future development phases.

## LFP Platform Architecture

### Current Implementation Status
**Latest Update**: Enhanced Quest System Implementation completed (September 15, 2025)
- ✅ **User Model**: Streamlined by removing search preferences (preferred_commitment_level, communication_style)
- ✅ **Enhanced Quest Model**: Dual-mode recruitment platform supporting individual and party-created quests with QuestType enum (INDIVIDUAL, PARTY_INTERNAL, PARTY_EXPANSION, PARTY_HYBRID), party integration fields, and quest closure logic
- ✅ **Enhanced Party Model**: Expanded with quest creation relationships, supports party quest management and member assignment workflows
- ✅ **PartyMember Model**: Updated roles (OWNER/MODERATOR/MEMBER) with implicit permissions for quest creation
- ✅ **Application Model**: Complete quest application system with enhanced fields (relevant_skills, created_at, updated_at), moved to dedicated application.py file
- ✅ **Tag System**: Comprehensive tag infrastructure with Tag, UserTag, QuestTag models, 16 balanced categories, 300 system tags seeded
- ✅ **Rating System**: Complete party-based peer review system with multi-dimensional ratings (overall, collaboration, communication, reliability, skill), automatic reputation updates, comprehensive validation (prevents self-rating, duplicate ratings, non-member ratings)
- ✅ **Enhanced Quest API**: Party quest creation, quest publicizing, member assignment, and automatic party formation endpoints
- ✅ **Database Migrations**: Successfully applied all migrations with 165+ backend tests passing

### Current Frontend Routes (Post-Refactor)
The frontend uses TanStack Router with file-based routing:

**Public Routes (unauthenticated):**
- `/` - Landing page with platform overview and CTAs ✅ COMPLETED
- `/login` - User login page ✅ COMPLETED
- `/signup` - User registration page ✅ COMPLETED
- `/recover-password` - Password recovery form ✅ COMPLETED
- `/reset-password` - Password reset form (with token) ✅ COMPLETED

**Protected Routes (require authentication, under `/_layout`):**
- `/dashboard` - User dashboard after authentication ✅ COMPLETED
- `/settings` - User settings page with tabs:
  - My profile (user information)
  - Password (change password)
  - Appearance (theme settings)
  - Danger zone (delete account) - hidden for superusers

**Future LFP Routes (To Be Implemented):**
- `/quests` - Quest board with MMO-style interface and tag-based filtering
- `/quests/create` - Quest creation wizard with skill tag requirements
- `/quests/{id}` - Individual quest details and application with skill matching
- `/my-quests` - User's created and joined quests
- `/my-applications` - Application status tracking
- `/parties/{id}` - Party management and communication
- `/profile` - Enhanced user profile with skills and reputation via tag system
- `/discover` - AI-powered quest recommendations with tag-based compatibility

### Tech Stack
**Frontend:**
- **Framework**: React 18 + TanStack Router (file-based routing)
- **UI Library**: Chakra UI v3 (consistent theme system)
- **State Management**: TanStack Query (React Query) + Zustand
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Socket.io client (for live quest updates)
- **Testing**: Playwright (E2E) + Vitest (unit tests)
- **Build Tool**: Vite + TypeScript

**Backend:**
- **API Framework**: FastAPI + SQLModel + PostgreSQL
- **Authentication**: JWT-based with secure refresh tokens
- **Vector DB**: Pinecone (for semantic quest matching)
- **Cache/Queue**: Redis (caching + Celery background tasks)
- **AI Integration**: OpenAI API (embeddings, recommendations)
- **File Storage**: AWS S3 (quest attachments, user avatars)

### Development Scripts
**Frontend:**
- `npm run dev` - Development server with hot reload
- `npm run build` - Production build with TypeScript checking
- `npm run lint` - Biome linter (with auto-fix)
- `npm run generate-client` - Generate API client from OpenAPI
- `npx playwright test` - Run E2E tests

**Backend:**
- `just up` - Start development containers
- `just down` - Stop development containers  
- `just generate_migration "message"` - Create new migration
- `just migrate_up` - Apply migrations
- `just exec backend pytest` - Run backend tests

### Current Testing Coverage
**Frontend Tests** - Located in `/frontend/tests/`:
- `login.spec.ts` - Authentication flow testing ✅
- `user-settings.spec.ts` - Profile and settings management ✅
- `sign-up.spec.ts` - User registration flow ✅
- `reset-password.spec.ts` - Password recovery flow ✅
- `auth.setup.ts` - Test authentication utilities ✅

**Backend Tests** - 178+ tests passing:
- User authentication and management tests ✅
- Quest CRUD operations tests ✅
- Party and application system tests ✅
- **Enhanced Quest System flow tests** - Complete FLOWS.md implementation coverage ✅
- **Tag system tests** - Complete CRUD and API route tests ✅
- **Rating system tests** - Complete CRUD and API route tests with comprehensive validation ✅
- Database migration and cleanup tests ✅

## Key Implementation Principles

### Database Design
- **UUID Primary Keys**: Maintain existing UUID system for all models
- **Proper Relationships**: Use SQLModel relationships with cascade rules
- **Migration Strategy**: Alembic migrations with proper rollback testing
- **Indexing**: Strategic indexes for query performance
- **Enum Fields**: For enum fields with default values, always include `sa_column_kwargs={"server_default": EnumValue.DEFAULT.value}` to ensure PostgreSQL database-level defaults match SQLModel defaults
- **Forward References**: When using string annotations for forward references with Optional types, use `Optional["ModelName"]` instead of `"ModelName" | None` to avoid TypeError in Python < 3.10

### API Design Standards
- **REST Conventions**: Consistent endpoint naming and HTTP methods
- **OpenAPI Documentation**: Auto-generated docs with examples
- **Error Handling**: Standardized error responses with helpful messages
- **Pagination**: Consistent pagination for list endpoints
- **Filtering**: Flexible filtering with query parameters

### Frontend Development
- **Component Architecture**: Reusable components with consistent props
- **State Management**: TanStack Query for server state, Zustand for client state
- **Type Safety**: Comprehensive TypeScript coverage
- **Testing Strategy**: E2E tests for user flows, unit tests for utilities
- **Performance**: Code splitting and lazy loading for optimal bundle size

## GitHub Actions Debugging Flow

When GitHub Actions fail (especially Playwright tests), use the MCP GitHub server to diagnose issues:

### Step 1: Get Current Branch Info
```
# Get current branch name
git branch --show-current

# If on feat/landing-page, we need to check workflows for this branch
```

### Step 2: List Workflow Runs for Current Branch
Use MCP GitHub server to get workflow runs filtered by branch:
```
mcp__github__list_workflow_runs
- owner: "chezzijr" 
- repo: "look-for-party"
- workflow_id: "playwright.yml" (or get workflow ID first)
- branch: "feat/landing-page" (or current branch)
- perPage: 10 (to limit results)
```

### Step 3: Get Failed Workflow Run Details
From the workflow runs list, identify the failed run ID and get details:
```
mcp__github__get_workflow_run
- owner: "chezzijr"
- repo: "look-for-party" 
- run_id: [failed_run_id]
```

### Step 4: Get Failed Job Logs (Most Efficient)
Use the efficient method to get only failed job logs:
```
mcp__github__get_job_logs
- owner: "chezzijr"
- repo: "look-for-party"
- run_id: [failed_run_id]
- failed_only: true
- return_content: true
- tail_lines: 500 (to limit output and focus on recent errors)
```

### Step 5: Identify Specific Test Failures
Look for patterns in the logs:
- `Error: page.waitForURL: Test timeout`
- Specific test file and line numbers
- Expected vs actual behavior
- Network/service issues

### Alternative: Get Specific Job Logs
If you need logs from a specific job:
1. First list jobs for the workflow run:
```
mcp__github__list_workflow_jobs
- owner: "chezzijr"
- repo: "look-for-party"  
- run_id: [failed_run_id]
```

2. Then get logs for specific failed job:
```
mcp__github__get_job_logs
- owner: "chezzijr"
- repo: "look-for-party"
- job_id: [specific_job_id]
- return_content: true
- tail_lines: 500
```

### Token Management Tips
- Use `perPage: 10` or smaller to limit results
- Use `tail_lines: 500` to get recent log content only  
- Use `failed_only: true` to focus on failed jobs
- Filter by current branch to avoid irrelevant results
- Use `return_content: true` to get actual log content vs URLs

### Common Playwright Test Issues to Look For
- Route expectation mismatches (e.g., expecting `/login` but getting `/`)
- Component selector changes
- Timing issues with `waitForURL` or element visibility
- Authentication flow changes
- Container startup issues in CI environment
