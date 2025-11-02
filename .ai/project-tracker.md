# GSD Project Tracker

**Last Updated:** 2025-01-11
**Current Sprint:** Foundation & Authentication

## 📊 MVP Progress Overview

```
Overall MVP Completion: ████░░░░░░░░░░░░░░░░ 20% (15/75 features)

Backend:  ████░░░░░░░░░░░░░░░░ 20% (9/45 features)
Frontend: ░░░░░░░░░░░░░░░░░░░░  0% (0/25 features)
Infra:    ████████░░░░░░░░░░░░ 40% (6/15 features)
```

**Target MVP Completion:** TBD
**Current Blockers:** Authentication module (blocks all user-scoped work)

---

## 🎯 Current Sprint Goals

### Sprint: Foundation & Authentication
**Status:** 🔵 In Progress
**Duration:** TBD
**Goal:** Complete authentication module and remaining core infrastructure

**Deliverables:**
- [ ] Google OAuth 2.0 integration
- [ ] JWT session management
- [ ] Auth guards implementation
- [ ] Replace mock userId across all controllers
- [ ] User onboarding flow (create default lists)

---

## 📋 Feature Tracking

### Legend
- ✅ **Completed** - Feature fully implemented and tested
- 🟡 **In Progress** - Currently being worked on
- 🔵 **Ready** - Dependencies met, ready to start
- ❌ **Blocked** - Blocked by dependencies
- ⚪ **Not Started** - Not yet started, may have unmet dependencies

---

## 🏗️ Phase 1: Foundation (Infrastructure)

**Goal:** Core infrastructure for development
**Progress:** ████████████░░░░░░░░ 60% (9/15)

| Status | Feature | Est. | Notes | Owner |
|--------|---------|------|-------|-------|
| ✅ | Monorepo setup (pnpm workspaces) | - | Completed | - |
| ✅ | NestJS backend bootstrap | - | Basic structure | - |
| ✅ | Astro frontend bootstrap | - | Basic structure | - |
| ✅ | TypeScript configuration | - | Strict mode enabled | - |
| ✅ | ESLint + Prettier | - | Configured | - |
| ✅ | Prisma schema + migrations | - | User, List, Task models | - |
| ✅ | Docker Compose (PostgreSQL) | - | Local dev DB | - |
| ✅ | Repository pattern architecture | - | Lists, Tasks repos | - |
| ✅ | Logging infrastructure | - | AppLogger + HTTP interceptor | - |
| ⚪ | Health endpoints | 0.5d | GET /health, /health/ready | - |
| ⚪ | Error handling middleware | 0.5d | Consistent error format | - |
| ⚪ | Rate limiting | 0.5d | @nestjs/throttler | - |
| ⚪ | Swagger/OpenAPI docs | 1d | Auto-generated API docs | - |
| ⚪ | CI/CD pipeline (GitHub Actions) | 1d | Lint, test, build | - |
| ⚪ | Docker production images | 1d | Multi-stage builds | - |

**Phase Blockers:** None
**Next Up:** Health endpoints, error handling

---

## 🔐 Phase 2: Authentication & Authorization

**Goal:** User authentication and data isolation
**Progress:** ░░░░░░░░░░░░░░░░░░░░ 0% (0/6)
**Status:** 🔵 Ready to Start (CRITICAL - BLOCKS EVERYTHING)

| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ⚪ | Google OAuth setup | 0.5d | Google Cloud Console config | 3.7 | - |
| ⚪ | AuthModule + OAuth flow | 2d | @nestjs/passport + passport-google-oauth20 | 3.7 | - |
| ⚪ | JWT session management | 1d | HttpOnly cookie, refresh tokens | 3.7 | - |
| ⚪ | Auth guards | 1d | JwtAuthGuard on all routes | 3.7 | - |
| ⚪ | User model & creation | 0.5d | On first OAuth login | 3.7 | - |
| ⚪ | Replace mock userId | 0.5d | Use req.user.id everywhere | - | - |

