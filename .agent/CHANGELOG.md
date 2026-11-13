# Changelog

## [2026-11-12]

### Added
- Phase 1 Foundation for TaskFlow:
  - Created `index.html` with semantic HTML5 markup for the application shell.
  - Created modular CSS design system in `css/` (`variables.css`, `reset.css`, `layout.css`, `components.css`, `main.css`).
  - Created modular ES6 JavaScript architecture in `js/` (`app.js`, `components/sidebar.js`, `components/header.js`, `utils/dom.js`).
  - Created static assets directory structure with `assets/README.md`.
  - Created automated test script `tests/test_frontend_shell.py`.
  - Created root `DEVELOPMENT_LOG.md`.
  - Added Decision 002 to `.agent/DECISIONS.md`.
- Initialized Git repository and persistent `.agent/` operating system memory architecture.

### Changed
- Updated `.agent/PHASE.md`, `.agent/STATE.md`, `.agent/REMAINING.md`, `.agent/VERIFICATION.md`, and `.agent/HANDOFF.md` to reflect Phase 1 progress.

### Fixed
- None

### Removed
- None

### Verification
- Executed `python tests/test_frontend_shell.py` — all 11 files verified, all import graphs resolved with 100% success.


---

## [2026-11-12] — v0.2.0: Main Application Layout & Reactive State Engine

### Added
- **Main Application Layout**:
  - Pinned sidebar with TaskFlow branding, Dashboard, My Tasks, Upcoming, Completed, Projects (Work, Personal, Design System), Settings, and bottom User Profile section.
  - Main content header featuring real-time search bar with `Ctrl+K` shortcut, notifications bell with unread badge and dropdown panel, and "+ Create Task" button.
  - Welcome section with dynamic greeting according to time of day and localized date display.
  - Dashboard Overview section displaying Total tasks, Completed tasks, Pending tasks, and Overdue tasks.
  - Task section featuring "Today's Tasks" header, task count badge, status filter tabs (All, Pending, Completed), and task items.
  - Accessible Create Task modal dialog with form validation for task title, priority, project, and due date.
- **Components & State Modules**:
  - `js/state.js`: Singleton reactive in-memory state manager with mock tasks and Observer pattern.
  - `js/components/overview.js`: Stat card metrics renderer and real-time synchronizer.
  - `js/components/tasks.js`: Task list renderer, completion toggler, and deletion handler.
  - `js/components/modal.js`: Create Task modal controller.
- **Automated Test**:
  - `tests/test_main_layout.py`: Comprehensive test verifying all sections, DOM elements, responsive rules, and zero inline CSS/JS.

### Changed
- `index.html`: Restructured to full layout matching all specifications.
- `css/variables.css`: Added priority tokens, project colors, and focus ring definitions.
- `css/layout.css`: Added grid layouts, sticky sidebar, topbar, and mobile drawer transitions.
- `css/components.css`: Added stat cards, task items, custom accessible checkboxes, notifications dropdown, and modal styles.
- `js/app.js`: Updated to orchestrate all UI components with state.
- `js/components/sidebar.js`: Added state subscriptions for dynamic badge count updates.
- `js/components/header.js`: Added debounced real-time search, notification popover, and localized date/greeting formatting.
- `js/utils/dom.js`: Added `escapeHtml` and `formatDisplayDate`.
- `tests/test_frontend_shell.py`: Updated to include new JS modules.


---

## [2026-11-12] — v0.2.1: Ink Wash Design System & Zero Color Deviation Enforcement

### Added
- `DESIGN.md`: Comprehensive design specification detailing the 4-color **"Ink Wash"** palette (`#4A4A4A`, `#CBCBCB`, `#FFFFE3`, `#6D8196`), zero deviation policy, design tokens, component-level mappings, and WCAG contrast matrix.
- `tests/test_ink_wash_palette.py`: Automated color compliance scanner that parses all project CSS, HTML, and JS files to verify zero foreign color codes exist.
- Decision 004 in `.agent/DECISIONS.md`.

