# Core Agent Rules & Operating Principles

This document contains rules that must ALWAYS be followed by any agent working in this repository.

---

## 1. Safety Rules

- Never delete existing functionality without explicit justification.
- Never overwrite working code blindly.
- Never fabricate information.
- Never claim something works without verification.
- Never invent APIs, libraries, environment variables, database fields, or configuration.
- Never silently ignore errors.
- Never modify unrelated files.
- Never expose secrets.
- Never commit credentials, API keys, tokens, or private keys.

---

## 2. Before Editing

Always:
1. Inspect the relevant files.
2. Understand the existing implementation.
3. Check git status/diff.
4. Identify dependencies.
5. Determine the smallest safe change.

---

## 3. After Editing

Always:
1. Inspect the changed code.
2. Run appropriate tests.
3. Run lint/type checking when available.
4. Run build when appropriate.
5. Fix discovered errors.
6. Update `.agent/` documentation.

---

## 4. Anti-Hallucination Protocol

Hierarchy of Truth:
- **LEVEL 1** — Actual filesystem/source code
- **LEVEL 2** — Test/build/runtime evidence
- **LEVEL 3** — Git history/diff
- **LEVEL 4** — Project documentation
- **LEVEL 5** — Agent state files
- **LEVEL 6** — Conversation/context
- **LEVEL 7** — Agent assumptions

Higher levels override lower levels.
- If documentation says something exists but the filesystem does not contain it: **Trust the filesystem**.
- If `STATE.md` says tests passed but the test output is unavailable: **Treat the test as UNVERIFIED**.
- If uncertain: State `UNKNOWN — needs verification`. Never convert uncertainty into a fact.

---

## 5. Change Control & Minimal Change Principle

Before modifying code, answer internally:
1. What requirement does this change satisfy?
2. Which files need modification?
3. Could this break existing functionality?
4. How will I verify it?

After modification:
1. Did I satisfy the requirement?
2. Did I introduce a regression?
3. Did tests pass?
4. Did I modify anything unrelated?

Prefer:
`small change → test → verify → checkpoint`
over:
`large change → large refactor → hope it works`

Do not refactor unrelated code unless strictly necessary.

---

## 6. Requirement Traceability

For every significant requirement, maintain a strict mapping:
`Requirement → Implementation → File(s) → Test → Verification result`

---

## 7. No False Completion

Never declare implemented, fixed, working, tested, complete, or production-ready unless there is concrete evidence.
Always use **IMPLEMENTED + VERIFIED** instead of merely **IMPLEMENTED**.

---

## 8. User Changes Are Sacred

If the repository contains changes not made by you:
- DO NOT delete, revert, overwrite, or "clean up" without understanding them.
- Use `git status` and `git diff` to distinguish existing user work from your work.
- Always preserve unrelated changes.

---

## 9. When Blocked

If blocked:
1. Describe the blocker clearly.
2. Investigate available evidence.
3. Try reasonable non-destructive solutions.
4. Record attempts in `ERRORS.md`.
5. Update `STATE.md`.
6. If user input is genuinely required, ask a precise question.
7. Do not fabricate an answer just to continue.

---

## 10. Master Principle

You are maintaining a continuously recoverable engineering process.
A model may disappear. A context window may end. A model may be replaced. The project must still be able to continue safely.

- PERSIST EVERYTHING IMPORTANT.
- VERIFY EVERYTHING CLAIMED.
- NEVER INVENT UNKNOWN INFORMATION.
- NEVER LOSE PROGRESS.
- NEVER RESTART WITHOUT REASON.
- ALWAYS LEAVE A CLEAR NEXT ACTION.
