# Sprint 46 - Improve Chat Model

## Objective
Upgrade the chat endpoint to use a stronger reasoning model with a fallback model for reliability.

## Tasks
- Locate and update `src/app/api/chat/route.ts`.
- Set primary model to `gpt-4.1`.
- Set fallback model to `gpt-4o`.
- Preserve existing endpoint behavior and response shape.

## Implementation Notes
- Added `PRIMARY_MODEL` and `FALLBACK_MODEL` constants.
- Implemented model request helper and fallback retry logic.
- Kept JSON response contract unchanged for UI compatibility.

## Completion Criteria
- Chat endpoint requests `gpt-4.1` first.
- Falls back to `gpt-4o` when primary request fails.
- API returns a user-friendly fallback response on model failure.
