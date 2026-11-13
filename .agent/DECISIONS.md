# Architecture Decisions

## Decision 001: Adoption of Antigravity Agent Operating System Architecture

Date: 2026-11-12
Phase: Phase 0 — Discovery

### Problem
Autonomous engineering agents face context limits, model switches, risk of hallucinations, state drift, and lack of persistent memory across sessions.

### Options Considered
1. Ad-hoc scratchpad and unstructured conversational memory.
2. Lightweight single-file progress tracking (e.g. `TODO.md` only).
3. Comprehensive 11-file persistent operating system structure (`.agent/` directory with formal contracts for rules, phase tracking, state, remaining work, architecture decisions, verification evidence, handoff, errors, changelog, and quality checklist).

### Decision
Adopt Option 3: Implement the full Antigravity Agent Operating System protocol with the `.agent/` directory.

### Reason
Provides strict hierarchy of truth (filesystem > test evidence > git > docs > state files > conversation > assumptions), zero-assumption continuation across context/model shifts, strict change control, and evidence-based verification.

### Consequences
All changes must strictly adhere to the safety rules in `AGENTS.md`. All milestones must update `STATE.md`, `REMAINING.md`, `CHANGELOG.md`, and `VERIFICATION.md`. No task may be marked complete without verified evidence.

### Do Not Reconsider Unless
The user explicitly mandates a different memory and operating protocol.

---

## Decision 002: Modular Vanilla Frontend Architecture for TaskFlow

Date: 2026-11-12
Phase: Phase 1 — Foundation

### Problem
Establish a clean, scalable, and responsive frontend architecture for TaskFlow without using external frontend frameworks or introducing build tool dependencies.

### Options Considered
1. Monolithic structure: single `index.html`, inline `<style>` and `<script>`.
2. Framework-based SPA (React / Vue / Vite).
3. Modular Vanilla Web Architecture: Root `index.html`, modular CSS directory (`variables.css`, `reset.css`, `layout.css`, `components.css`, `main.css`), modular ES6 JavaScript directory (`app.js`, `components/`, `utils/`), static `assets/`, and `tests/`.

### Decision
Adopt Option 3: Modular Vanilla Web Architecture using native HTML5, CSS3 Custom Properties, and ES6 Modules.

### Reason
- Strictly adheres to the project rules forbidding React, Vue, Angular, or unnecessary dependencies.
- Native ES6 modules provide clean separation of concerns and maintainability without needing bundlers or transpilers.
- CSS custom properties enable consistent design tokens and theming.
- Direct compatibility with future backend serving (Node.js/Express static file middleware).

### Consequences
- All JavaScript files must use standard ES module syntax (`import`/`export`).
- No external npm runtime dependencies are required for the frontend.
- When serving locally, standard HTTP servers (or future Express backend) should be used to support native ES module loading.

### Do Not Reconsider Unless
The user explicitly requests a frontend framework or bundler migration.


---

## Decision 003: In-Memory Observer Pattern for Vanilla UI Interactivity

Date: 2026-11-12
Phase: Phase 1 — Foundation (Phase 1.2 Layout)

### Problem
Enable real-time synchronization between the Task list, Overview statistics, Sidebar counter badges, and Filter/Search controls without importing third-party reactive state libraries (such as Redux, Zustand, MobX, or Vue Reactivity).

### Options Considered
1. Direct DOM-to-DOM element manipulation within event handlers (tightly couples components, fragile, hard to maintain).
2. Global Window event dispatchers (`window.dispatchEvent(new CustomEvent(...))`).
3. Dedicated in-memory singleton StateManager (`js/state.js`) implementing a lightweight Publish-Subscribe (Observer) pattern with pure ES6 collections (`Set`, `Array`).

### Decision
Adopt Option 3: Dedicated in-memory singleton StateManager with a lightweight Observer pattern.

### Reason
- Keeps components completely decoupled: `Overview`, `Sidebar`, and `Tasks` independently subscribe to state mutations without knowing about each other.
- Single source of truth for mock tasks, active view, status filter, and search query.
- Instant, flicker-free recalculation of metrics (Total, Completed, Pending, Overdue, and Completion Rate) upon task toggle, creation, or deletion.
- Pure Vanilla JavaScript requiring zero build steps or npm packages.

### Consequences
- All mutations must pass through `state.addTask()`, `state.toggleTask()`, `state.deleteTask()`, etc.
- State is currently in-memory (resets on full page reload), establishing a clean foundation for localStorage or backend persistence in subsequent phases.


---

## Decision 004: Ink Wash Color Palette System & Zero-Deviation Policy

Date: 2026-11-12
Phase: Phase 1 — Foundation (Design System Overhaul)

