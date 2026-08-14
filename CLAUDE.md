# CLAUDE.md — Needle Mobile System

This is the project root. Backend code and its own rules live in `Backend/CLAUDE.md`. Full specs live in `Docs/`. Domain vocabulary — and the tiebreaker when specs disagree — lives in `CONTEXT.md`; read it before naming anything.

**Current focus: `WebApps/`.** The backend is complete through ticket 17 and stable as the API foundation, so new feature work lands in the Next.js management app unless told otherwise.

## Agent skills

### Issue tracker

Issues and specs are tracked as local markdown files under `.scratch/`. See `Docs/agents/issue-tracker.md`.

### Domain docs

Single-context project. The domain reference is `CONTEXT.md` plus the numbered `Docs/` set; new ADRs go in `Docs/adr/` (the six existing ADRs remain as prose in `Backend/CLAUDE.md` §2 for now). See `Docs/agents/domain.md`.

### WebApps development

Any task that adds, changes, or fixes a screen/feature/component in the WebApps frontend (`WebApps/`, Next.js admin/management app) — delegate to the `webapps-dev` subagent (`.claude/agents/webapps-dev.md`). It owns the full requirements-to-verification lifecycle and the stack locked in `Docs/design.md` — hand it the whole task.
