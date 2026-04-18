# Coding Agent Briefing

## Project Overview

This project is a Next.js 14 application with an App Router frontend, a chat API, local markdown-based blog content, and a small tool-routing layer that lets the assistant answer questions about published posts without fabricating content.

Important boundary: this repository contains both the main web app and evidence of a separate production publishing pipeline. The Next.js app is the user-facing site and chat layer. Audio ingestion and auto-publishing are intentionally marked as external or development-only inside the web app.

Core areas:

- `src/app/`: Next.js routes, pages, layouts, and API endpoints.
- `src/app/api/chat/route.ts`: Main chat orchestration layer. Handles command routing, tool routing, LLM fallback, response shaping, and request-scoped session state.
- `src/lib/mcp/tool-router.ts`: Detects user intent and routes blog-oriented requests to tools.
- `src/lib/mcp/tool-registry.ts`: Tool registry and access control for public/admin tools.
- `src/lib/mcp/search-blog-posts.ts`: Current retrieval logic for blog search. This is keyword-based scoring over local post data.
- `src/lib/posts.ts`: Reads and parses markdown posts from the `posts/` directory.
- `posts/`: Source of truth for published blog content.
- `src/__tests__/`: Test coverage for chat routing, MCP tools, UI behavior, auth, and architecture constraints.

## How The Current Retrieval Works

The project already has a lightweight retrieval pattern:

1. User sends a message to the chat API.
2. The app first tries deterministic command handling.
3. It then routes blog-related requests to MCP-style tools.
4. Tools fetch real post data from local markdown files.
5. The assistant is instructed to only reference blog content that was actually returned by a tool.

This means the project already uses grounded retrieval for blog discovery and summary. It is not full RAG, but it is not purely freeform chat either.

## Accuracy Notes

The statements above were checked against the current codebase and are accurate with the following clarifications:

- The homepage is conversation-first. `src/app/page.tsx` renders `HomeClient`, which renders `ChatInterface` as the primary experience.
- Chat history is persisted in browser localStorage by `src/hooks/useChat.ts`.
- Cross-request post context is preserved by echoing `postResults` through the client and restoring them into a request-scoped `AsyncLocalStorage` session in `src/lib/mcp/session.ts`.
- The assistant is allowed to discuss AI and UX generally from model knowledge, but it is instructed not to invent blog-specific facts. Blog facts are expected to come from tools.
- The blog itself is file-backed. `src/lib/posts.ts` reads markdown files directly from `posts/`.
- The production audio pipeline is not fully handled by the Next.js app. Several API routes are explicitly marked development/demo only and state that production uses an external recording pipeline.

## Overall Architecture

The system has five main layers.

### 1. Presentation Layer

This is the user-facing Next.js app.

- `src/app/layout.tsx` provides the root layout, nav, providers, theme restoration, and analytics.
- `src/app/page.tsx` is the homepage entry point.
- `src/components/HomeClient.tsx` makes the homepage a full chat-first experience.
- `src/components/ChatInterface.tsx` renders the public conversational UI.
- `src/components/AdminChat.tsx` renders the admin console UI.

### 2. Client Chat State Layer

This is handled mainly by `src/hooks/useChat.ts`.

- Stores the current conversation in React state.
- Persists chat history in localStorage.
- Sends user messages to `/api/chat`.
- Stores the latest `postResults` returned by the server and sends them back on the next request.
- Executes server-returned actions such as opening posts, opening the studio, or changing theme.

### 3. Chat Orchestration Layer

This is the core backend decision layer in `src/app/api/chat/route.ts`.

For each chat request, it:

1. Validates and normalizes the input.
2. Rehydrates the latest post context into a request-scoped session.
3. Checks auth to determine whether the user is admin.
4. Tries deterministic command routing first.
5. Tries MCP-style tool routing second.
6. If a tool responds, optionally summarizes that tool output for the UI.
7. Falls back to the LLM only when no command or tool handled the request.
8. Returns a structured response including reply text, optional actions, optional suggestion chips, and post results for future continuity.

This route is the operational center of the app.

### 4. Retrieval and Tool Layer

This layer lives under `src/lib/mcp/` plus `src/lib/posts.ts`.

- `tool-router.ts` detects intent and selects a tool.
- `tool-registry.ts` defines available tools and public vs admin access.
- `search-blog-posts.ts` does keyword-based ranking over title, excerpt, and content.
- `session.ts` isolates `lastPostResults` per request using `AsyncLocalStorage`.
- `posts.ts` loads and parses markdown blog posts from disk.

This is the part of the system most relevant to RAG discussions.

### 5. Content and Publishing Layer

There are two distinct modes here.

Published content mode:

- Markdown files in `posts/` are treated as the source of truth.
- `src/app/blog/page.tsx` lists posts.
- `src/app/blog/[slug]/page.tsx` renders a single post and statically generates routes from slugs.

Production publishing mode:

- The codebase indicates that production audio publishing is expected to run through an external server/pipeline.
- `src/app/api/upload-audio/route.ts`, `src/app/api/transcribe/route.ts`, and `src/app/api/generate-post/route.ts` are all marked development/demo only.
- The `server/` folder contains an Express-based upload/transcription/generation/publish pipeline that appears intended to handle recording uploads and GitHub-based publication outside the main Next.js runtime.