**Endpoints:**
- `POST /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `POST /auth/signout` - End session
- `GET /auth/me` - Current user info

**Phase Blockers:** None (ready to start)
**Dependencies:** Google OAuth credentials
**Next Up:** Google OAuth setup

---

## 📝 Phase 3: Lists Management (Core CRUD)

**Goal:** Complete list management functionality
**Progress:** ███████░░░░░░░░░░░░░ 33% (3/9)

| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ✅ | GET /v1/lists | - | Fetch user lists | US-001 | ✅ |
| ✅ | POST /v1/lists | - | Create list with color | US-001 | ✅ |
| ✅ | DELETE /v1/lists/:id | - | With task destination | US-003 | ✅ |
| ❌ | PATCH /v1/lists/:id | 0.5d | Rename list | US-002 | - |
| ❌ | POST /v1/lists/:id/reorder | 1d | Change position (orderIndex) | US-004 | - |
| ❌ | POST /v1/lists/:id/toggle-backlog | 1d | Mark/unmark backlog | US-001A | - |
| ⚪ | Backlog constraint validation | - | Part of delete/toggle logic | US-003A | - |
| ⚪ | List limit enforcement (10) | - | Enforced in create | 3.1 | - |
| ⚪ | Color assignment system | - | Auto-assign backlog colors | 3.1 | - |

**Business Rules Implemented:**
- ✅ At least one backlog must exist
- ✅ Max 10 non-Done lists per user
- ✅ Delete with task destination
- ❌ Backlog auto-promotion on delete

**Phase Blockers:** Authentication (for real user IDs)
**Next Up:** UpdateList (rename)

---

## ✅ Phase 4: Tasks Management (Core CRUD)

**Goal:** Complete task CRUD and basic operations
**Progress:** ████████░░░░░░░░░░░░ 40% (4/10)

| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ✅ | GET /v1/tasks | - | With list filter, pagination | US-005 | ✅ |
| ✅ | POST /v1/tasks | - | Create in list (top position) | US-005 | ✅ |
| ✅ | PATCH /v1/tasks/:id | - | Update title/description | US-006 | ✅ |
| ✅ | DELETE /v1/tasks/:id | - | Hard delete | US-007 | ✅ |
| ❌ | POST /v1/tasks/:id/move | 1d | Move between lists | US-008 | - |
| ❌ | POST /v1/tasks/:id/reorder | 1d | Reorder within list | US-009 | - |
| ❌ | POST /v1/tasks/:id/complete | 1d | Move to Done, set completedAt | US-010, US-011 | - |
| ❌ | POST /v1/tasks/bulk-add | 1d | Dump mode (max 10) | US-014 | - |
| ⚪ | Task limit enforcement (100/list) | - | In create/move validation | 3.2 | - |
| ⚪ | Order index management | - | Insert at top strategy | 3.2 | - |

**Business Rules Implemented:**
- ✅ Max 100 tasks per list
- ✅ Cannot create in Done list
- ✅ Insert at top (orderIndex calculation)
- ❌ Origin backlog color tracking
- ❌ Completed task constraints

**Phase Blockers:** Authentication
**Next Up:** MoveTask, CompleteTask, ReorderTask

---

## 📦 Phase 5: Done Archive & Retention

**Goal:** Completed tasks view and retention management
**Progress:** ░░░░░░░░░░░░░░░░░░░░ 0% (0/4)

| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ⚪ | DoneModule setup | 0.5d | New module | 3.5 | - |
| ⚪ | GET /v1/done | 1d | Paginated (50/page, reverse chrono) | US-015 | - |
| ⚪ | Retention job | 1d | Keep last 500, delete older | 3.5 | - |
| ⚪ | @nestjs/schedule integration | 0.5d | For retention cleanup | - | - |

**Endpoints:**
- `GET /v1/done?page=1&limit=50`

**Business Rules:**
- Pagination: 50 items/page default
- Retention: Keep last 500 completed tasks per user
- Order: Reverse chronological (completedAt DESC)

**Phase Blockers:** CompleteTask use case
**Dependencies:** @nestjs/schedule package
**Next Up:** DoneModule setup

---

## 📊 Phase 6: Metrics & Analytics

**Goal:** Task completion metrics for user motivation
**Progress:** ░░░░░░░░░░░░░░░░░░░░ 0% (0/3)

| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ⚪ | MetricsModule setup | 0.5d | New module | 3.8 | - |
| ⚪ | GET /v1/metrics/daily | 1.5d | Daily completion counts | US-016 | - |
| ⚪ | GET /v1/metrics/weekly | 1.5d | Weekly counts (Monday start) | US-016 | - |

**Endpoints:**
- `GET /v1/metrics/daily?startDate=...&endDate=...&timezone=...`
- `GET /v1/metrics/weekly?weeksCount=4&timezone=...`

**Business Rules:**
- Timestamps stored in UTC
- Rendered in user's local timezone (browser handles)
- Week starts Monday
- Aggregate from completedAt field

**Phase Blockers:** Done archive (need completedAt data)
**Next Up:** MetricsModule

---

## 🎨 Phase 7: Frontend (MVP UI)

**Goal:** Responsive web UI for plan/work modes
**Progress:** ░░░░░░░░░░░░░░░░░░░░ 0% (0/25)

### 7.1 Authentication UI
| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ⚪ | Sign-in page | 1d | Google OAuth button | 3.7 | - |
| ⚪ | Sign-out functionality | 0.5d | Clear session | 3.7 | - |
| ⚪ | Protected route guards | 0.5d | Redirect to login | 3.7 | - |

### 7.2 Plan Mode UI
| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ⚪ | List board view | 3d | Horizontal lists layout | 3.3 | - |
| ⚪ | Backlog zone (leftmost) | 1d | Visual grouping | 3.1 | - |
| ⚪ | Create/rename/delete list | 2d | With confirmation dialogs | 3.1 | - |
| ⚪ | Toggle backlog status | 1d | Mark/unmark | 3.1 | - |
| ⚪ | Reorder lists | 1d | Keyboard: arrow keys | 3.3 | - |
| ⚪ | Task list view | 2d | Within each list | 3.2 | - |
| ⚪ | Create/edit/delete task | 2d | Inline editing | 3.2 | - |
| ⚪ | Move task between lists | 1d | Keyboard shortcuts | 3.2 | - |
| ⚪ | Reorder tasks | 1d | Arrow keys | 3.2 | - |
| ⚪ | Complete task (plan mode) | 0.5d | Any list | 3.2 | - |
| ⚪ | Keyboard navigation | 2d | Arrow keys + h/j/k/l | 3.3 | - |
| ⚪ | Keyboard help overlay (?) | 1d | Shortcut reference | 3.3 | - |

### 7.3 Work Mode UI
| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ⚪ | Work mode view | 2d | Focused single task | 3.4 | - |
| ⚪ | Current task display | 1d | From rightmost list | 3.4 | - |
| ⚪ | Task forecast (next 2-3) | 1d | Preview upcoming | 3.4 | - |
| ⚪ | Complete button | 0.5d | Move to Done | 3.4 | - |
| ⚪ | Mode toggle (plan ↔ work) | 0.5d | Navigation | - | - |

### 7.4 Done & Metrics UI
| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ⚪ | Done archive page | 2d | Paginated list | 3.5 | - |
| ⚪ | Metrics dashboard | 2d | Daily/weekly charts | 3.8 | - |

### 7.5 Dump Mode UI
| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ⚪ | Dump mode textarea | 1d | Multi-line input (max 10) | 3.3 | - |
| ⚪ | Backlog selection | 0.5d | Target list dropdown | - | - |

### 7.6 Mobile Responsive
| Status | Feature | Est. | Notes | PRD Ref | Owner |
|--------|---------|------|-------|---------|-------|
| ⚪ | Mobile: one list at a time | 2d | Horizontal swipe | 3.10 | - |
| ⚪ | Mobile: work mode fullscreen | 1d | Complete + nav | 3.10 | - |

**Phase Blockers:** Backend API completion
**Next Up:** Authentication UI (after backend auth)

---

## 🚀 Phase 8: Deployment & Production

**Goal:** Production-ready deployment
**Progress:** ░░░░░░░░░░░░░░░░░░░░ 0% (0/8)

| Status | Feature | Est. | Notes | Owner |
|--------|---------|------|-------|-------|
| ⚪ | Environment configuration | 1d | .env files, secrets management | - |
| ⚪ | Database migrations | 0.5d | Production migration strategy | - |
| ⚪ | Docker production build | 1d | Optimized images | - |
| ⚪ | CI/CD deployment | 2d | Auto-deploy on merge to main | - |
| ⚪ | SSL/TLS certificates | 0.5d | Let's Encrypt or similar | - |
| ⚪ | Monitoring & logging | 1d | Error tracking, metrics | - |
| ⚪ | Backup strategy | 1d | Database backups | - |
| ⚪ | Domain & hosting | 0.5d | DNS, hosting setup | - |

**Phase Blockers:** MVP features completion
**Next Up:** Environment configuration

---

## 🧪 Phase 9: Testing & Quality

**Goal:** Comprehensive test coverage
**Progress:** ███░░░░░░░░░░░░░░░░░ 15% (3/20)

### Backend Tests
| Status | Type | Coverage Target | Notes |
|--------|------|-----------------|-------|
| ✅ | Unit: Lists use cases | 80%+ | CreateList, GetLists, DeleteList |
| ✅ | Unit: Tasks use cases | 80%+ | CreateTask, GetTasks, UpdateTask, DeleteTask |
| ✅ | Unit: Color management | 80%+ | ColorPool, Color |
| ⚪ | Unit: Auth module | 80%+ | OAuth, JWT |
| ⚪ | E2E: Lists flow | - | Full CRUD + constraints |
| ⚪ | E2E: Tasks flow | - | Create → Move → Complete |
| ⚪ | E2E: Authentication | - | OAuth flow end-to-end |

### Frontend Tests
| Status | Type | Coverage Target | Notes |
|--------|------|-----------------|-------|
| ⚪ | Unit: Components | 70%+ | React components |
| ⚪ | Integration: API client | 80%+ | Fetch wrapper |
| ⚪ | E2E: User flows | - | Playwright/Cypress |

### Performance Tests
| Status | Test | Target | Notes |
|--------|------|--------|-------|
| ⚪ | List with 100 tasks | <100ms (p95) | Load test |
| ⚪ | 10 lists rendering | <200ms | UI performance |
| ⚪ | Bulk add 10 tasks | <500ms | Concurrent writes |

**Next Up:** Auth module tests

---

## 📅 Sprint Planning

### Week 1-2: Authentication Foundation
- [ ] Google OAuth setup
- [ ] AuthModule implementation
- [ ] JWT session management
- [ ] Auth guards
- [ ] Replace mock userId

### Week 3-4: Complete Task Operations
- [ ] MoveTask use case + endpoint
- [ ] CompleteTask use case + endpoint
- [ ] ReorderTask use case + endpoint
- [ ] BulkAddTasks use case + endpoint
- [ ] Update/Rename list
- [ ] Toggle backlog status

### Week 5-6: Done Archive & Lists Completion
- [ ] DoneModule + pagination
- [ ] Retention job (@nestjs/schedule)
- [ ] ReorderList use case
- [ ] Metrics module (daily/weekly)

### Week 7-12: Frontend MVP
- [ ] Authentication UI
- [ ] Plan mode board
- [ ] Work mode view
- [ ] Done archive page
- [ ] Metrics dashboard
- [ ] Mobile responsive

### Week 13-14: Testing & Polish
- [ ] E2E tests
- [ ] Performance testing
- [ ] Bug fixes
- [ ] UI/UX polish

### Week 15-16: Deployment
- [ ] Production environment
- [ ] CI/CD pipeline
- [ ] Monitoring setup
- [ ] MVP launch

---

## 🔮 Post-MVP Features (Future Phases)

### Priority 1: User Experience Enhancements
| Feature | Est. | PRD Ref | Status |
|---------|------|---------|--------|
| Undo/Redo functionality | 3d | - | ⚪ Not started |
| Keyboard shortcuts customization | 2d | - | ⚪ Not started |
| Dark mode | 2d | - | ⚪ Not started |
| Task search/filter | 3d | - | ⚪ Not started |
| Bulk task operations | 2d | - | ⚪ Not started |

### Priority 2: Advanced Features
| Feature | Est. | PRD Ref | Status |
|---------|------|---------|--------|
| Task dependencies | 5d | - | ⚪ Not started |
| Recurring tasks | 5d | - | ⚪ Not started |
| Task estimates/time tracking | 4d | - | ⚪ Not started |
| Task templates | 3d | - | ⚪ Not started |
| Tags/labels | 4d | - | ⚪ Not started |

### Priority 3: Collaboration
| Feature | Est. | PRD Ref | Status |
|---------|------|---------|--------|
| Multi-user support | 10d | - | ⚪ Not started |
| Shared lists | 8d | - | ⚪ Not started |
| Task comments | 5d | - | ⚪ Not started |
| Activity feed | 4d | - | ⚪ Not started |

### Priority 4: Integrations
| Feature | Est. | PRD Ref | Status |
|---------|------|---------|--------|
| Calendar sync | 5d | - | ⚪ Not started |
| Email notifications | 3d | - | ⚪ Not started |
| Mobile app (iOS/Android) | 30d | - | ⚪ Not started |
| API for third-party integrations | 5d | - | ⚪ Not started |

---

## 🐛 Known Issues & Technical Debt

### High Priority
- [ ] **Auth blocker:** Replace all mock userId with real authenticated user
- [ ] **Origin backlog tracking:** Tasks need originBacklogId for color derivation (currently hardcoded)
- [ ] **Done list initialization:** Ensure Done list created on user onboarding

### Medium Priority
- [ ] **Order index strategy:** Current simple incrementing may need fractional indexing
- [ ] **Error handling:** Need consistent error format across all endpoints
- [ ] **Validation:** Some DTO validations incomplete (e.g., color hex format)

### Low Priority
- [ ] **Logging:** Some use cases missing detailed logging
- [ ] **Tests:** Need more edge case coverage
- [ ] **Documentation:** Swagger decorators needed on all endpoints

---

## 📊 Success Metrics (KPIs)

### MVP Launch Criteria
- [ ] All authentication flows working
- [ ] Core list/task CRUD functional
- [ ] Complete task flow (create → move → complete)
- [ ] Done archive with pagination
- [ ] Basic metrics (daily/weekly counts)
- [ ] Responsive UI (desktop + mobile)
- [ ] Test coverage >70%
- [ ] Zero critical bugs

### Post-Launch Success Metrics
- **Primary KPI:** Tasks completed per user per week (target: 10+)
- **Secondary:**
  - Daily active users (DAU)
  - Week 2 retention (user completes ≥1 task in week 2)
  - Time in work mode per session
  - List creation rate
- **Performance:**
  - P95 list load time <100ms
  - Error rate <1%

---

## 📝 Notes & Decisions

### Architecture Decisions
- **2025-01-11:** Using singleton pattern for Color value object
- **2025-01-11:** Implemented AppLogger with environment-aware configuration
- **2025-01-11:** Repository pattern with use case architecture (clean architecture)

### Open Questions
1. **Default backlog selection:** For bulk-add, use first backlog by orderIndex? → **Decision needed**
2. **Done list creation:** Create on user registration or first login? → **Decision needed**
3. **Active work list:** Should backend identify "rightmost non-Done" or frontend? → **Frontend responsibility**
4. **Onboarding flow:** Who creates initial lists (Backlog + Today + Done)? → **Decision needed**

### Meeting Notes
- TBD

---

## 🔗 Quick Links

- [PRD](.ai/prd.md)
- [Backend Gap Analysis](.ai/backend-gap-analysis.md)
- [Task Implementation Plan](.ai/tasks-implementation-plan.md)
- [Endpoints Plan](.ai/endpoints-plan.md)
- [Tech Stack](.ai/tech-stack.md)

---

## 📈 Change Log

### 2025-01-11
- ✅ Created project tracker document
- ✅ Backend gap analysis completed
- ✅ Identified authentication as critical blocker
- ✅ Logging infrastructure completed (AppLogger + HTTP interceptor)
- ✅ Color management refactored (singleton pattern)

### 2025-01-XX (Template for future)
- [ ] Feature X completed
- [ ] Started work on Feature Y
- [ ] Blocked by: ...

---

## 💡 Usage Instructions

### Updating Status
1. Change status icons: ✅ ❌ 🟡 🔵 ⚪
2. Update progress bars manually using █ and ░ characters
3. Update percentages: `(completed/total features)`
4. Add notes in the "Notes" column for context

### Adding New Features
1. Add row to appropriate phase table
2. Set initial status to ⚪
3. Add PRD reference if applicable
4. Estimate in days (d)

### Sprint Planning
1. Update "Current Sprint Goals" section
2. Move items to "Week X" in Sprint Planning
3. Check off items as completed
4. Update "Last Updated" date at top

### Weekly Review
1. Review all 🟡 (in progress) items
2. Update progress bars
3. Identify blockers
4. Plan next week's work
5. Log changes in Change Log

---

**Document maintained by:** Team
**Review frequency:** Weekly
**Template version:** 1.0
