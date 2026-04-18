# Sprint 69 — RAG MCP Tool + Routing

## Objective
Create a semantic search MCP tool, register it in the tool registry, and update the tool router to use it as an escalation path when keyword search returns no results.

## Spec Reference
`src/spec/rag_spec.md` — System Components §6 (MCP Tool Integration) and §7 (Tool Routing)

## Files
- `src/lib/mcp/semantic-search-posts.ts` — new MCP tool
- `src/lib/mcp/tool-registry.ts` — register tool
- `src/lib/mcp/tool-router.ts` — update routing logic

## Tasks
- [ ] Create `src/lib/mcp/semantic-search-posts.ts`
  - Call `retrieveRelevantChunks(query, 5)` from `retrieve.ts`
  - Populate `sessionState.lastPostResults` with `{ title, slug, date }` from results
  - Return a formatted string matching existing tool output style
  - On embedding API failure: fall back to `searchBlogPosts` keyword search
  - On missing/corrupt index: log warning, fall back to keyword search
- [ ] Register in `tool-registry.ts`
  - Name: `semanticSearchPosts`
  - Description: `Semantically search blog posts by meaning, not just keywords.`
  - Access: `public`
  - Wrap in existing `safeExecute` pattern
- [ ] Update `tool-router.ts` routing logic
  - Priority chain: commands → keyword match → **semantic search** → LLM fallback → general LLM
  - Trigger semantic search when: blog intent detected but keyword search returned no results
  - Do not call semantic search for queries that keyword search already handled
  - Keyword search remains the default for exact match queries

## Router Priority Chain
```text
1. Command router (deterministic, highest priority)
2. Keyword tool match (existing blog intent detection)
3. Semantic search tool (new — conceptual / synthesis queries)
4. LLM tool selection fallback (existing)
5. General LLM conversation (no tool)
```

## Tests
- `src/__tests__/rag-mcp-tool.test.ts`
  - [ ] Tool returns a formatted string (not structured object)
  - [ ] `sessionState.lastPostResults` is populated after retrieval
  - [ ] Follow-up "open 1" works after semantic results
  - [ ] Falls back to keyword search when embedding API fails
  - [ ] Falls back to keyword search when index is missing
  - [ ] Tool has `access: "public"` (not admin-only)
- Regression
  - [ ] All tests in `src/__tests__/sprint-mcp-search.test.ts` still pass
  - [ ] All tests in `src/__tests__/architecture-permissions.test.ts` still pass
  - [ ] Keyword search behavior is unchanged

## Completion Criteria
- Semantic search tool is registered and callable
- Router escalates to semantic search when keywords fail
- Existing keyword path is untouched
- Session continuity works for follow-up commands
- All tests pass, no regressions
