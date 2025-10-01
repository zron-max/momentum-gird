# GEMINI — Coding & Change Rules

**Purpose**
This document defines a lightweight, practical set of rules for making code changes in the project. The goals are clarity, safety, and fast iteration: every change should _fit the current project flow_, be linted and tested, and be proposed before implementation.

---

## Core rules

1. **Fit-first** — Write code that _works best for our current project flow_. Prioritize consistency with existing architecture, patterns, tooling, and CI. Be pragmatic: small, incremental improvements that reduce friction are preferred over large rewrites.

2. **Propose before changing** — Before making changes, always present a **numbered, step-by-step plan** (see _Plan template_ below). The plan should include what you will change, why, which files or modules are affected, and how you will test and roll back if needed. Do not implement until the plan is accepted.

3. **Follow ESLint & style rules** — Adhere to the project's ESLint configuration and code-style rules. If the project has no ESLint yet, use a sensible default (recommended: `eslint:recommended` + `plugin:@typescript-eslint/recommended`).

4. **Indentation & formatting** — Use **2-space indentation** across all code and configuration files. Ensure your editor respects this by including or updating `.editorconfig` (example below).

5. **Testing & verification** — After implementing changes, run the project's test suite and any relevant linters. Report the results back to the reviewer with clear pass/fail output and list of failing tests (if any). If tests fail, include next steps to fix or revert.

6. **Minimal, clear commits & PRs** — Each change should be a focused commit. PRs must include:
   - The accepted step-by-step plan (copied verbatim)
   - A short summary of what changed and why
   - Commands used to lint/test
   - Test results (pass/fail and any important logs)

7. **Propose breaking/architectural changes** — If something _really needs to change_ (architecture, data model, public API), document the rationale, migration plan, backward-compatibility impact, and get explicit approval before proceeding.

8. **Rollback & emergency process** — For any change that touches production or migrations, include a rollback plan and pre-change backups if applicable.

---

## Plan template (required before any change)

Use this exact numbered format when proposing changes.

1. **Goal:** One-line description of what we will achieve.
2. **Why:** Short justification and alternatives considered.
3. **Files/modules affected:** List of files, folders, modules, and any infra or config changes.
4. **Steps (numbered):** Implementation steps in order. Keep them small and testable.
   1. Example: `Update X, run tests, open PR`.

5. **Testing plan:** Commands to run locally and CI checks to expect (e.g. `npm test`, `npm run lint`).
6. **Rollback plan:** How to revert if something goes wrong.
7. **Estimated impact:** Surface-level notes about performance, storage, compatibility, and user-visible changes.

---

## Test result reporting (after changes)

When you finish implementing, paste the exact command outputs or a short summary. Use this format:

```
Command: npm test --silent
Result: PASSED
Tests: 42 total, 42 passed, 0 failed
Coverage: 87%
Notes: All API integration tests passed locally. One UI snapshot updated.
```

If tests fail, include failing test names, the failing stack trace, and the first-action plan to fix or revert.

---

## Editor & lint snippets (suggested)

Add or ensure these files exist so tooling enforces the rules.

**.editorconfig**

```ini
root = true
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

**.eslintrc.js** (example starter; adapt to project rules)

```js
module.exports = {
  root: true,
  env: { node: true, es2021: true, browser: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  rules: {
    indent: ['error', 2],
    'no-console': 'warn',
  },
}
```

---

## PR checklist (short)

- [ ] Plan (numbered) included in PR description
- [ ] ESLint: no errors (auto-fix where safe)
- [ ] Tests: all passing locally
- [ ] CI: green or expected failures documented
- [ ] Documentation & migration notes included if applicable

---

## Exceptions & approval

If you believe a rule must be relaxed for a specific case, include a brief justification in the plan and request explicit approval. Approval may be given inline on the plan or in the PR comments.

---

_Keep this file small and actionable. Update when project needs evolve._