### Changed
- `css/variables.css`: Replaced all legacy colors with Ink Wash palette variables (`--ink-charcoal`, `--ink-mist`, `--ink-ivory`, `--ink-slate`) and remapped all surface, border, typography, priority, project, and shadow tokens.
- `css/layout.css`: Remapped mobile backdrop and borders to palette-derived values.
- `css/components.css`: Remapped stat card icon wrappers, task item hover/completion states, checkbox borders/checkmarks, notification alerts, and modal dialog backdrops strictly to the 4 approved colors and their alpha components.


---

## [2026-11-12] — v0.2.2: Spring Meadow & Teal Waters Palette (AAA Pass)

### Added
- Updated `DESIGN.md`: Detailed specification of the 4 **"Contrast Safe: AAA Pass"** colors (`#CAFFA6`, `#204654`, `#A9E0F1`, `#F7F9E1`), semantic roles, and certified AAA contrast rating table.
- `tests/test_color_palette.py`: Automated zero-deviation color validator.
- Decision 005 in `.agent/DECISIONS.md`.

### Changed
- `css/variables.css`: Remapped tokens to `--color-spring-meadow`, `--color-teal-waters`, `--color-glacial-sky`, and `--color-morning-mist`.
- `css/layout.css`: Updated backdrop and border overlays to Teal Waters alpha components.
- `css/components.css`: Updated stat card icon containers, task item hovers, custom checkbox checkmark (`#CAFFA6`), and modal styles to new palette.
- `tests/test_ink_wash_palette.py`: Updated to enforce the new AAA Pass palette.


---

## [2026-11-12] — v0.2.3: Merino, Rock Blue & Venice Blue Palette Migration (Strict 3-Color Palette)

### Added
- Re-edited `DESIGN.md`: Formally documents the 3-color palette (**Merino** `#F5EEDD`, **Rock Blue** `#84B3CE`, **Venice Blue** `#16587B`), CMYK/RGB values, zero-deviation policy, design tokens, component-level mappings, and WCAG AAA compliance table.
- Decision 006 in `.agent/DECISIONS.md`.

### Changed
- `css/variables.css`: Replaced legacy tokens with `--color-merino: #F5EEDD;`, `--color-rock-blue: #84B3CE;`, `--color-venice-blue: #16587B;` and remapped all surface, text, border, button, badge, priority, project, and shadow tokens.
- `css/layout.css`: Updated mobile sidebar backdrop overlay to `rgba(22, 88, 123, 0.45)`.
- `css/components.css`: Updated all component states (search input focus, badges, stat card icons, task hovers, checkmark, completed task background, notification item background, modal backdrop, form inputs) to use strictly Venice Blue and Rock Blue opacities.
- `tests/test_color_palette.py`: Updated assertion set and scanner to strictly validate against the 3 approved hex colors and their exact RGB triplets.
- Cleaned up obsolete `tests/test_ink_wash_palette.py`.

### Removed
- Completely eliminated all legacy palette colors (`#CAFFA6`, `#204654`, `#A9E0F1`, `#F7F9E1`, `#4A4A4A`, `#CBCBCB`, `#FFFFE3`, `#6D8196`) across all files.

### Verification
- Executed `python tests/test_color_palette.py`: PASS (0 violations across all 14 project files).
- Executed `python tests/test_frontend_shell.py`: PASS (100% integrity).
- Executed `python tests/test_main_layout.py`: PASS (100% requirements verified).


---

## [2026-11-12] — v0.2.4: Venice Blue Sidebar, Rock Blue Accents & Crisp White Layout (Zero Brown)

### Added
- Re-edited `DESIGN.md`: Formally documents the Venice Blue, Rock Blue & Crisp White design system, complete elimination of brown tones, dedicated sidebar tokens, and 7.5 : 1 AAA contrast compliance.
- Decision 007 in `.agent/DECISIONS.md`.

