/**
 * MCP Tool Registry
 *
 * Single source of truth for all platform tools.
 * Each tool declares its name, description, access level, and execute function.
 */

import { getAllPosts } from "@/lib/posts";
import { searchBlogPosts, formatSearchResults } from "@/lib/mcp/search-blog-posts";
import { sessionState } from "@/lib/mcp/session";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolAccess = "public" | "admin";

export interface MCPTool {
    name: string;
    description: string;
    access: ToolAccess;
    execute: (params?: Record<string, unknown>) => Promise<string>;
}

// ---------------------------------------------------------------------------
// Defensive wrapper — no tool can crash the API
// ---------------------------------------------------------------------------

async function safeExecute(
    fn: () => Promise<string>,
    toolName: string
): Promise<string> {
    try {
        const result = await fn();
        return result || `${toolName} completed but returned no data.`;
    } catch (error) {
        console.error(`Tool ${toolName} failed:`, error);
        return `⚠️ ${toolName} encountered an error. Please try again.`;
    }
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const toolRegistry: MCPTool[] = [
    {
        name: "listRecentPosts",
        description: "Returns the most recent blog posts from the platform.",
        access: "public",
        execute: () =>
            safeExecute(async () => {
                const posts = getAllPosts();
                if (posts.length === 0) return "No blog posts yet.";
                const topPosts = posts.slice(0, 5);

                // Store results in session for conversational navigation (open 1, open 2)
                sessionState.lastPostResults = topPosts.map((p) => ({
                    title: p.title,
                    slug: p.slug,
                    date: p.date,
                }));

                const list = topPosts
                    .map((p, i) => `${i + 1}. ${p.title}\n   /blog/${p.slug} (${p.date})`)
                    .join("\n\n");
                return `📝 Recent Posts\n\n${list}`;
            }, "listRecentPosts"),
    },
    {
        name: "searchBlogPosts",
        description: "Search blog posts for a keyword and return matching articles.",
        access: "public",
        execute: (params) =>
            safeExecute(async () => {
                const query = (params?.query as string) || "";
                if (!query) return "Please provide a search term.";
                const results = await searchBlogPosts(query);
                return formatSearchResults(query, results);
            }, "searchBlogPosts"),
    },
    {
        name: "getPostSummary",
        description: "Returns a summary of all posts including total count and date range.",
        access: "public",
        execute: () =>
            safeExecute(async () => {
                const posts = getAllPosts();
                if (posts.length === 0) return "No posts available yet.";
                const newest = posts[0].date;
                const oldest = posts[posts.length - 1].date;
                return `📊 **Blog Summary**\n\n• Total posts: **${posts.length}**\n• Newest: ${newest}\n• Oldest: ${oldest}`;
            }, "getPostSummary"),
    },
];

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

export function getToolsForUser(isAdmin: boolean): MCPTool[] {
    if (isAdmin) return toolRegistry;
    return toolRegistry.filter((t) => t.access === "public");
}