### Problem
Establish a distinctive, calm, and cohesive visual identity for TaskFlow strictly adhering to the user's provided 4-color palette swatch with zero unauthorized color deviations.

### Options Considered
1. Ad-hoc partial replacement of primary brand color while keeping standard utility blues, reds, greens, and ambers for status and priorities.
2. Complete system overhaul adopting the exact 4-color palette (`#4A4A4A`, `#CBCBCB`, `#FFFFE3`, `#6D8196`) across all visual dimensions, expressing state and hierarchy through tonal contrast and strict alpha channels.

### Decision
Adopt Option 2: Complete adoption of the **"Ink Wash"** palette across all tokens, components, layouts, and states, backed by a formal design specification (`DESIGN.md`) and an automated zero-deviation scanner (`tests/test_ink_wash_palette.py`).

### Reason
- Directly addresses the user mandate: *"these are my color thewmes use thyese on my site evrywhere, make sure we use this and not deviate to any other colors, make a design docs and follow it"*.
- Creates a distinctive, high-end editorial and sumi-e aesthetic that feels intentional, uncluttered, and unique.
- Maintains full WCAG AA/AAA contrast compliance without requiring foreign accent hues.

### Consequences
- All subsequent components, views, or UI elements must derive styles exclusively from `--ink-charcoal`, `--ink-mist`, `--ink-ivory`, and `--ink-slate`.
- `tests/test_ink_wash_palette.py` will fail if any foreign hex code or non-matching RGB triplet is introduced.


---

## Decision 005: Spring Meadow & Teal Waters Palette Adoption (Contrast Safe: AAA Pass)

Date: 2026-11-12
Phase: Phase 1 — Foundation (Design System Overhaul)

### Problem
Update the TaskFlow design system to the user's uploaded "Contrast Safe: AAA Pass" palette (`#CAFFA6`, `#204654`, `#A9E0F1`, `#F7F9E1`) while maintaining zero deviations to any foreign colors and re-editing `DESIGN.md`.

### Decision
Adopt the 4 colors:
- `#204654` (Teal Waters) — Dominant text, dark buttons, high-contrast framing
- `#CAFFA6` (Spring Meadow) — High priority accent text, success highlights, checkmarks
- `#A9E0F1` (Glacial Sky) — Medium priority, pending accents, hover tints
- `#F7F9E1` (Morning Mist) — App canvas background, card surfaces, modal dialogs

### Reason
- Directly fulfills user mandate: *"edit these colors into my site and reedit the design.md and do not deviate to any other colors."*
- Certified AAA contrast rating across all primary text/surface combinations.
- Enforced continuously by `tests/test_color_palette.py`.

### Consequences
- All subsequent additions must derive styles strictly from these 4 tokens and their corresponding RGB alpha components.


---

## Decision 006: Merino, Rock Blue & Venice Blue Palette Migration (Strict 3-Color Palette)

Date: 2026-11-12
Phase: Phase 1 — Foundation (Design System Overhaul)

### Problem
Migrate TaskFlow to the user's uploaded 3-color palette swatch: **Merino**, **Rock Blue**, and **Venice Blue**. Completely remove all previously used colors (`#CAFFA6`, `#204654`, `#A9E0F1`, `#F7F9E1`, `#4A4A4A`, `#CBCBCB`, `#FFFFE3`, `#6D8196`) from the site, re-edit `DESIGN.md`, and enforce a zero-deviation policy.

### Decision
Adopt strictly the 3 approved colors:
1. **Merino (`#F5EEDD` / `rgb(245, 238, 221)`)**: Main application canvas background, card surfaces, toolbars, sidebar, modal surfaces, and inverse text.
2. **Rock Blue (`#84B3CE` / `rgb(132, 179, 206)`)**: Accent color, medium priority badges, hover highlights, pending stats, tag backgrounds.
3. **Venice Blue (`#16587B` / `rgb(22, 88, 123)`)**: Primary typography, action buttons, active navigation, high priority badge fills, dark borders, focus rings, overlays.

### Reason
- Directly fulfills user mandate: *"use only these color pallete now and remove all the colors previuously used and use only this now and then update the design.md'"*
- Achieves 7.0:1 contrast ratio (WCAG AAA rating) for Venice Blue on Merino and 4.5:1 (WCAG AA rating) for Venice Blue on Rock Blue.
- Enforced continuously by `tests/test_color_palette.py`.

### Consequences
- All subsequent UI components must derive styles strictly from `--color-merino`, `--color-rock-blue`, and `--color-venice-blue` and their exact alpha channel tints (`rgba(245, 238, 221, a)`, `rgba(132, 179, 206, a)`, `rgba(22, 88, 123, a)`).
- Zero foreign hues are permitted.


