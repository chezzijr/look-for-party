# LFP User Action Flows
*Comprehensive user interaction patterns for the Look For Party recruitment platform*

## Table of Contents
1. [Profile Flow](#profile-flow)
2. [Quest Flow (Recruitment)](#quest-flow-recruitment)
3. [Application Flow](#application-flow)
4. [Party Flow](#party-flow)
5. [Search & Discovery Flow](#search--discovery-flow)
6. [Rating & Reputation Flow](#rating--reputation-flow)
7. [Notification Flow](#notification-flow)

---

## Profile Flow

### User Registration & Onboarding
```mermaid
User → Landing Page → Sign Up → Email Verification → Profile Setup → Dashboard
```

**1. Initial Registration**
- User visits landing page
- Clicks "Sign Up" button
- Fills registration form (email, username, password)
- System sends verification email
- User clicks verification link → Account activated

**2. Profile Setup (First-time users)**
- Required: Basic info (name, bio, location, timezone)
- Required: Add initial skills/tags (minimum 3)
- Optional: Availability schedule, profile picture
- Optional: Connect social accounts
- Complete setup → Redirect to dashboard

**3. Profile Management (Ongoing)**
- Edit profile information
- **Skills Management:**
  - Add new skills with proficiency levels (Beginner → Expert)
  - Set primary skills (displayed prominently)
  - Remove outdated skills
- **Availability Updates:**
  - Update weekly schedule
  - Set temporary availability changes
  - Configure notification preferences
- **Privacy Settings:**
  - Profile visibility (Public/Private/Friends only)
  - Control what information is shared in quest applications

**4. Reputation Monitoring**
- View reputation score breakdown
- Check recent ratings received
- Review quest completion history
- Track achievements and badges earned

---

## Quest Flow (Recruitment)

### Enhanced Quest Creation Process
The quest system operates as a **dual-mode recruitment platform** supporting both individual recruitment and team expansion.

**A. Individual User Creates Quest (New Party Formation)**
```
User Idea → Create Quest → Set Requirements → Publish → Review Applications → Approve Members → Quest Closes → New Party Created
```

1. **Quest Creation Wizard**
   - **Step 1 - Basic Info:**
     - Quest title (recruitment-style): "Need 2 developers for weekend hackathon"
     - Description of objective and what you're building
     - Category selection (Gaming, Professional, Creative, etc.)

   - **Step 2 - Team Requirements:**
     - Party size (minimum/maximum members needed)
     - Required skills/tags with proficiency levels
     - Nice-to-have skills (optional)
     - Role descriptions if specific positions needed

   - **Step 3 - Logistics:**
     - Timeline (start date, duration, deadline)
     - Location type (Remote, In-person, Hybrid)
     - Specific location if in-person
     - Time commitment level

   - **Step 4 - Preferences:**
     - Auto-approve applications (yes/no)
     - Visibility (Public, Private, Invite-only)
     - Communication style preferences
     - Experience level preferences

2. **Quest Publishing**
   - Quest status: Draft → Active (visible on quest board)
   - Quest owner automatically becomes party owner when party forms
   - System generates quest embedding for smart matching
   - Quest appears in discovery feeds for matching users

**B. Party Creates Quest (Team Expansion)**
```
Existing Party → Identify Need → Create Party Quest → Set Requirements → Choose Visibility → Review Applications → Add New Members to Existing Party
```

1. **Party Quest Creation Wizard**
   - **Permission Check:** Only party Owner or Moderator can create quests
   - **Step 1 - Quest Purpose:**
     - **Internal Assignment:** Assign specific task to existing party members
     - **Team Expansion:** Recruit new members to join existing party
     - **Hybrid Mode:** Start internal, option to publicize later

   - **Step 2 - Requirements (for expansion quests):**
     - Number of new members needed
     - Required skills/roles for new members
     - Integration expectations with existing team

   - **Step 3 - Visibility Control:**
     - **Internal Only:** Visible only to party members (task assignment)
     - **Public Recruitment:** Visible on quest board for applications
     - **Hybrid:** Start internal with option to "publicize X slots" later

   - **Step 4 - Member Assignment (internal quests):**
     - Select specific party members to assign
     - Set deadline and requirements
     - Add description and context

2. **Party Quest Types**
   - **Internal Task Assignment:** "John and Sarah: Research market analysis for our app"
   - **Public Team Expansion:** "Our 3-person dev team needs 1 UX designer"
   - **Hybrid Recruitment:** "Need backend dev - check with team first, then go public"
   - **Emergency Publicizing:** "Quest for 5 members, only 3 in party, publicize 2 slots"

### Quest Management
1. **Active Quest Management**
   - Edit quest details (before applications start coming in)
   - View application list with applicant profiles
   - Send messages to applicants for clarification
   - Pause/unpause quest visibility
   - View quest analytics (views, applications, match scores)

2. **Application Review Process**
   - **Receive Application:**
     - Notification of new application
     - View applicant profile, skills, and application message
     - See compatibility score and skill match analysis

   - **Review Options:**
     - **Approve:** Send welcome message, add to pending party members
     - **Reject:** Send optional feedback message
     - **Request More Info:** Ask follow-up questions
     - **Schedule Interview:** For important roles (optional feature)

3. **Quest Closure Triggers**
   - **Manual Closure:** Owner decides they have enough good applicants
   - **Automatic Closure:**
     - Maximum party size reached with approved members
     - Minimum size reached + owner closes recruitment
   - **Timeout Closure:** Quest expires after set period

4. **Enhanced Quest Closure Logic**
   - **User-Created Quest:** New party automatically created
     - Quest creator becomes party owner
     - All approved applicants become party members
     - Party status: Active, ready for coordination

   - **Party-Created Quest (Public/Hybrid):** New members added to existing party
     - New members get Member role by default
     - Existing party maintains its structure and Owner/Moderator hierarchy
     - Integration welcome messages sent to existing party chat
     - Onboarding process for new members to understand existing team dynamics

   - **Party-Created Quest (Internal):** No party changes
     - Quest marked as completed when assigned members finish task
     - Internal task tracking and progress updates
     - No new members added (pure task assignment)

---

## Application Flow

### Discovering and Applying to Quests
```
Browse Quests → Filter/Search → View Quest Details → Submit Application → Track Status → Receive Decision → Join Party (if approved)
```

**1. Quest Discovery**
- **Quest Board Browsing:**
  - Visual quest cards showing key info (title, skills needed, party size, location)
  - Color coding: Urgent (red), Active (green), Long-term (blue)
  - Filter by category, location, commitment level, required skills
  - Sort by relevance, newest, closing soon, party size

- **Smart Discovery Modes:**
  - **"I'm Available Now":** Immediate matching for quests starting soon
  - **"Browse Opportunities":** Traditional search with advanced filters
  - **"Perfect Match":** AI-recommended quests based on profile
  - **"Serendipity Mode":** Unexpected but compatible opportunities

**2. Quest Analysis**
- Click quest card → Full quest details page
- **View Information:**
  - Complete quest description and objectives
  - Required vs nice-to-have skills
  - Timeline and commitment expectations
  - Quest creator profile and reputation
  - Current applicants count (if not private)
  - Match score explanation ("Why this quest fits you")

**3. Application Submission**
- **Application Form:**
  - Personal message explaining interest and fit
  - Highlight relevant skills and experience
  - Specify which role you're interested in (if multiple)
  - Portfolio/work samples (optional)
  - Availability confirmation

- **Application Enhancement:**
  - System suggests relevant skills to highlight
  - Template messages for common application types
  - Skill gap analysis ("You match 8/10 required skills")

**4. Application Tracking**
- **Application Status Dashboard:**
  - Pending applications with quest details
  - Application status: Submitted, Under Review, Approved, Rejected
  - Response timeline expectations
  - Ability to withdraw application

- **Communication During Review:**
  - Receive follow-up questions from quest owner
  - Provide additional information if requested
  - Get status updates and estimated decision timeline

**5. Decision Handling**
- **If Approved:**
  - Notification with welcome message
  - Quest closure timeline (waiting for other decisions)
  - Preparation instructions for when party forms
  - Access to approved applicants group chat (optional)

- **If Rejected:**
  - Notification with optional feedback
  - Suggestions for skill improvement
  - Similar quest recommendations
  - Option to connect with quest owner for future opportunities

---

## Enhanced Party Quest Flow

### Internal Quest Assignment & Management
Parties can create internal quests for task assignment and coordination among existing members.

**1. Internal Quest Creation Flow**
```
Party Owner/Moderator → Create Internal Quest → Assign Members → Set Deadline → Track Progress → Mark Complete
```

- **Quest Creation:**
  - Party owner/moderator identifies task or objective
  - Creates internal quest with specific member assignments
  - Sets deadlines, requirements, and success criteria
  - Quest only visible to party members

- **Member Assignment:**
  - Select specific party members for the quest
  - Assign roles if quest has multiple components
  - Send notifications to assigned members
  - Provide context and resources needed

- **Progress Tracking:**
  - Assigned members update progress in party chat
  - Regular check-ins and milestone updates
  - Owner/moderator can reassign or adjust as needed
  - Integration with party coordination tools

**2. Quest Publicizing Flow**
```
Internal Quest → Identify External Need → Convert to Public → Specify Open Slots → Review Applications → Add New Members
```

- **Trigger Events:**
  - Current party lacks required skills
  - Task scope expanded beyond party capacity
  - Specific expertise needed not available internally
  - Timeline requires additional workforce

- **Publicizing Process:**
  - Owner/moderator decides to "publicize" quest
  - Specify number of external slots needed (e.g., "publicize 2 slots")
  - Quest becomes visible on public quest board
  - Maintains connection to existing party context
  - Applications reviewed by party leadership

- **Integration:**
  - New members join existing party structure
  - Onboarding process explains existing progress
  - Role assignments consider current party dynamics
  - Seamless integration with ongoing work

**3. Party Expansion Quest Flow**
```
Party Identifies Growth Need → Create Public Quest → Review Applications → Select New Members → Expand Team
```

- **Growth Planning:**
  - Existing party evaluates current capabilities
  - Identifies skill gaps or capacity constraints
  - Plans for team expansion with specific roles
  - Sets expectations for new member integration

- **Quest Creation:**
  - Create public quest from party context
  - Highlight existing team achievements and goals
  - Specify exactly what new members will contribute
  - Set clear expectations for collaboration style

- **Member Integration:**
  - Welcome process explains party history and dynamics
  - Introduction to existing workflows and tools
  - Role assignment based on application and team needs
  - Gradual integration into ongoing projects

---

## Party Flow

### Party Formation and Management
Once a quest closes with approved members, parties are created for coordination and execution.

**1. Party Creation (Post-Quest Closure)**
- **New Party Formation:**
  - System automatically creates party
  - Quest creator becomes party Owner
  - Approved applicants become Members
  - Welcome message and onboarding flow initiated

- **Existing Party Addition:**
  - New members added to existing party
  - Introduction messages to existing team
  - Role assignments by party moderators
  - Integration with ongoing party activities

**2. Enhanced Party Member Roles & Permissions**
- **Owner (Original Quest Creator):**
  - Full party control and quest management
  - Create party quests (internal and public)
  - Add/remove members, assign moderator roles
  - Complete and archive quests
  - Authorize quest publicizing decisions
  - Initiate party dissolution

- **Moderator (Assigned by Owner):**
  - Help manage party members
  - Create party quests (internal and public)
  - Moderate party communications
  - Assist with quest coordination and member assignment
  - Cannot remove owner or other moderators

- **Member (Default for Applicants):**
  - Participate in party activities
  - Communicate in party chat
  - Can be assigned to internal party quests
  - View party resources and coordination tools
  - Leave party voluntarily
  - Cannot create party quests

**3. Party Coordination**
- **Communication Hub:**
  - Party-specific chat channels
  - Thread-based discussions for different topics
  - File sharing and resource libraries
  - @mention notifications for important updates

- **Coordination Tools:**
  - Shared calendar for scheduling
  - Task assignment and progress tracking
  - Polling for decision making
  - Meeting coordination and voice/video calls

- **Progress Management:**
  - Quest milestone tracking
  - Member contribution logging
  - Regular check-ins and updates
  - Deadline and timeline management

**4. Party Lifecycle**
- **Active Phase:**
  - Regular communication and coordination
  - Execute quest objectives
  - Problem-solving and collaboration
  - Social bonding and team building

- **Completion Phase:**
  - Mark quest objectives as complete
  - Final deliverable review
  - Celebration and achievement recognition
  - Prepare for rating and feedback phase

- **Archive Phase:**
  - Quest marked as completed
  - Party status changed to Completed (enables rating)
  - Members can rate each other
  - Party history preserved but no new activity

---

## Search & Discovery Flow

### Quest Discovery Mechanisms
Multiple pathways for users to find relevant quests based on different user intents and contexts.

**1. Quest Board (Primary Discovery)**
- **Main Quest Board Interface:**
  - Grid/list view of active quests
  - MMO-style quest cards with visual indicators
  - Real-time updates as quests are created/closed
  - Infinite scroll with performance optimization

- **Filtering System:**
  - **Quick Filters:** Available Now, This Week, Remote, In-Person
  - **Advanced Filters:**
    - Skills required (match level: exact, partial, learning)
    - Location radius for in-person quests
    - Party size preferences
    - Time commitment (hours/week)
    - Experience level required
    - Quest duration (one-time, ongoing, project-based)

**2. Smart Discovery Modes**

**A. "I'm Available Now" Mode**
```
Select Availability → Set Time Budget → Get Immediate Matches → Apply Quickly
```
- User indicates current availability (next 2-4 hours)
- System filters for quests starting soon or urgent
- Prioritizes high-compatibility matches
- Streamlined application process for quick decisions

**B. "Browse Opportunities" Mode**
- Traditional search and filter interface
- Sort by newest, most relevant, closing soon, party size
- Detailed filtering with multiple criteria
- Save searches and get notifications for new matches

**C. "Perfect Match" Mode**
- AI-powered recommendations based on:
  - User skill profile and proficiency levels
  - Past quest history and preferences
  - Success patterns with similar users
  - Compatibility scoring algorithm
- Explains why each quest is recommended

**D. "Serendipity Mode"**
- Algorithm suggests unexpected but compatible opportunities
- Expands beyond user's typical categories
- Introduces users to new types of collaborations
- Surprise factor configurable by user

**3. Search Functionality**
- **Natural Language Search:**
  - "Looking for weekend coding project with React"
  - "Need creative writing collaboration for short stories"
  - "Want to join hiking group in Colorado"

- **Semantic Search:**
  - Understanding intent beyond exact keywords
  - Skill synonym matching (React → Frontend Development)
  - Context-aware results based on user profile

- **Saved Searches & Alerts:**
  - Save frequently used search criteria
  - Get notifications when matching quests are posted
  - Weekly digest of recommended opportunities

---

## Rating & Reputation Flow

### Post-Quest Feedback System
After quest completion, party members evaluate each other to build platform-wide reputation scores.

**1. Rating Trigger**
- Quest marked as completed by party owner
- Party status changes to Completed
- 7-day rating window opens for all party members
- Notification sent to all members to provide ratings

**2. Rating Process**
```
Quest Complete → Rating Window Opens → Submit Multi-dimensional Ratings → View Feedback → Reputation Updated
```

**Rating Categories (1-5 scale):**
- **Overall Rating:** General satisfaction with collaboration
- **Collaboration:** Teamwork, cooperation, idea sharing
- **Communication:** Responsiveness, clarity, professionalism
- **Reliability:** Met commitments, showed up as promised
- **Skill Level:** Technical/domain expertise demonstrated

**Additional Feedback:**
- Optional written review (public or private)
- "Would collaborate again" yes/no flag
- Highlight specific strengths or areas for improvement
- Tag suggestions for skills demonstrated

**3. Rating Submission Interface**
- Rate each party member individually
- Cannot rate yourself (system prevention)
- Required: Numeric ratings for all categories
- Optional: Written feedback and collaboration flag
- Submit all ratings at once or individually

**4. Reputation Calculation**
- **Weighted Average:** Recent ratings weighted more heavily
- **Volume Bonus:** More ratings = more reliable score
- **Consistency Bonus:** Stable ratings across different contexts
- **Completion Rate Factor:** Quest completion history impact
- **Diversity Bonus:** Success across different types of quests

**5. Reputation Display**
- **Public Profile:**
  - Overall reputation score (1-5 with decimal precision)
  - Number of completed quests and ratings received
  - Top skills based on feedback
  - Recent achievements and badges
  - Collaboration willingness percentage

- **Quest Application Enhancement:**
  - Reputation score shown to quest creators
  - Skill ratings for relevant categories
  - Past collaboration success indicators
  - "Would collaborate again" percentage from past partners

---

## Notification Flow

### Real-time Updates and Communication
Keep users engaged and informed about relevant platform activities.

**1. Notification Types**

**A. Quest-Related Notifications**
- New quest matches your profile (high compatibility)
- Quest you're watching is closing soon
- Quest in your saved searches is posted
- Quest you applied to has updates

**B. Application Notifications**
- Your application was received/viewed
- Quest creator requests more information
- Application approved/rejected with feedback
- Quest closing soon - final chance to apply

**C. Enhanced Party Notifications**
- Party formed after quest closure
- New member joined your party (individual or party quest)
- Party quest created by owner/moderator
- Assigned to internal party quest
- Quest publicized - now visible to external applicants
- Party message or @mention
- Party milestone or quest completed
- Time to rate party members

**D. Social Notifications**
- Someone rated you after quest completion
- New achievement unlocked
- Reputation milestone reached
- Friend joined the platform or completed quest

**2. Notification Delivery**
- **In-App:** Real-time notifications in platform
- **Email:** Digest emails and important updates
- **Push:** Mobile notifications for urgent items
- **SMS:** Critical notifications only (opt-in)

**3. Notification Preferences**
- Granular control over notification types
- Frequency settings (immediate, daily digest, weekly)
- Delivery method preferences per notification type
- Do Not Disturb hours and quiet modes
- Emergency override for time-sensitive quest opportunities

**4. Notification Management**
- **Notification Center:**
  - View all recent notifications
  - Mark as read/unread
  - Archive or delete notifications
  - Quick actions (view quest, respond to message)

- **Smart Grouping:**
  - Group related notifications (multiple applications for same quest)
  - Priority sorting (urgent, normal, low priority)
  - Context-aware batching to reduce notification fatigue

---

## Cross-Flow Interactions

### Integration Between Different User Flows
Understanding how different flows connect and influence each other.

**1. Profile → Quest Discovery**
- Skills in profile determine recommended quests
- Availability settings filter time-compatible opportunities
- Location preferences affect in-person quest suggestions
- Reputation influences quest creator approval decisions

**2. Application → Party Formation**
- Application quality affects party role assignments
- Application timing influences priority in approval process
- Applicant skill diversity affects party composition decisions
- Party quest applications integrate with existing team dynamics

**3. Enhanced Party Experience → Future Interactions**
- Positive party experiences improve application success rates
- Skill demonstrations in parties add credibility to future applications
- Party member recommendations carry weight in future quests
- Successful party members may be invited to join expansion quests
- Party quest creation influenced by past collaboration success

**4. Rating → Platform Reputation**
- Consistent high ratings improve quest discovery ranking
- Poor ratings may require reputation rebuilding activities
- Specialized skill ratings influence quest matching algorithms

**5. Party Management → Quest Creation**
- Successful parties create expansion quests for growth
- Internal coordination needs drive internal quest assignment
- Party skill gaps identified through quest publicizing
- Long-term party success enables complex multi-quest projects

---

## Future Features (Low Priority)

### Quest Merging Flow
**Implementation Priority:** Only after core dual-quest system is complete and application is fully functional.

**A. Similar Quest Detection**
```
User Creates Quest → System Finds Similar Quests → Suggest Merge Options → User Decides → Merge or Continue
```

**B. Party Alliance Formation**
```
Party Quest Created → System Finds Compatible Party Quests → Suggest Alliance → Both Parties Agree → Temporary Alliance Formed
```

**Key Points:**
- Quest merging will reduce duplicate quests and improve matching efficiency
- Party alliances enable temporary collaboration between established teams
- Complex merger logic requires stable foundation to implement safely
- User experience must be seamless to avoid confusion
- Will be implemented only after user adoption validates core system
