# Sprint 67 — RAG Index Builder

## Objective
Build a CLI-triggered indexing pipeline that chunks all posts, generates embeddings, and writes the index to disk.

## Spec Reference
`src/spec/rag_spec.md` — System Components §3 (Index Storage) and §4 (Index Builder)

## Files
- `src/lib/rag/build-index.ts` — index builder script
- `data/rag-index.json` — output index file (build artifact, not source code)

## Tasks
- [ ] Create `src/lib/rag/build-index.ts`
  - Load all posts via `getAllPosts()` from `src/lib/posts.ts`
  - Chunk each post using `chunk.ts`
  - Embed all chunks using `embed.ts`
  - Write the result to `data/rag-index.json`
  - Full rebuild every run — no incremental logic yet
  - Include a content hash per post for future incremental builds
  - Print summary to stdout (post count, chunk count, file size)
- [ ] Create `data/` directory if it does not exist
- [ ] Add `package.json` script: `"build:rag-index": "npx tsx src/lib/rag/build-index.ts"`
- [ ] Verify `data/` is not in `.gitignore` (index must ship with deploys)

## Index Schema
```json
[
  {
    "id": "chunk_1",
    "text": "...",
    "slug": "post-slug",
    "title": "Post Title",
    "date": "2026-03-09",
    "chunkIndex": 0,
    "embedding": [ ... ]
  }
]
```

## Tests
- `src/__tests__/rag-indexing.test.ts`
  - [ ] Index file is written to `data/rag-index.json`
  - [ ] All posts are represented in the index
  - [ ] Each entry matches the expected schema (id, text, slug, title, date, chunkIndex, embedding)
  - [ ] Rebuild removes chunks from deleted posts (stale entry test)
  - [ ] Empty posts directory produces an empty index

## Completion Criteria
- `npm run build:rag-index` runs successfully and writes a valid index
- Index contains all posts, chunked and embedded
- All tests pass
