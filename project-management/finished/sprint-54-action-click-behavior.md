# Sprint 54 - Action Click Behavior

## Objective
Allow suggested action buttons to trigger normal chat message flow.

## Tasks
- Wire suggestion button clicks to `useChat.sendMessage`.
- Ensure click flow appends user message and calls chat API.
- Reuse existing chat history behavior.

## Implementation Notes
- Use the existing `sendMessage(text)` path for full consistency.

## Completion Criteria
- Clicking a suggestion immediately sends it as a user message.
- The normal chat response lifecycle executes.
