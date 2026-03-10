# Sprint 52 - Context-Aware Suggestion Generation

## Objective
Generate dynamic, context-aware follow-up suggestions based on assistant responses.

## Tasks
- Generate up to three suggestion phrases after each assistant reply.
- Use response context (blog results vs concept explanation) to choose suggestions.
- Ensure suggestions are short and directly sendable as user messages.

## Implementation Notes
- Add a small suggestion generator in the chat route.
- Keep logic deterministic and dependency-free.

## Completion Criteria
- Assistant responses include relevant suggestions in most conversational cases.
- Suggestions are capped at three items.
