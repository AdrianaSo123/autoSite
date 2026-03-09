/**
 * MCP Tool: searchBlogPosts
 *
 * Searches blog posts by keyword in title and content.
 * Returns a ranked list of matching post slugs and titles.
 *
 * MCP Tool Definition:
 * {
 *   "name": "searchBlogPosts",
 *   "description": "Search blog posts for a keyword and return matching articles.",
 *   "parameters": { "query": "string" }
 * }
 */

import { getAllPosts } from "@/lib/posts";

export interface SearchResult {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    score: number;
}

/**
 * Search all blog posts for a keyword with relevance ranking.
 * Matches against title, excerpt, and content (case-insensitive).
 * Supports partial word matching and ranks by match quality.
 */
export async function searchBlogPosts(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    const terms = query.toLowerCase().trim().split(/\s+/);
    const posts = getAllPosts();

    const scored: SearchResult[] = [];

    for (const post of posts) {
        let score = 0;
        const titleLower = post.title.toLowerCase();
        const excerptLower = post.excerpt.toLowerCase();
        const contentLower = post.content?.toLowerCase() ?? "";

        for (const term of terms) {
            // Title match (highest weight)
            if (titleLower.includes(term)) score += 10;
            // Excerpt match (medium weight)
            if (excerptLower.includes(term)) score += 5;
            // Content match (lower weight)
            if (contentLower.includes(term)) score += 2;
        }

        // Exact phrase match bonus
        const fullQuery = query.toLowerCase().trim();
        if (titleLower.includes(fullQuery)) score += 15;
        if (excerptLower.includes(fullQuery)) score += 8;

        if (score > 0) {
            scored.push({
                slug: post.slug,
                title: post.title,
                date: post.date,
                excerpt: post.excerpt,
                score,
            });
        }
    }

    // Sort by relevance score (descending)
    return scored.sort((a, b) => b.score - a.score);
}

/**
 * Format search results as a readable string for chat display.
 */
export function formatSearchResults(query: string, results: SearchResult[]): string {
    if (results.length === 0) {
        return `No posts found matching "${query}". Try a different search term.`;
    }

    const list = results
        .map((r, i) => `${i + 1}. **[${r.title}](/blog/${r.slug})** (${r.date})\n   ${r.excerpt}`)
        .join("\n\n");

    return `🔍 Found ${results.length} post(s) matching "${query}":\n\n${list}`;
}
