# MagFlow Development Workflow Plan

**Created:** 2026-01-09
**Orchestrator:** BMad Orchestrator
**Project:** MagFlow v2.0 - Multi-User SaaS Freemium Transformation
**Duration:** 4 weeks (4 sprints)

---

## Workflow Overview

**Goal:** Transform MagFlow from single-user prototype to production-ready multi-tenant SaaS with freemium model, Stripe integration, and admin panel.

**Approach:** Iterative sprint-based development with PM, Architect, and Dev coordination.

**Total Stories:** 14 (grouped in 4 sprints)

---

## Workflow Stages

### Stage 1: Foundation Setup ✅ COMPLETED
**Agents:** PM (John) → Architect (Winston)
**Duration:** Completed

**Artifacts Created:**
- ✅ PRD Brownfield Complete ([docs/prd.md](../docs/prd.md))
- ✅ Architecture Documentation ([docs/architecture.md](../docs/architecture.md))
- ✅ Database Documentation ([docs/database.md](../docs/database.md))
- ✅ SQL Schema ([backend/supabase-schema-v2.sql](../backend/supabase-schema-v2.sql))
- ✅ Migration Script ([backend/migrations/001_add_multiuser.sql](../backend/migrations/001_add_multiuser.sql))

**Status:** ✅ Complete

---

### Stage 2: Sprint 1 Planning 🔄 IN PROGRESS
**Agent:** PM (John)
**Duration:** In progress

**Tasks:**
- ✅ Create Story 1.1: Database Schema
- ✅ Create Story 1.2: Backend Auth Middleware
- ✅ Create Story 1.3: Usage Tracking & Limits
- ⏳ Create Story 1.4: Stripe Integration Backend (pending)
- ⏳ Create Story 1.5: Admin Panel Backend (pending)
- ⏳ Create Story 1.6: Frontend Auth Pages (pending)

**Expected Artifacts:**
- Story files in `docs/stories/story-1.X-*.md`

**Next Action:**
- Option A: Create remaining Sprint 1-4 stories now (Stories 1.4-1.14)
- Option B: Move to development (Dev implements 1.1-1.3), create stories just-in-time

**Status:** 🔄 Waiting for decision

---

### Stage 3: Sprint 1 Development ⏳ READY
**Agent:** Dev (James)
**Duration:** ~1 week
**Dependencies:** Stories 1.1-1.3 exist ✅

**Stories to Implement:**
1. Story 1.1: Database Schema Multi-User (1 day)
2. Story 1.2: Backend Auth Middleware (1 day)
3. Story 1.3: Usage Tracking & Limits (1.5 days)

**Development Flow per Story:**
```
1. James reads story file
2. Implements tasks sequentially
3. Writes tests
4. Executes validations
5. Updates story file (Dev Agent Record section)
6. Marks story as "Ready for Review"
```

**Expected Artifacts:**
- Database schema executed in Supabase
- Backend middleware code (auth.js, usage.js)
- Backend services (usageService.js)
- Backend routes (auth.js, user.js)
- Unit tests
- Updated story files with completion status

**Exit Criteria:**
- All 3 stories marked "Ready for Review"
- All tests passing
- Database migration successful
- Auth middleware functional

**Status:** ⏳ Ready to start

---

### Stage 4: Sprint 1 Review & Sprint 2 Planning ⏳ PENDING
**Agent:** PM (John)
**Dependencies:** Sprint 1 development complete

**Tasks:**
1. Review completed stories from Sprint 1
2. Create Sprint 2 stories (1.4-1.6) if not already done
   - Story 1.4: Stripe Integration Backend
   - Story 1.5: Admin Panel Backend
   - Story 1.6: Frontend Auth Pages

**Expected Artifacts:**
- Sprint 1 review notes
- Sprint 2 story files

**Status:** ⏳ Pending Sprint 1 completion

---

### Stage 5: Sprint 2 Development ⏳ PENDING
**Agent:** Dev (James)
**Duration:** ~1 week
**Dependencies:** Sprint 1 complete, Stories 1.4-1.6 exist

**Stories:**
1. Story 1.4: Stripe Integration Backend (2 days)
2. Story 1.5: Admin Panel Backend (1.5 days)
3. Story 1.6: Frontend Auth Pages (2 days)

**Status:** ⏳ Pending Sprint 1

---

### Stage 6: Sprint 2 Review & Sprint 3 Planning ⏳ PENDING
**Agent:** PM (John)

**Tasks:**
1. Review Sprint 2
2. Create Sprint 3 stories (1.7-1.12)

**Status:** ⏳ Pending Sprint 2

---

### Stage 7: Sprint 3 Development ⏳ PENDING
**Agent:** Dev (James)
**Duration:** ~1 week

**Stories:**
1. Story 1.7: Frontend Usage Tracking UI (1.5 days)
2. Story 1.8: Frontend Stripe Integration (1.5 days)
3. Story 1.9: Admin Panel Frontend (2 days)
4. Story 1.10: Template Isolation (0.5 day)
5. Story 1.11: Generation History (1 day)
6. Story 1.12: Account Settings Page (1 day)

**Status:** ⏳ Pending Sprint 2

---

### Stage 8: Sprint 3 Review & Sprint 4 Planning ⏳ PENDING
**Agent:** PM (John)

**Tasks:**
1. Review Sprint 3
2. Create Sprint 4 stories (1.13-1.14)

**Status:** ⏳ Pending Sprint 3

---

### Stage 9: Sprint 4 Development (Testing & Deployment) ⏳ PENDING
**Agent:** Dev (James)
**Duration:** ~1 week

**Stories:**
1. Story 1.13: E2E Testing & Bug Fixes (2 days)
2. Story 1.14: Documentation & Deployment (1.5 days)

**Status:** ⏳ Pending Sprint 3

