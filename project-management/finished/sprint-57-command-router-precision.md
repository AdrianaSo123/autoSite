# Sprint 57 - Command Router Precision

## Objective
Prevent normal conversational questions from being misrouted as commands.

## Tasks
- Tighten command matching logic in `src/lib/commands.ts` to prefix-based checks.
- Avoid broad keyword matching with `includes`.
- Return `null` when no command match exists so LLM handles the request.

## Implementation Notes
- Added command phrase prefix lists and shared `startsWithAny` helper.
- Updated fallback behavior to `null`.
- Updated chat route handling for nullable command results.

## Completion Criteria
- Conversational queries route to LLM.
- Commands still trigger reliably.
- Command fallback responses are reduced.
