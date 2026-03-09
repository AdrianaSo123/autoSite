# Sprint 32 — Remove Fake MCP Tools

## Objective
Remove tools that produce fabricated data. Only real, deterministic tools should remain.

## Tasks
1. Remove `getSystemStatus` MCP tool from `agent.ts`
2. Remove `getSiteAnalytics` tool and delete `get-site-analytics.ts`
3. Remove analytics references from `commands.ts`
4. Update `toolRegistry` keyword mapping
5. Update tests referencing these tools
6. Delete `api/analytics` route

## Remaining Tools
- `listRecentPosts`
- `searchBlogPosts`
- `getPostSummary`

## Verification
- Only real tools remain in the system
- All tests pass
- Build succeeds
