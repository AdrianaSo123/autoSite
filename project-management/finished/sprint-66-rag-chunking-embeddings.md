# Sprint 66 — RAG Chunking + Embeddings

## Objective
Implement the foundational content chunking and embedding layers for the RAG system.

## Spec Reference
`src/spec/rag_spec.md` — System Components §1 (Chunking Layer) and §2 (Embedding Layer)

## Files
- `src/lib/rag/chunk.ts` — chunking logic
- `src/lib/rag/embed.ts` — embedding functions

## Tasks
- [ ] Create `src/lib/rag/chunk.ts`
  - Split markdown content into chunks of 200–500 tokens (character approximation: 1 token ≈ 4 chars)
  - Prefer paragraph/heading boundaries over mid-sentence splits
  - Maintain 20–50 token overlap between consecutive chunks
  - Each chunk carries metadata: `{ id, text, slug, title, date, chunkIndex }`
- [ ] Create `src/lib/rag/embed.ts`
  - `embedText(text: string): Promise<number[]>` — embed a single string via OpenAI `text-embedding-3-small`
  - `embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]>` — batch embed an array of chunks
  - Use `OPENAI_API_KEY` from environment
- [ ] Export shared types: `Chunk`, `EmbeddedChunk`

## Tests
- `src/__tests__/rag-chunking.test.ts`
  - [ ] Splits a multi-paragraph post into multiple chunks
  - [ ] Each chunk respects the max token size limit
  - [ ] Overlap exists between consecutive chunks
  - [ ] Prefers heading/paragraph boundaries
  - [ ] Preserves slug, title, date metadata on every chunk
  - [ ] Handles empty content gracefully
- `src/__tests__/rag-embedding.test.ts`
  - [ ] `embedText` calls OpenAI with correct model and returns number[]
  - [ ] `embedChunks` returns EmbeddedChunk[] with embeddings attached
  - [ ] Handles API error without crashing

## Completion Criteria
- Chunking produces correctly sized, overlapping chunks from any markdown post
- Embedding functions return 1536-dimension vectors from OpenAI
- All tests pass
