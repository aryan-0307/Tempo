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
