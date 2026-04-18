# Retrieval-Augmented Generation (RAG) System — Specification

> Transform the system from keyword-based retrieval into a structured,
> memory-aware, retrieval-augmented knowledge system. The goal is not
> to “add embeddings,” but to evolve the architecture into a deterministic,
> inspectable, and production-ready retrieval pipeline that integrates
> cleanly with existing MCP tools and chat orchestration.

---

## The Gap

The system already implements grounded retrieval:

* Tool-based routing (`tool-router.ts`)
* Keyword-based search (`search-blog-posts.ts`)
* Markdown-backed source of truth (`posts/`)
* Chat responses constrained to retrieved content

This provides **deterministic grounding**, but has limitations:

1. **Keyword dependency**

   * Retrieval fails when wording differs from stored content
   * No semantic understanding

2. **Whole-document retrieval**

   * Entire posts are scored and returned
   * No fine-grained relevance at paragraph/idea level

3. **No memory abstraction**

   * Past content exists but is not queryable as a knowledge base
   * No cross-post synthesis

4. **No retrieval quality controls**

   * No ranking by semantic similarity
   * No filtering of noisy results

---

## Objective

Upgrade the system into a **minimal, production-ready RAG architecture** that:

* Enables semantic retrieval via embeddings
* Operates at **chunk-level granularity**
* Preserves deterministic grounding guarantees
* Integrates with existing MCP tool infrastructure
* Remains local, inspectable, and testable

---

## Design Principles

### 1. Retrieval-first, not generation-first

The system should always:

> retrieve → filter → inject → generate

Never:

> generate → hope it’s correct

---

### 2. Extend, don’t replace

* Existing keyword retrieval remains as fallback
* RAG is introduced as a **new tool**
* Tool-router decides when to use semantic vs keyword

---

### 3. Local-first architecture

* No external vector DB initially
* Storage must be:

  * JSON or SQLite
  * inspectable and debuggable

---

### 4. Deterministic + inspectable

Every retrieval must be:

* explainable (why was this returned?)
* reproducible
* testable

---

### 5. Chunk-level reasoning

The system reasons over:

> ideas, not documents

---

## Architecture Overview

```text
Content Ingestion
  → Chunking
  → Embedding
  → Index Storage
        ↓
Query
  → Query Embedding
  → Similarity Search
  → Top-k Chunk Selection
        ↓
Prompt Augmentation
        ↓
LLM Response (grounded)
```

---

## System Components

### 1. Chunking Layer

File:
`src/lib/rag/chunk.ts`

#### Responsibilities

* Split content into semantically meaningful chunks
* Maintain overlap for context continuity
* Preserve metadata

#### Chunk Strategy

| Parameter       | Value                           |
| --------------- | ------------------------------- |
| Chunk size      | 200–500 tokens                  |
| Overlap         | 20–50 tokens                    |
| Boundary        | Prefer paragraph/heading splits |
| Token counting  | Character approximation (1 token ≈ 4 chars). No external tokenizer dependency. If precision is needed later, add `gpt-tokenizer`. |

#### Output Schema

```ts
type Chunk = {
  id: string
  text: string
  slug: string
  title: string
  date: string
  chunkIndex: number
}
```

> `date` is required so chunks can populate `sessionState.lastPostResults`
> (which needs `{ title, slug, date }`) for follow-up commands like "open 1".

---

### 2. Embedding Layer

File:
`src/lib/rag/embed.ts`

#### Responsibilities

* Generate embeddings for:

  * content chunks
  * user queries

#### Embedding Model

| Parameter  | Value                                |
| ---------- | ------------------------------------ |
| Model      | `text-embedding-3-small` (OpenAI)    |
| Dimensions | 1536                                 |
| Cost       | ~$0.02 / 1M tokens                   |

This model is chosen for low cost, small index size, and sufficient quality for a blog-scale corpus. If retrieval quality is insufficient, upgrade to `text-embedding-3-large` (3072 dims) — this will require rebuilding the index.

#### API

```ts
embedText(text: string): Promise<number[]>
embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]>
```

#### Embedded Chunk

```ts
type EmbeddedChunk = Chunk & {
  embedding: number[]
}
```

---

### 3. Index Storage

File:
`data/rag-index.json` (initial)

> The index is a build artifact, not source code. It lives outside `src/` at the project root.
> On Vercel (serverless), the filesystem is read-only at runtime. The index must be built at build time or committed to the repo.

#### Structure

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

#### Requirements

* Fast read
* Append-friendly
* Easily replaceable with SQLite later

---

### 4. Index Builder

File:
`src/lib/rag/build-index.ts`

