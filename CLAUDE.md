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

### nexa_mobile development

Any task that adds, changes, or fixes a screen/feature/component in the Flutter mobile app (`nexa_mobile/`, Android trolley/Troli app) — delegate to the `mobile-dev` subagent (`.claude/agents/mobile-dev.md`). It reads `nexa_mobile/CLAUDE.md` (root rules + locked/provisional/TBD decisions) and the `flutter-project-rules` skill (`.claude/skills/flutter-project-rules/SKILL.md`) before touching code. Several architecture decisions (local DB encryption, RFID reader protocol, build flavors, APK distribution) are still open per `Docs/21-Claude-Code-Mobile-Setup-Prompting-Guide.md` §1.2 — the subagent stops and asks rather than guessing on those. No dedicated Flutter/Dart MCP server is configured in this project; Flutter tooling runs through Bash (`flutter analyze`, `flutter test`, `dart run build_runner`, …).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
