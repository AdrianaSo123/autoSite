# Sprint 71 — RAG Recording Pipeline Integration

## Objective
Ensure newly published posts from the external recording pipeline are indexed so they become immediately queryable via semantic search.

## Spec Reference
`src/spec/rag_spec.md` — Recording Pipeline Integration

## Important Boundary
Production audio publishing runs through the external `server/uploadServer.js` pipeline, not the Next.js dev-only routes. This sprint targets the external pipeline.

## Files
- `server/uploadServer.js` — extend post-publish step
- `src/lib/rag/build-index.ts` — already built in Sprint 67

## Tasks
- [ ] After `server/uploadServer.js` commits a new post to GitHub, trigger a RAG index rebuild
  - Option A: run `npm run build:rag-index` as a post-publish step in the server
  - Option B: add index rebuild to the Vercel build command so it runs on each deploy
  - Recommend Option B for simplicity — the Git commit triggers a Vercel redeploy which rebuilds the index
- [ ] Update the Vercel build command or `package.json` build script to include index generation
  - Example: `"build": "npm run build:rag-index && next build"`
- [ ] Verify that after a new post is published and deployed, its content appears in semantic search results
- [ ] Verify that deleted posts do not persist as stale chunks after rebuild

## Tests
- `src/__tests__/rag-recording-integration.test.ts`
  - [ ] New post added to `posts/` appears in the index after rebuild
  - [ ] Transcript-derived chunks are retrievable via semantic search
  - [ ] Deleted post's chunks are removed after rebuild
  - [ ] Index rebuild completes without error when no posts exist

## Completion Criteria
- New posts are automatically indexed on deploy
- Semantic search returns content from newly published posts
- No stale data from deleted posts
- All tests pass