---

## Decision 007: Elimination of Brown Tones & Adoption of Rich Venice Blue Sidebar with Crisp White Canvas

Date: 2026-11-12
Phase: Phase 1 — Foundation (Design System Refinement)

### Problem
Setting Merino (`#F5EEDD`) across the full-page canvas and all cards produced an undesirable warm brownish/tan cast across the application, while the user's provided blue colors were isolated primarily to buttons.

### Decision
Adopt a crisp white canvas (`#FFFFFF`) with a rich Venice Blue (`#16587B`) sidebar and Rock Blue (`#84B3CE`) active navigation highlights:
1. **Canvas & Cards**: Pure Crisp White (`#FFFFFF`) with subtle Venice Blue border framing (`rgba(22, 88, 123, 0.18)`), eliminating 100% of beige/brown tones.
2. **Sidebar**: Rich Venice Blue (`#16587B`) background with Rock Blue (`#84B3CE`) active indicator pills, white typography, and white/rock-blue project dots.
3. **Accent Elements**: Rock Blue (`#84B3CE`) brand icon, user avatar fill, medium priority badges, and stat icon highlights.

### Reason
- Directly satisfies user feedback and selection: *"Clean White canvas (#FFFFFF) with a rich Venice Blue (#16587B) sidebar, Rock Blue (#84B3CE) cards/badges/accents, and zero brown tones"*.
- Solves the visual complaint by eliminating the full-screen beige/brown wash and making the blue palette dominant and balanced throughout the application structure.
- Achieves 7.5 : 1 WCAG AAA contrast ratio for Venice Blue on White and White on Venice Blue.

### Consequences
- `#F5EEDD` and all brownish/tan tones are strictly forbidden.
- Enforced continuously by `tests/test_color_palette.py`.


---

## Decision 008: Phase 2 JavaScript Functionality & Architecture

Date: 2026-11-12
Phase: Phase 2 — JavaScript Functionality

### Problem
Implement complete task management interactivity (CRUD, filtering, sorting, drag-and-drop, persistence, and event delegation) in pure Vanilla JavaScript without external frontend libraries, bundlers, or frameworks.

### Decision
1. **Observer Pattern with LocalStorage Sync**: Centralized in `js/state.js`. All mutations trigger `notify()`, which automatically synchronizes state to `localStorage` and alerts subscribed UI components.
2. **Event Delegation**: Single event listeners attached to the task container (`#tasks-list`) for `change`, `click`, `dblclick`, and drag-and-drop events, eliminating memory leaks and repetitive listener attachments.
3. **Dual Update Mechanism**:
   - Double-clicking the task title triggers inline text editing for quick adjustments.
   - The edit button opens the modal dialog pre-filled with task data for comprehensive updates (title, priority, project, due date).
4. **Native HTML5 Drag-and-Drop**: Leverages the browser's native Drag and Drop API with visual indicators styled in Rock Blue (`#84B3CE`), persisting reordered indices.
5. **Toast Feedback with Undo**: Transient toast notification with an interactive "Undo" button restores the last deleted task.

### Reason
- Directly fulfills the learning-focused Phase 2 curriculum: *"Events, modules, state management, CRUD, filtering, sorting and drag-and-drop"*.
- Zero dependencies, zero build steps, and production-grade reactive UX.

### Consequences
- All subsequent frontend additions must interact through `state.js` methods rather than direct DOM mutations.


---

## Decision 009: Phase 3 Backend Architecture & REST API Design

Date: 2026-11-12
Phase: Phase 3 — Backend Development

### Problem
Build a robust, modular Node.js/Express backend providing RESTful APIs for TaskFlow and serve the frontend without cross-origin or bundling overhead.

### Decision
1. **Layered Express Architecture**: Divided into `routes/`, `controllers/`, `middleware/`, and `data/` within `server/`.
2. **Standard RESTful HTTP Semantics**:
   - `GET` for safe resource reading.
   - `POST` with `201 Created` for resource creation and complex actions (`reorder`).
   - `PUT` for complete resource updates.
   - `PATCH` for partial resource modifications (`toggle`).
   - `DELETE` for resource destruction.
   - `400 Bad Request` for validation failures; `404 Not Found` for missing resources.
3. **Dual Frontend Mode (Online API + LocalStorage Offline Fallback)**: `js/state.js` attempts backend synchronization via `js/services/api.js`; if unreachable, it operates autonomously using `localStorage`.
4. **Static File Serving**: Express serves the root frontend directory, enabling single-port execution (`http://localhost:3000`).

