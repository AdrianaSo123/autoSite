# Sprint 51 - Suggested Action Response Format

## Objective
Extend the chat API response schema so assistant replies can include suggested follow-up actions.

## Tasks
- Update `src/app/api/chat/route.ts` response payload.
- Add optional `suggestedActions` array in chat responses.
- Keep normal assistant message field unchanged for compatibility.

## Implementation Notes
- Introduce a shared response shape with optional suggestions.
- Ensure command/tool/LLM paths can all return suggestions.

## Completion Criteria
- Chat API responses can include `suggestedActions: string[]` (optional).
- Assistant message continues to render normally.
