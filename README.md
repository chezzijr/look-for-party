# Look For Party (LFP)
*Intent-first platform for quest-based collaboration*

**What is LFP?**
A platform that flips social media on its head: instead of finding people then deciding what to do together, users start with **what they want to accomplish** and find the right party members to make it happen.

**Core Innovation:**
LFP addresses the gap in existing social platforms where group discovery requires prior connections or invitations. Users create "quests" (activity requests) and the platform intelligently matches compatible party members based on skills, availability, and objectives.

## Why LFP?
- **Intent-First:** Start with "What do you want to do?" not "Who do you know?"
- **Temporary by Design:** Form parties for specific quests, disband when complete
- **Smart Matching:** Algorithm finds complementary skills and compatible schedules
- **Quest-Based UI:** Familiar MMO-style interface for goal-oriented collaboration

## How It Works
1. **Create Quest:** Define your objective, required skills, party size, timeline
2. **Smart Discovery:** Browse quest board or get matched via algorithm
3. **Apply & Connect:** Send application message, get approved by quest master
4. **Coordinate & Execute:** Use built-in tools for planning and communication
5. **Complete & Rate:** Mark quest complete, rate party members for reputation system

## Quest Examples
**Gaming:** "Need 2 DPS for mythic raid, Tues/Thurs 8-11pm EST"  
**Professional:** "Seeking frontend dev for 3-month startup project, part-time"  
**Social:** "Looking for hiking buddy, weekend trails around Denver"  
**Learning:** "Form study group for bar exam, twice weekly meetups"  
**Creative:** "Need writer for webcomic collaboration, long-term project"

## Platform Features

### Quest Creation & Management
- **Quest Posting:** Define objective, party size (min/max), required skills, duration, location
- **Quest Merging:** Auto-merge similar quests to avoid duplication and increase matching
- **Visibility Controls:** Open (public applications) or Closed (invitation-only)

### Smart Discovery
- **Natural Language Search:** "Looking for weekend coding project" matches relevant quests
- **Multi-Criteria Matching:** Bio, skills, location, availability, group size preferences
- **Intelligent Filtering:** Tags, location radius, commitment preferences

### Application System
- **Application Messages:** Personalized "cover letter" explaining interest and qualifications
- **Quest Master Review:** Approve/deny applications with feedback
- **Application History:** Transparent record of all applications and decisions

### Quest Lifecycle
- **Status Tracking:** Active → In Progress → Completed → Archived
- **Analytics:** Success rates, popular activities, matching effectiveness
- **Archive System:** Maintain history without cluttering active quest board

### Reputation System
- **Post-Quest Rating:** Party members rate each other on reliability, skills, teamwork
- **Credit Score:** Algorithmic score based on ratings, completion rate, participation history
- **Impact:** Higher scores get better visibility, auto-approval, priority matching
- **Recovery Path:** Reputation can be rebuilt through consistent positive participation

### Quest Board Interface
- **Visual Quest Log:** MMO-inspired interface displaying available parties as quest cards
- **Color-Coded Categories:** 
  - **Urgent** (red) - Needs immediate filling or starting soon
  - **Active** (green) - Regular recruiting, good availability
  - **Long-term** (blue) - Future planning, flexible timeline
- **Quick Filters:** "Available Now", "This Week", "Long-term", "Remote", "In-Person"
- **Live Status Updates:** Real-time updates on party formation progress and available slots

### Discovery Modes
- **"I'm Available Now":** Immediate matching for users ready to join activities within hours
- **"Browse Opportunities":** Traditional search and filter through available parties
- **"Recruit for My Quest":** Reverse matching where the system actively finds suitable people for your party
- **"Serendipity Mode":** Algorithm suggests unexpected but compatible opportunities based on expanded interest matching

### Smart Matching Algorithms
- **Skill Complementarity:** Matches based on what the party needs rather than just similarity
- **Temporal Alignment:** Time zone coordination for online activities, schedule matching for in-person events
- **Dynamic Commitment Matching:** Flexible matching based on request-time preferences rather than static user profiles
- **Geographic Proximity:** Location-aware matching for in-person activities with travel distance preferences