#### Responsibilities

* Load all markdown posts (`posts.ts`)
* Chunk content
* Generate embeddings
* Persist index

#### Trigger Modes

* Manual CLI script
* On new post creation (future)

#### CLI Runner

Add a script to `package.json`:

```json
"scripts": {
  "build:rag-index": "npx tsx src/lib/rag/build-index.ts"
}
```

`tsx` is used because the script imports from `@/lib/posts` which relies on TypeScript path aliases resolved through `tsconfig.json`. Plain `ts-node` requires additional `tsconfig-paths` setup.

#### Index Invalidation

* Rebuild the full index when posts are added, edited, or deleted.
* The CLI script always does a full rebuild (not incremental) for simplicity.
* Add a content hash per post so future incremental builds can skip unchanged posts.
* Stale chunks from deleted posts must not persist in the index.

---

### 5. Retrieval Engine

File:
`src/lib/rag/retrieve.ts`

#### Responsibilities

* Embed user query
* Compute cosine similarity
* Rank chunks
* Return top-k results

#### API

```ts
type ScoredChunk = Chunk & { score: number }

retrieveRelevantChunks(query: string, k = 5): Promise<ScoredChunk[]>
```

> Returns chunks with their cosine similarity score attached so callers
> can threshold, display, or log relevance.

#### Ranking Strategy

```text
similarity = cosine(query_embedding, chunk_embedding)
sort descending
take top-k
```

#### Optional Filtering

* Minimum similarity threshold (recommend 0.3 as initial floor)
* Deduplicate chunks from same post if needed

#### Error Handling

* If the embedding API call for the query fails, return an empty result set and let the router fall back to keyword search.
* If the index file cannot be read, throw a clear error so the calling tool can degrade gracefully.
* Never let a retrieval failure crash the chat API.

---

### 6. MCP Tool Integration

File:
`src/lib/mcp/semantic-search-posts.ts`

#### Responsibilities

* Wrap retrieval engine
* Return formatted string (matching existing `MCPTool.execute` signature: `Promise<string>`)
* Store results in `sessionState.lastPostResults` so follow-up commands like "open 1" work

#### Session Integration

After retrieval, the tool must populate session state:

```ts
sessionState.lastPostResults = scoredChunks.map(c => ({
  title: c.title,
  slug: c.slug,
  date: c.date,
}))
```

This preserves the existing follow-up navigation contract.

#### Tool Output

The execute function returns a **formatted string** (not a structured object) to match the existing `MCPTool` interface:

```ts
// Example output string
`🔍 Semantic results for "${query}":\n\n1. [excerpt]\n   /blog/slug (date)\n\n2. ...`
```

#### Error Handling

* If the embedding API is unavailable or rate-limited, fall back to keyword search (`searchBlogPosts`).
* If the index file is missing or corrupt, log a warning and fall back to keyword search.
* Wrap execution in the existing `safeExecute` pattern from `tool-registry.ts`.

#### Registration

* Add to `tool-registry.ts`
* Public tool (non-admin)

---

### 7. Tool Routing

Modify:
`src/lib/mcp/tool-router.ts`

#### Routing Logic

The full priority chain after this change:

```text
1. Command router (deterministic, highest priority)
2. Keyword tool match (existing blog intent detection)
3. Semantic search tool (new — conceptual / synthesis queries)
4. LLM tool selection fallback (existing)
5. General LLM conversation (no tool)
```

Use semantic search when:

* Query is conceptual ("what have I said about…")
* Query lacks strong keyword matches but has blog intent
* Query implies synthesis across posts

The router should attempt keyword matching first (fast, deterministic). If keyword matching returns no results but the message has blog intent, escalate to semantic search. This avoids embedding API calls for queries that keyword search handles well.

Fallback:

* keyword search tool (always available even if embedding API is down)

---

### 8. Chat Integration

File:
`src/app/api/chat/route.ts`

#### Prompt Construction

```text
Relevant excerpts from blog content:
- [chunk 1]
- [chunk 2]
- [chunk 3]

User query:
[query]

Instructions:
- Answer using only the provided excerpts
- Do not fabricate blog content
- Synthesize when multiple excerpts are present
```

---

## Recording Pipeline Integration

> **Important boundary:** Production audio publishing runs through the external `server/uploadServer.js` pipeline, not the Next.js dev-only routes. The integration described here targets the external pipeline. The Next.js routes for upload/transcribe/generate are explicitly marked development-only and refuse to operate in production.

Extend the **external server** flow:

```text
Audio
  → Transcription
  → Chunking
  → Embedding
  → Index Storage
  → Blog Post
```

#### Result

