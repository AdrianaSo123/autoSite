# Sprint 47 - System Prompt Guidance

## Objective
Improve assistant interpretation and consistency by attaching a clear system prompt on every chat request.

## Tasks
- Add system prompt guidance in `src/app/api/chat/route.ts`.
- Ensure prompt is included in every LLM request.
- Emphasize blog discovery behavior for relevant user requests.

## Implementation Notes
- Added `SYSTEM_PROMPT` constant in the chat route.
- System prompt now frames role as Strategic AI Intelligence assistant.
- Prompt instructs tool-first behavior for blog/articles/topics queries.

## Completion Criteria
- Every LLM call includes the system prompt.
- Responses are more context-aware and aligned with site goals.
