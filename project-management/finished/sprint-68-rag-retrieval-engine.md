# Sprint 68 — RAG Retrieval Engine

## Objective
Implement the similarity search engine that embeds a user query, compares it against the index, and returns the top-k most relevant chunks.

## Spec Reference
`src/spec/rag_spec.md` — System Components §5 (Retrieval Engine)

## Files
- `src/lib/rag/retrieve.ts` — retrieval engine

## Tasks
- [ ] Create `src/lib/rag/retrieve.ts`
  - Load `data/rag-index.json` at module level (read once, cache in memory)
  - `retrieveRelevantChunks(query: string, k = 5): Promise<ScoredChunk[]>`
  - Embed the query using `embedText()` from `embed.ts`
  - Compute cosine similarity between query embedding and every chunk embedding
  - Sort descending by score
  - Apply minimum similarity threshold (0.3 initial floor)
  - Deduplicate chunks from the same post if they are adjacent and overlapping
  - Return top-k `ScoredChunk[]` (Chunk + `score: number`)
- [ ] Implement `cosineSimilarity(a: number[], b: number[]): number` as a pure function
- [ ] Handle missing or corrupt index file gracefully (throw clear error for caller)

## Types
```ts
type ScoredChunk = Chunk & { score: number }
```

## Tests
- `src/__tests__/rag-retrieval.test.ts`
  - [ ] Cosine similarity: identical vectors → 1.0
  - [ ] Cosine similarity: orthogonal vectors → 0.0
  - [ ] Cosine similarity: opposite vectors → -1.0
  - [ ] Top-k ordering is correct (highest score first)
  - [ ] Threshold filtering excludes low-score chunks
  - [ ] Deduplication removes adjacent overlapping chunks from same post
  - [ ] Empty index returns empty results (does not crash)
  - [ ] Missing index file throws a clear error

## Completion Criteria
- Retrieval returns semantically relevant chunks for test queries
- Cosine similarity math is correct
- Threshold and deduplication work as specified
- All tests pass