* Every recording becomes queryable memory
* System evolves into a knowledge base

---

## Retrieval Modes

| Mode            | Trigger             | Behavior            |
| --------------- | ------------------- | ------------------- |
| Keyword         | Exact match queries | Current system      |
| Semantic (RAG)  | Conceptual queries  | Embedding retrieval |
| Hybrid (future) | Complex queries     | Combine both        |

---

## Acceptance Criteria

### Functional

* System retrieves relevant content even without keyword overlap
* Can answer:

  * “What have I said about X?”
  * “Summarize my ideas on Y”
* Returns chunk-level excerpts

---

### Quality

* Retrieved chunks are semantically relevant
* Responses reference real content only
* No hallucinated blog facts

---

### System Integrity

* Existing retrieval still works
* Tool architecture remains intact
* No regression in chat behavior

---

## Non-Goals

* No Pinecone / external vector DB
* No LangChain abstraction layer
* No full rewrite of retrieval system
* No premature optimization

---

## Evaluation Metrics

| Metric             | Goal                     |
| ------------------ | ------------------------ |
| Retrieval accuracy | Relevant chunks returned |
| Response grounding | 100% grounded            |
| Latency            | <500ms retrieval         |
| System clarity     | Fully inspectable        |

---

## Testing Strategy

Every sprint must include corresponding tests in `src/__tests__/`. The project already has sprint-scoped test files for every feature. RAG sprints follow the same convention.

### Unit Tests

| Component       | Test file                               | Covers                                                    |
| --------------- | --------------------------------------- | --------------------------------------------------------- |
| Chunking        | `src/__tests__/rag-chunking.test.ts`    | Splits by paragraph/heading, respects size limits, overlap |
| Cosine similarity | `src/__tests__/rag-retrieval.test.ts` | Math correctness, identical vectors → 1.0, orthogonal → 0 |
| Retrieval       | `src/__tests__/rag-retrieval.test.ts`   | Top-k ordering, threshold filtering, deduplication         |
| MCP tool        | `src/__tests__/rag-mcp-tool.test.ts`    | Session state populated, formatted output, fallback on error |

### Integration Tests

| Scenario                          | Expectation                                         |
| --------------------------------- | --------------------------------------------------- |
| Semantic query with matching post | Returns relevant chunks, not unrelated posts         |
| Query with no semantic match      | Returns empty, does not hallucinate                  |
| Embedding API failure             | Falls back to keyword search, does not crash         |
| Missing index file                | Falls back gracefully, logs warning                  |
| Follow-up "open 1" after semantic | Works because sessionState was populated correctly   |

### Regression Tests

* All existing tests in `src/__tests__/sprint-mcp-search.test.ts` must continue to pass.
* All existing tests in `src/__tests__/architecture-permissions.test.ts` must continue to pass.
* Keyword search behavior must be unchanged.

---

## Sprint Plan

### Sprint 1 — Chunking + Embeddings

* Implement chunk logic (`src/lib/rag/chunk.ts`)
* Implement embedding functions (`src/lib/rag/embed.ts`)
* Tests: chunk splitting, overlap, boundary detection, embedding call shape

---

### Sprint 2 — Indexing

* Build index from posts (`src/lib/rag/build-index.ts`)
* Store embeddings to `data/rag-index.json`
* Add `build:rag-index` script to `package.json`
* Tests: index file written, all posts indexed, schema correct, stale entries removed on rebuild

---

### Sprint 3 — Retrieval Engine

* Implement cosine similarity (`src/lib/rag/retrieve.ts`)
* Return top-k scored chunks
* Tests: ranking correctness, threshold filtering, deduplication, empty index handling

---

### Sprint 4 — MCP Tool

* Create semantic search tool (`src/lib/mcp/semantic-search-posts.ts`)
* Register in `tool-registry.ts`
* Update routing in `tool-router.ts`
* Tests: tool returns formatted string, sessionState populated, fallback to keyword on error, permission is public

---

### Sprint 5 — Chat Integration

* Inject retrieved chunks into LLM prompt in `chat/route.ts`
* Validate grounded responses
* Tests: prompt includes retrieved excerpts, no hallucinated blog content, existing chat behavior unchanged

---

### Sprint 6 — Recording Integration

* Extend external `server/uploadServer.js` pipeline to embed transcripts on publish
* Ensure newly published posts are indexed
* Tests: new post appears in index after rebuild, transcript-derived chunks are retrievable

---

## Final Note

This upgrade shifts the system from:

> blog + chat interface

to:

> retrieval-augmented knowledge system with memory and grounding

This is a **capability shift**, not a feature.

---
