# Sprint 49 - Improve Blog Search Usage

## Objective
Improve natural-language blog query detection and ensure blog search tools are used consistently.

## Tasks
- Improve routing logic in `src/lib/mcp/tool-router.ts`.
- Add intent handling for queries like:
  - recent posts
  - blog about AI
  - articles on agents
  - what have you written about
- Keep search/list tool outputs clear for chat consumption.

## Implementation Notes
- Added blog intent terms and fast-path routing.
- Added natural-language phrase handling to map user intent to tools.
- Expanded search keyword coverage for blog/article phrasing.

## Completion Criteria
- Blog-related queries trigger MCP post tools more reliably.
- Search/list outputs remain clearly formatted for users.