### Communication & Coordination
- **Party Chat:** Purpose-built communication for quest planning and execution
- **Coordination Tools:** Scheduling polls, shared checklists, file sharing, role assignments
- **Structured Channels:** Planning discussions separate from general chat
- **Smart Onboarding:** Guided intro flow for new party members

### Gamification
- **Achievements:** Quest completions, "Reliable Teammate" badges, "Quest Master" ratings, domain expertise
- **Progress Tracking:** Completion rates, satisfaction scores, repeat collaborations
- **Unlockables:** Advanced features, priority matching, special recognition via participation history

### User Profiles
- **Skills & Interests:** Comprehensive tagging for precise matching
- **Availability:** Calendar integration for scheduling coordination
- **Portfolio:** Showcase experience, past projects, achievements
- **Preferences:** Group size, activity types, leadership style
- **Quest History:** Public record of completed quests and ratings received

---

## 🚀 Current Development Status

**Overall Progress:** 45% Complete (Phase 2 - Smart Features: 70% complete)

### ✅ **What's Implemented & Working**
- **Core Backend Foundation:** FastAPI + SQLModel + PostgreSQL with streamlined, production-ready models
- **Authentication System:** Complete user registration, login, password recovery flows
- **Quest Management:** Full CRUD operations with quest lifecycle management
- **Party System:** Role-based permissions (OWNER/MODERATOR/MEMBER) with member management and status lifecycle (ACTIVE → COMPLETED → ARCHIVED)
- **Application Flow:** Complete apply → review → approve/reject workflow
- **Database Architecture:** Clean, normalized schema optimized for matching algorithms
- **Development Environment:** Docker Compose with hot reload and comprehensive testing (90/90 backend tests passing)

### 🚧 **In Development**
- **Semantic Search Engine:** Vector database integration with OpenAI embeddings
- **Smart Matching Algorithms:** Multi-factor compatibility scoring system
- **Frontend Quest Board:** MMO-style interface for quest discovery

### ⚠️ **Planned Next**
- **Real-time Communication:** WebSocket integration for live updates and party chat
- **Mobile Optimization:** Responsive design and mobile-first quest browsing
- **Recommendation Engine:** Personalized quest suggestions and serendipity matching

---

## Technical Implementation
### Matching Algorithm Overview

Hybrid recommendation system combining multiple techniques for accurate, relevant, scalable quest-party matching:

**Content-Based Filtering**
- **Semantic Matching:** Sentence embeddings (BERT) capture meaning beyond keywords
- **Tag Matching:** Explicit skill/interest tags with LLM-suggested enrichment
- **Advantage:** Solves cold-start problem for new users/quests

**Collaborative Filtering**
- **User Similarity:** Find users with similar quest history, recommend their unexplored quests
- **Matrix Factorization:** Decompose user-quest interactions into latent features
- **Advantage:** Enables serendipitous discovery, improves with community growth

**Hybrid Scoring & Optimization**
- **Weighted Formula:** `Score = (w1 × Semantic) + (w2 × Tags) + (w3 × Collaborative)`
- **Multi-Signal Integration:** Click behavior, time spent viewing, application patterns
- **Vector Database:** Pinecone/Milvus for real-time similarity search at scale
- **A/B Testing:** Continuous model optimization via Precision@k, CTR, join rates

---

## 🛠️ Development Setup

### Quick Start
```bash
# Clone and setup
git clone https://github.com/chezzijr/look-for-party.git
cd look-for-party

# Initialize dependencies 
just init

# Start development environment
just up

# Run tests
just test-backend
```

### Tech Stack
- **Backend:** FastAPI + SQLModel + PostgreSQL + Redis
- **Frontend:** React 18 + TanStack Router + Chakra UI v3
- **AI/Search:** OpenAI API + Pinecone (planned)
- **Development:** Docker Compose + Just + Playwright

### Key Commands
- `just up/down` - Start/stop development containers
- `just migrate_up` - Apply database migrations
- `just test-backend` - Run backend tests (90/90 passing)
- `npm run dev` - Start frontend development server

*See [development.md](development.md) and [PLAN.md](PLAN.md) for comprehensive setup and architecture details.*
