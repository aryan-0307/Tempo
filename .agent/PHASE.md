# Project Phases — Learning-Focused Roadmap

## Phase 0 — Planning and Architecture
**Focus**: Requirements, features, folder structure, UI planning and development workflow.
**Status**: COMPLETED

---

## Phase 1 — Frontend Foundations
**Focus**: HTML semantics, CSS architecture, responsive layout and DOM manipulation.
**Status**: COMPLETED

---

## Phase 2 — JavaScript Functionality
**Focus**: Events, modules, state management, CRUD, filtering, sorting and drag-and-drop.
**Status**: COMPLETED

---

## Phase 3 — Backend Development
**Focus**: Node.js, Express, REST APIs, HTTP and Fetch API.
**Status**: COMPLETED (Review Gate)

### Completed Work:
- [x] **Node.js & Express Architecture**:
  - Initialized `package.json` with ES module support, `express`, and `cors`.
  - Layered directory structure: `server/routes/`, `server/controllers/`, `server/middleware/`, `server/data/`, `server/app.js`, `server/server.js`.
- [x] **RESTful API Endpoints**:
  - `GET /api/tasks` with query parameters (`status`, `view`, `search`, `sort`).
  - `GET /api/tasks/:id` with 200/404 handling.
  - `POST /api/tasks` with input validation (returns 201 Created).
  - `PUT /api/tasks/:id` for task field updates.
  - `PATCH /api/tasks/:id/toggle` for quick completion status toggle.
  - `DELETE /api/tasks/:id` for task removal.
  - `POST /api/tasks/reorder` for custom reordering.
  - `GET /api/projects` for project categories and task counts.
  - `GET /api/stats` for real-time aggregate metrics.
  - `GET /api/health` for server status checks.
- [x] **HTTP Semantics & Middleware**:
  - `server/middleware/logger.js`: Request logger measuring response time.
  - `server/middleware/validator.js`: Request validation returning 400 Bad Request on invalid payloads.
  - `server/middleware/errorHandler.js`: 404 and 500 standardized JSON error responses.
  - Express static file middleware serving the frontend from the root on port 3000.
- [x] **Frontend Fetch API Client**:
  - `js/services/api.js`: Standard Fetch API wrapper handling all HTTP verbs.
  - `js/state.js`: Synchronizes with backend REST API when online, with graceful fallback to `localStorage`.
- [x] **Automated API Testing**:
  - `tests/test_backend_api.py`: Automated integration test verifying all 12 endpoints, HTTP status codes, validation, and graceful server lifecycle.

### Exit Criteria:
- Node.js and Express REST API functional and tested: **VERIFIED** (`tests/test_backend_api.py` PASS)
- All 5 automated test suites pass: **VERIFIED**

---

## Phase 4 — Database
**Focus**: MySQL, database design, relationships and SQL queries.
**Status**: READY TO START (Pending User Review of Phase 3)

### Planned Work:
- [ ] Design relational database schema (`users`, `tasks`, `projects`, `tags`).
- [ ] Establish primary keys, foreign keys, indexes, and cascading constraints.
- [ ] Set up MySQL connection pool with `mysql2/promise`.
- [ ] Migrate `mockDatabase.js` data access methods to parameterized SQL queries.
- [ ] Add database health check and automated schema migration script.

---

## Phase 5 — Authentication and Security
**Focus**: Registration, login, password hashing, sessions/tokens and authorization.
**Status**: NOT_STARTED

---

## Phase 6 — Testing and Deployment
**Focus**: API testing, validation, debugging, production configuration and deployment.
**Status**: NOT_STARTED
