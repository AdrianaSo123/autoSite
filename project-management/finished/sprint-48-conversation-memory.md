# Sprint 48 - Conversation Memory

## Objective
Enable multi-turn context so the assistant can handle follow-up questions more reliably.

## Tasks
- Update `src/hooks/useChat.ts` to send message history with each request.
- Update `src/app/api/chat/route.ts` to accept and normalize history.
- Add safe truncation limits for history length and message size.

## Implementation Notes
- Added history payload in `useChat` request body.
- Added server-side `normalizeHistory` with role/content validation.
- Applied truncation limits to avoid oversized prompts.

## Completion Criteria
- Previous user/assistant turns are included in API requests.
- Long histories are safely truncated.
- Follow-up responses remain context-aware.