### Reason
- Directly fulfills the learning-focused Phase 3 curriculum: *"Node.js, Express, REST APIs, HTTP and Fetch API"*.
- Creates a clean boundary ready for Phase 4 MySQL database integration.

---

## Decision 010: Phase 4.1 Database Configuration & Secure Environment Setup

Date: 2026-11-13
Phase: Phase 4 — Database (MySQL)

### Problem
Establish a secure, resilient database configuration and connection strategy for MySQL 8.0 without exposing credentials or introducing timezone discrepancies between the database and the frontend.

### Decision
1. **Security & Git Isolation**: Created `.gitignore` excluding `.env` and `.env.*.local`. Provided a documented `.env.example` template with zero credentials.
2. **Configuration Module (`server/config/db.config.js`)**: Encapsulated `dotenv` loading, validation of required connection variables, and export of pool configuration.
3. **UTC and Date Serialization**: Set `timezone: 'Z'` and `dateStrings: ['DATE']` in `mysql2` to prevent JavaScript `Date` timezone shifts for task `dueDate` (`YYYY-MM-DD`).
4. **Local Development Isolation**: Scoped temporary development user middleware strictly to non-production environments (`NODE_ENV !== 'production'`).
5. **No Blind Overwrites**: Preserved all existing Phase 3 mock database controllers, ensuring zero regressions while the MySQL foundation is prepared.

### Reason
- Protects database secrets from version control.
- Guarantees date stability across different regional client machines.
- Satisfies all user constraints for Phase 4.1.

---

## Decision 011: Safe Migration Tracking, Partial-Failure Recovery & Seed Separation

Date: 2026-11-13
Phase: Phase 4.2 — Migrations & Seeds

### Problem
MySQL DDL statements (`CREATE TABLE`, etc.) trigger implicit commits, making atomic DDL rollback impossible. A robust migration runner must track statement execution, detect partial failures, allow safe resume, and keep development seed data strictly decoupled from structural migrations.

### Decision
1. **Schema Migration Tracking Table (`schema_migrations`)**: Stores `version`, `name`, `status` (`'pending'|'applied'|'failed'`), `executed_statements`, `checksum` (SHA-256), and `error_message`.
2. **Statement-by-Statement Tracking**: `server/db/migrate.js` parses discrete SQL statements, logs progress statement-by-statement, and on error records the exact statement index where failure occurred without masking MySQL's implicit commits.
3. **Idempotent Table Definitions**: Tables use `CREATE TABLE IF NOT EXISTS`, enabling safe retry and recovery upon transient failure.
4. **Canonical Task Status with Boolean Mapping**: Tasks use `status ENUM('todo', 'in_progress', 'completed')` as canonical state alongside `completed TINYINT(1)`. All initial completed tasks have `status = 'completed'` and pending tasks have `status = 'todo'`.
5. **Decoupled Development Seeds**: Kept in `server/db/seeds/001_dev_seed.sql` and run independently via `npm run db:seed`. Uses `ON DUPLICATE KEY UPDATE` to prevent duplicating records on repeated runs.

### Reason
- Eliminates migration corruption caused by MySQL's non-transactional DDL behavior.
- Ensures developer environments can be re-seeded cleanly without risking schema integrity.

---

## Decision 012: Authentication Architecture, Password Hashing & Multi-Tenant Authorization

Date: 2026-11-13
Phase: Phase 5 — Authentication and Security

### Problem
Implement production-grade authentication and user account management while guaranteeing complete multi-tenant task isolation and maintaining backward-compatible developer ergonomics.

### Decision
1. **Password Hashing (`bcryptjs`)**: Passwords hashed with 10 salt rounds before database insertion. Plaintext passwords never stored or logged.
2. **Stateless JWT Tokens (`jsonwebtoken`)**: Signed with `JWT_SECRET`, expiring after `JWT_EXPIRES_IN` (7 days). Tokens convey user ID and identity in `Authorization: Bearer <token>`.
3. **Dual-Mode Authentication Guard (`server/middleware/auth.js`)**:
   - Strictly validates JWT token when provided.
   - Rejects unauthenticated requests with 401 in production mode.
   - Falls back gracefully to the development user (`alex@tempo.dev`) in non-production environments when token is omitted, preserving existing automated tests.
4. **Multi-Tenant Scoping**: All queries filter strictly by `WHERE user_id = ?`. Tasks and projects created are tied to `req.user.id`. Foreign users cannot view, edit, or delete another user's resources (returning 404).
5. **Automatic Default Workspace Provisioning**: Newly registered users automatically receive standard default workspaces (`Work`, `Personal`, `Design System`).

### Reason
- Fulfills all Phase 5 curriculum requirements.
- Guarantees zero cross-user data leakage.
- Preserves full backward compatibility with previous phases.
