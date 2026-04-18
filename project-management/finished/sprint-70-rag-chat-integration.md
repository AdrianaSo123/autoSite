# Sprint 70 — RAG Chat Integration

## Objective
Inject retrieved chunks into the LLM prompt so the assistant can synthesize grounded answers from semantic search results.

## Spec Reference
`src/spec/rag_spec.md` — System Components §8 (Chat Integration)

## Files
- `src/app/api/chat/route.ts` — modify prompt construction

## Tasks
- [ ] When the semantic search tool returns results, include the retrieved chunk excerpts in the LLM prompt
  - Format excerpts clearly so the model can reference them
  - Cap injected context to prevent prompt overflow (max ~3000 chars of chunk text)
- [ ] Update the system prompt or injection block to instruct the model:
  - Answer using only the provided excerpts
  - Do not fabricate blog content beyond what excerpts contain
  - Synthesize when multiple excerpts are relevant
- [ ] Ensure the summarization path (`summarizeToolResult`) works correctly with semantic results
- [ ] Preserve existing behavior for keyword tool results and general conversation

## Prompt Construction Template
```text
Relevant excerpts from blog content:
- [chunk 1 text] (from "Post Title", date)
- [chunk 2 text] (from "Post Title", date)
- [chunk 3 text] (from "Post Title", date)

User query:
[query]

Instructions:
- Answer using only the provided excerpts
- Do not fabricate blog content
- Synthesize when multiple excerpts are present
```

## Tests
- `src/__tests__/rag-chat-integration.test.ts`
  - [ ] LLM prompt includes retrieved excerpts when semantic tool fires
  - [ ] Excerpts are capped at the size limit
  - [ ] No hallucinated blog content in responses (grounding check)
  - [ ] Existing chat behavior unchanged for non-semantic queries
  - [ ] Keyword tool results still work as before
  - [ ] General conversation (no tool) still works as before

## Completion Criteria
- Semantic search results are injected into the LLM prompt
- Grounding instructions are present
- No regressions in existing chat, command, or keyword flows
- All tests pass
