# Decision Log

This file tracks significant decisions made during development conversations. The knowledge sync hook automatically updates this file when conversations are compacted or stopped.

## Format

Each decision entry follows this structure:
- **Timestamp**: When the decision was made
- **Context**: Why the decision was needed
- **Decision**: What was decided
- **Rationale**: Why this choice was made

When a decision is overturned, the original entry is struck through and a new entry is added explaining the change.

---

## [2026-02-05 13:26] Knowledge Sync Hook Implementation

**Context:** Need to automatically capture learnings and decisions from conversations to maintain institutional knowledge across sessions.

**Decision:** Implement knowledge synchronization as `agent` type hooks on both `PreCompact` and `Stop` events.

**Rationale:**
- `agent` type chosen over `command` because it needs Read/Write/Glob tools to analyze transcript and update files
- `agent` type chosen over `prompt` because it needs tool access for file modifications
- Both events chosen to capture knowledge both when context compacts (mid-session) and when conversation ends

**Alternatives considered:**
- `command` hook calling external script - Rejected: would require maintaining separate LLM API integration
- `prompt` hook - Rejected: no tool access for file modifications
- Only `Stop` event - Rejected: would miss learnings in long sessions that compact before ending

---

## [2026-02-05 13:26] Haiku Model for Knowledge Sync

**Context:** Need to choose a model for the knowledge sync hook that balances cost and capability.

**Decision:** Use `haiku` model for the knowledge sync agent hook.

**Rationale:**
- Knowledge extraction is a relatively straightforward analysis task
- Haiku is the cheapest model available
- Hook runs frequently (every stop/compact), so cost adds up
- The task doesn't require complex reasoning - just pattern matching and summarization

**Trade-offs:**
- May miss subtle or complex decisions that opus would catch
- Acceptable because significant decisions are usually explicit in conversation

---

## [2026-02-05 13:26] Strikethrough for Overturned Decisions

**Context:** Need a clear way to show decision evolution over time while preserving history.

**Decision:** Use `~~strikethrough~~` markdown syntax to mark overturned decisions, keeping them visible but clearly superseded.

**Rationale:**
- Preserves decision history for audit trail
- Visually clear which decisions are current vs. overturned
- Standard markdown syntax, renders correctly in most viewers
- Allows linking new decisions to what they replaced

---

## [2026-02-05 13:27] Decision Log Location

**Context:** Where to store the decision log file.

**Decision:** Store at `.claude/decisions.md` within the project.

**Rationale:**
- Keeps it with other Claude-specific configuration
- Easy for the hook to find via glob pattern
- Project-scoped, not global
- Can be version controlled with the project