## How The System Works End To End

### Public chat flow

1. A user types into `ChatInterface`.
2. `useChat` appends the message locally and POSTs to `/api/chat`.
3. The server checks commands first, then blog tools, then general LLM fallback.
4. If a tool returns blog results, those results are stored request-locally and also returned to the client as `postResults`.
5. The client keeps those post results and sends them back on the next turn so follow-ups like "open 1" or "summarize this post" still work even in serverless environments.
6. The UI renders the assistant reply and optional suggested follow-up actions.

### Blog retrieval flow

1. A blog-related message is detected by `tool-router.ts`.
2. A tool such as `searchBlogPosts` or `listRecentPosts` is selected.
3. The tool reads real markdown post data via `posts.ts`.
4. The tool returns structured or semi-structured text.
5. The chat route may summarize that tool output for cleaner UX.
6. The final answer is shown to the user without inventing unpublished blog content.

### Admin flow

1. A user authenticates with Google via NextAuth.
2. Admin status is derived from whether the session email matches `ADMIN_EMAIL`.
3. `/studio` is protected server-side and redirects non-admin users to login.
4. The admin console uses the same chat hook and chat API, but can access admin-only tools such as theme switching.
5. Activity can be viewed through the admin-only `/api/activity` route, backed by `logs/activity.json`.

### Publishing flow

There are two versions of this flow.

Inside the Next.js app:

- Upload, transcription, and post generation routes exist for development/demo use.
- In production, these routes intentionally refuse to operate.

Outside the Next.js app:

- The `server/` folder contains an Express service that accepts recordings, transcribes them, generates blog markdown, updates `posts/`, and appears capable of publishing via GitHub.
- The project therefore spans both a web application and a separate content-ingestion pipeline.

## Why This Matters For An Agent

An agent without full repository context can make bad assumptions unless these boundaries are explicit.

The most important facts are:

- The homepage is primarily a chat product, not a traditional marketing homepage.
- Blog content is grounded in local markdown files.
- Tool-based retrieval is already part of the architecture.
- Production publishing is not fully in the Next.js runtime.
- Any RAG work should integrate with the existing tool and retrieval layer rather than bypass it.

## RAG Assessment

RAG is possible here, but it is not obviously necessary yet.

Why it may not be necessary right now:

- The content corpus appears relatively small.
- Posts are local, structured, and easy to scan synchronously.
- The existing retrieval path is simple, understandable, and low-maintenance.
- Adding embeddings, chunking, indexing, and prompt-context assembly would introduce extra complexity that may not produce much benefit at current scale.

When RAG would become justified:

- Users need semantic search beyond keyword matching.
- The content base grows significantly.
- Retrieval expands beyond published posts into transcripts, uploads, drafts, notes, or analytics.
- The assistant needs grounded answers to broader questions that synthesize multiple documents.

## Recommended Direction

Do not jump directly to a full vector-database RAG stack.

Preferred progression:

1. Improve the current retrieval first.
2. Add excerpt-level retrieval instead of whole-post scoring only.
3. Add metadata-aware ranking using title, excerpt, headings, tags, and date.
4. Only add embeddings when the current approach becomes a clear bottleneck.

This project is already structured well enough that retrieval can be upgraded incrementally.

## If You Implement RAG

Keep it minimal and compatible with the current architecture.

Recommended design:

1. Create a content indexing step for markdown posts.
2. Chunk posts into sections or paragraphs.
3. Generate embeddings for each chunk.
4. Store the index locally first, for example as JSON, unless there is a strong reason to add external infrastructure.
5. Add a new retrieval tool rather than replacing the existing routing model.
6. Inject only the top relevant excerpts into the chat prompt.
7. Preserve the current rule that the assistant should answer from retrieved content rather than inventing blog facts.

## Suggested Implementation Shape

If work begins on retrieval improvements or RAG, likely touch points are:

- `src/lib/mcp/search-blog-posts.ts`: Upgrade ranking or replace with chunk-aware retrieval.
- `src/lib/mcp/tool-registry.ts`: Register a new retrieval tool.
- `src/lib/mcp/tool-router.ts`: Route semantic content requests to that tool.
- `src/app/api/chat/route.ts`: Pass retrieved excerpts into the LLM prompt safely.
- `src/lib/posts.ts`: Extend post parsing if metadata or section extraction is needed.
- `src/__tests__/`: Add tests for retrieval quality, routing behavior, and grounding guarantees.

## Engineering Guardrails

- Preserve deterministic behavior where possible.
- Avoid replacing simple file-based retrieval with infrastructure-heavy services prematurely.
- Keep grounded-answer guarantees intact.
- Prefer small, testable increments over broad architecture changes.
- Treat RAG as a product need, not a default feature.

## Bottom Line

This codebase does not need full RAG right now to be credible or useful. It already has a clean retrieval-oriented architecture for blog content. The best next step is improving retrieval quality inside the existing design. Full RAG should be added only when semantic search or cross-document grounded answers become an actual requirement.