---

### Stage 10: Production Deployment & Handoff ⏳ PENDING
**Agents:** Dev (James) + Architect (Winston) + PM (John)

**Tasks:**
1. **Architect:** Review architecture, create deployment checklist
2. **Dev:** Execute deployment to production (Render, Netlify, Supabase)
3. **PM:** Create user documentation, onboarding guides
4. **All:** Final validation, smoke tests

**Expected Artifacts:**
- Production deployment complete
- Monitoring active
- User documentation
- Project handoff document

**Status:** ⏳ Pending Sprint 4

---

## Decision Points

### Decision 1: Story Creation Strategy 🔴 ACTIVE DECISION
**Current Stage:** Stage 2 (Sprint 1 Planning)
**Question:** Create all 14 stories now, or just-in-time per sprint?

**Option A: Create All Stories Now**
- ✅ Complete documentation upfront
- ✅ Clear roadmap for entire project
- ❌ Takes time before coding starts (~1-2 hours)
- ❌ May need revisions based on learnings

**Option B: Just-In-Time Story Creation**
- ✅ Start coding immediately (Stories 1.1-1.3 ready)
- ✅ Stories adapt based on learnings from previous sprints
- ❌ Less visibility into full scope
- ❌ PM needs to context-switch between sprints

**Recommendation:** Option B (JIT)
- Sprint 1 stories exist and are detailed
- Can create Sprint 2 stories during Sprint 1 dev
- Allows learning from implementation to inform later stories

**User Decision Required:** Choose A or B

---

### Decision 2: Development Start Point
**Depends On:** Decision 1
**Question:** Which story should James start with?

**Recommended:** Story 1.1 (Database Schema)
- Foundation for everything else
- Files already created by Winston (just needs execution)
- Low risk, high value

---

## Workflow Execution Plan

### Immediate Next Steps (Recommended: Option B)

**Step 1: Finalize Current Stage**
- User chooses Option A or B for Decision 1
- If Option A: John creates Stories 1.4-1.14 now
- If Option B: Move to development immediately

**Step 2: Transition to Development**
- Switch to Dev agent (James)
- James reads Story 1.1
- James implements Story 1.1 (execute SQL, verify)

**Step 3: Parallel Work (If Option B)**
- While James codes Story 1.1-1.3
- PM (John) creates Sprint 2 stories (1.4-1.6)

**Step 4: Sprint 1 Completion**
- James marks all stories "Ready for Review"
- Transition to Sprint 2

**Repeat for Sprints 2-4**

---

## Agent Coordination Rules

### PM → Dev Handoff
When PM creates a story:
1. Story file created in `docs/stories/`
2. Status set to "Draft"
3. PM notifies Dev (or Dev polls for new stories)
4. Dev reads story, changes status to "In Progress"

### Dev → PM Handoff
When Dev completes a story:
1. Dev marks story "Ready for Review"
2. Dev updates File List and Change Log
3. PM reviews, provides feedback or approves

### Architect → Dev Handoff
When Architect creates technical docs:
1. Architect creates SQL, architecture docs
2. Architect notifies Dev of new resources
3. Dev references docs during implementation

---

## Progress Tracking

### Artifacts Tracker

| Artifact | Owner | Status | Location |
|----------|-------|--------|----------|
| PRD | PM | ✅ Complete | `docs/prd.md` |
| Architecture Doc | Architect | ✅ Complete | `docs/architecture.md` |
| Database Doc | Architect | ✅ Complete | `docs/database.md` |
| SQL Schema | Architect | ✅ Complete | `backend/supabase-schema-v2.sql` |
| Migration Script | Architect | ✅ Complete | `backend/migrations/001_add_multiuser.sql` |
| Story 1.1 | PM | ✅ Complete | `docs/stories/story-1.1-database-schema.md` |
| Story 1.2 | PM | ✅ Complete | `docs/stories/story-1.2-backend-auth-middleware.md` |
| Story 1.3 | PM | ✅ Complete | `docs/stories/story-1.3-usage-tracking-limits.md` |
| Stories 1.4-1.14 | PM | ⏳ Pending | Decision 1 required |
| Story 1.1 Implementation | Dev | ⏳ Ready | Waiting for Dev to start |

### Sprint Progress

| Sprint | Stories | Status | Duration | Completion |
|--------|---------|--------|----------|------------|
| Sprint 1 | 1.1-1.3 | 📋 Stories Ready | 1 week | 0% |
| Sprint 2 | 1.4-1.6 | ⏳ Planning | 1 week | 0% |
| Sprint 3 | 1.7-1.12 | ⏳ Planning | 1 week | 0% |
| Sprint 4 | 1.13-1.14 | ⏳ Planning | 1 week | 0% |

---

## Workflow State

**Current Stage:** Stage 2 (Sprint 1 Planning)
**Active Agent:** PM (John)
**Waiting On:** User decision (Decision 1: Option A or B)
**Next Stage:** Stage 3 (Sprint 1 Development)
**Next Agent:** Dev (James)

**Blockers:** None

**Notes:**
- All foundation work complete (PRD, Architecture, DB schema)
- Sprint 1 stories created and detailed
- Ready to transition to development
- User needs to decide story creation strategy

---

## Commands to Execute Workflow

### To Continue This Workflow:

**Option A (Create all stories first):**
```
*agent pm
Tell John: "Create all remaining stories 1.4 through 1.14"
```

**Option B (Start development now):**
```
*agent dev
Tell James: "Implement story-1.1-database-schema"
```

### To Check Workflow Status Anytime:
```
*plan-status
```

### To Update Workflow Progress:
```
*plan-update
```

---

**Workflow Plan Created:** 2026-01-09
**Plan Owner:** BMad Orchestrator
**Last Updated:** 2026-01-09