### Changed
- `css/variables.css`:
  - Replaced brown/beige surfaces with pure Crisp White (`#FFFFFF`).
  - Added dedicated sidebar tokens (`--color-sidebar-bg`, `--color-sidebar-text`, `--color-sidebar-active`, `--color-sidebar-border`).
  - Added missing `--spacing-9` token.
- `css/layout.css`:
  - Restyled `.app-sidebar` as a rich solid Venice Blue (`#16587B`) panel.
  - Implemented Rock Blue (`#84B3CE`) active navigation indicator pills and brand mark.
  - Updated sidebar user profile footer with translucent background and styled avatar.
- `tests/test_color_palette.py`:
  - Updated approved color list to `{#FFFFFF, #84B3CE, #16587B}`.
  - Added strict assertion verifying `#F5EEDD` is absent from design documentation and styles.

### Removed
- Completely removed `#F5EEDD` and all warm brown, tan, and beige tones from all CSS variables, layouts, and components.

### Verification
- Executed `python tests/test_color_palette.py`: PASS (0 violations across all 14 project files).
- Executed `python tests/test_frontend_shell.py`: PASS (100% integrity).
- Executed `python tests/test_main_layout.py`: PASS (100% requirements verified).


---

## [2026-11-12] — v0.3.0: Phase 2 JavaScript Functionality Complete

### Added
- `js/components/toast.js`: Reusable accessible toast notification manager supporting action buttons (Undo).
- `tests/test_phase2_functionality.py`: Automated verification suite covering Phase 2 JavaScript requirements.
- Full CRUD operations:
  - Create: Modal dialog creation with input validation.
  - Read: Dynamic task rendering with priority, overdue indicator, project tag.
  - Update: Double-click inline title editing, modal edit mode with field pre-filling, and checkbox toggle.
  - Delete: Task removal with real-time metric updates and Toast notification with Undo restoration.
- Drag-and-Drop: Native HTML5 drag-and-drop task reordering with visual insertion indicators.
- Sorting: Minimalist select dropdown supporting sorting by Due Date, Priority, Title (A-Z), and Default.
- Global keyboard shortcuts: `Ctrl+K` (search focus), `N` (new task modal), `Escape` (dismiss).
- Decision 008 in `.agent/DECISIONS.md`.

### Changed
- `js/state.js`: Added `localStorage` persistence, `updateTask`, `restoreLastDeletedTask`, `reorderTasks`, and multi-attribute sorting.
- `js/components/tasks.js`: Integrated drag-and-drop, inline title editing, modal edit triggers, and sort handling.
- `js/components/modal.js`: Enhanced to support both Create and Edit modes.
- `js/app.js`: Added global keyboard shortcut bindings.
- `index.html`: Added `#tasks-sort-select` dropdown.
- `css/components.css`: Added styles for drag handles, drag-over indicators, inline inputs, edit buttons, and toasts.

### Verification
- Executed `python tests/test_phase2_functionality.py`: PASS (100%).
- Executed `python tests/test_color_palette.py`: PASS (100%).
- Executed `python tests/test_frontend_shell.py`: PASS (100%).
- Executed `python tests/test_main_layout.py`: PASS (100%).


---

## [2026-11-12] — v0.4.0: Phase 3 Backend Development Complete

### Added
- `package.json`: Configured with ES module support, `express`, `cors`, and npm scripts.
- Layered Express backend under `server/`:
  - `server/data/mockDatabase.js`: In-memory data store with task/project querying, insertion, updating, and reordering.
  - `server/middleware/logger.js`: Request logger measuring method, path, status, and duration.
  - `server/middleware/validator.js`: Validation for task creation, updating, and reordering.
  - `server/middleware/errorHandler.js`: Structured 404 and 500 error handlers.
  - `server/controllers/tasksController.js`: Full task REST handlers (CRUD, query filtering, reorder).
  - `server/controllers/projectsController.js`: Project listing with dynamic task counts.
  - `server/controllers/statsController.js`: Aggregate overview statistics.
  - `server/routes/tasksRoutes.js`, `projectsRoutes.js`, `statsRoutes.js`: Express router modules.
  - `server/app.js`: Express application assembly, CORS, body parser, and static file serving.
  - `server/server.js`: Server listener entry point (port 3000).
