# Sprint 63 - Observability and Logging Improvements

## Objective
Improve operational visibility and debugging for assistant behavior.

## Tasks
- Extend `src/lib/activity-log.ts` with new activity types.
- Add logs for tool usage, command routing, and LLM fallback usage.
- Ensure logs do not store sensitive raw user text.

## Implementation Notes
- Added activity types: `command_routed`, `llm_fallback_used`, `tool_response_summarized`.
- Added metadata sanitization and key redaction in activity logger.
- Added dashboard labels/metrics for new observability events.

## Completion Criteria
- Activity logs clearly reflect routing/summarization/fallback behavior.
- Dashboard surfaces useful operational signals.
