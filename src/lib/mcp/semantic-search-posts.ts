/**
 * MCP Tool: semanticSearchPosts
 *
 * Wraps the RAG retrieval engine as an MCP tool.
 * Falls back to keyword search on infrastructure errors.
 */

import { retrieveRelevantChunks, type ScoredChunk } from "@/lib/rag/retrieve";
import { searchBlogPosts, formatSearchResults } from "@/lib/mcp/search-blog-posts";
import { sessionState } from "@/lib/mcp/session";

/**
 * Run a semantic search against the blog post index.
 * Returns a formatted string matching the MCPTool.execute contract.
 */
export async function semanticSearchPosts(query: string): Promise<string> {
    if (!query || query.trim().length === 0) return "Please provide a search term.";

    try {
        const chunks = await retrieveRelevantChunks(query.trim(), 5);

        if (chunks.length === 0) {
            return `No posts found matching "${query}". Try a different search term.`;
        }

        // Populate session state for follow-up commands ("open 1", etc.)
        sessionState.lastPostResults = deduplicatePostRefs(chunks);

        // Store chunk texts for prompt augmentation in chat route
        sessionState.lastRetrievedChunks = chunks.map((c) => c.text);

        return formatSemanticResults(query, chunks);
    } catch (error) {
        // Infrastructure error (API down, index missing) → keyword fallback
        console.error("Semantic search error, falling back to keyword:", error);
        return fallbackToKeyword(query);
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deduplicatePostRefs(chunks: ScoredChunk[]) {
    const seen = new Set<string>();
    return chunks
        .filter((c) => {
            if (seen.has(c.slug)) return false;
            seen.add(c.slug);
            return true;
        })
        .map((c) => ({ title: c.title, slug: c.slug, date: c.date }));
}

function formatSemanticResults(query: string, chunks: ScoredChunk[]): string {
    const posts = new Map<string, { title: string; slug: string; date: string }>();

    for (const chunk of chunks) {
        if (!posts.has(chunk.slug)) {
            posts.set(chunk.slug, {
                title: chunk.title,
                slug: chunk.slug,
                date: chunk.date,
            });
        }
    }

    const entries = Array.from(posts.values());
    const list = entries
        .map((p, i) => `${i + 1}. ${p.title}\n   /blog/${p.slug} (${p.date})`)
        .join("\n\n");

    return `🔍 Found ${entries.length} post(s) related to "${query}":\n\n${list}`;
}

async function fallbackToKeyword(query: string): Promise<string> {
    try {
        const results = await searchBlogPosts(query);
        return formatSearchResults(query, results);
    } catch {
        return `No posts found matching "${query}". Try a different search term.`;
    }
}