- `js/services/api.js`: Frontend Fetch API client wrapping all REST endpoints.
- `tests/test_backend_api.py`: Automated integration test verifying all 12 endpoints.
- Decision 009 in `.agent/DECISIONS.md`.

### Changed
- `js/state.js`: Integrated with `api.js` for asynchronous backend synchronization with graceful fallback to `localStorage`.
- `js/app.js`: Added backend health sync call during initialization.
- `tests/test_frontend_shell.py`: Added `js/services/api.js` to module resolution checks.
- `tests/test_color_palette.py`: Updated to skip `node_modules`.

### Verification
- Executed `python tests/test_backend_api.py`: PASS (100%).
- Executed `python tests/test_color_palette.py`: PASS (100%).
- Executed `python tests/test_frontend_shell.py`: PASS (100%).
- Executed `python tests/test_main_layout.py`: PASS (100%).
- Executed `python tests/test_phase2_functionality.py`: PASS (100%).

---

## [2026-11-13] — v0.5.0: Phase 4 MySQL Database Integration Complete

### Added
- Rebranded site and backend from TaskFlow to Tempo.
- Database Configuration & Environment Setup:
  - Installed `mysql2` and `dotenv`.
  - Added `.env.example` template with UTC date configuration (`DB_TIMEZONE=Z`).
  - Added `.gitignore` excluding secrets (`.env*`).
  - Added `server/config/db.config.js` with validation and UTC date formatting.
  - Added `tests/verify_mysql_connection.js` and `npm run db:verify`.
- Schema Migrations & Tracking:
  - Added `server/db/migrations/001_initial_schema.sql` (creating `schema_migrations`, `users`, `categories`, `projects`, `tasks`).
  - Added statement-level migration runner `server/db/migrate.js` with implicit DDL commit failure detection and checksum validation.
  - Added `npm run db:migrate`.
- Development Seed System:
  - Added `server/db/seeds/001_dev_seed.sql` with idempotent seed data (1 user, 3 categories, 3 projects, 6 tasks).
  - Added `server/db/seed.js` and `npm run db:seed`.
- Database Service & Repositories:
  - Added `server/db/pool.js` connection pool with health check.
  - Added `server/middleware/authDev.js` for development user context isolation (disabled in production).
  - Added `server/db/repositories/tasksRepository.js` with full parameterized SQL queries, canonical status mapping, and transactional reordering.
  - Added `server/db/repositories/projectsRepository.js` and `server/db/repositories/statsRepository.js`.
- Root `README.md` documentation.
- Automated Test Suites:
  - `tests/test_phase4_1_setup.py`
  - `tests/test_phase4_2_migrations.py`
  - `tests/test_database_integration.py`

### Changed
- `server/controllers/tasksController.js`, `projectsController.js`, `statsController.js`: Converted to async/await querying MySQL repositories, preserving 100% of existing REST API contracts and JSON formats.
- `server/app.js`: Added development user context middleware and database health reporting on `GET /api/health`.
- `server/server.js`: Updated banner logging for MySQL mode.
- `DEVELOPMENT_LOG.md`, `.agent/STATE.md`, `.agent/HANDOFF.md`, `.agent/DECISIONS.md`.

### Verification
- `python tests/test_database_integration.py`: PASS (100%).
- `python tests/test_backend_api.py`: PASS (100%).
- `python tests/test_phase4_2_migrations.py`: PASS (100%).
- `python tests/test_phase4_1_setup.py`: PASS (100%).
- `python tests/test_color_palette.py`: PASS (100%).
- `python tests/test_frontend_shell.py`: PASS (100%).
- `python tests/test_main_layout.py`: PASS (100%).
- `python tests/test_phase2_functionality.py`: PASS (100%).
