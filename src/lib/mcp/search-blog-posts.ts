/**
 * MCP Tool: searchBlogPosts
 *
 * Searches blog posts by keyword in title and content.
 * Returns a list of matching post slugs and titles.
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
}

/**
 * Search all blog posts for a keyword.
 * Matches against title, excerpt, and content (case-insensitive).
 */
export async function searchBlogPosts(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    const lower = query.toLowerCase().trim();
    const posts = getAllPosts();

    return posts.filter((post) => {
        const titleMatch = post.title.toLowerCase().includes(lower);
        const excerptMatch = post.excerpt.toLowerCase().includes(lower);
        const contentMatch = post.content?.toLowerCase().includes(lower) ?? false;
        return titleMatch || excerptMatch || contentMatch;
    });
}

/**
 * Format search results as a readable string for chat display.
 */
export function formatSearchResults(query: string, results: SearchResult[]): string {
    if (results.length === 0) {
        return `No posts found matching "${query}". Try a different search term.`;
    }

    const list = results
        .map((r, i) => `${i + 1}. **${r.title}** (${r.date})\n   ${r.excerpt}`)
        .join("\n\n");

    return `Found ${results.length} post(s) matching "${query}":\n\n${list}`;
}
