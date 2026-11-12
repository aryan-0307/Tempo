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
