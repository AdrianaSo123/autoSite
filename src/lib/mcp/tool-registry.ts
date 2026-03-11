/**
 * MCP Tool Registry
 *
 * Single source of truth for all platform tools.
 * Each tool declares its name, description, access level, and execute function.
 */

import { getAllPosts } from "@/lib/posts";
import { searchBlogPosts, formatSearchResults } from "@/lib/mcp/search-blog-posts";
import { sessionState } from "@/lib/mcp/session";
import { THEMES, type ThemeName } from "@/lib/theme";

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
    {
        name: "summarizePost",
        description: "Return the full content of a specific post from recent results so it can be summarized.",
        access: "public",
        execute: (params) =>
            safeExecute(async () => {
                const index = typeof params?.index === "number" ? params.index : 0;
                let postRef = sessionState.lastPostResults[index];

                // Auto-load posts if session is empty
                if (!postRef) {
                    const allPosts = getAllPosts();
                    if (allPosts.length === 0) return "No posts available yet.";
                    const topPosts = allPosts.slice(0, 5);
                    sessionState.lastPostResults = topPosts.map((p) => ({
                        title: p.title,
                        slug: p.slug,
                        date: p.date,
                    }));
                    postRef = sessionState.lastPostResults[index];
                }

                if (!postRef) {
                    return `Only ${sessionState.lastPostResults.length} post(s) available. Try a lower number.`;
                }

                const allPosts = getAllPosts();
                const post = allPosts.find((p) => p.slug === postRef.slug);
                if (!post) return `Could not load content for "${postRef.title}".`;
                const content = post.content?.slice(0, 3000).trim() ?? post.excerpt;
                return `📄 **${post.title}** (${post.date})\n\n${content}\n\n[Read full post →](/blog/${post.slug})`;
            }, "summarizePost"),
    },
];

// Admin-only tools (appended separately for clarity)
toolRegistry.push(
    {
        name: "setTheme",
        description: "Change the visual style/theme of the site. Available themes: studio, midnight, forest, rose, minimal, sand, bauhaus, noir, deco, swiss, memphis, nordic, japanese.",
        access: "admin" as ToolAccess,
        execute: (params) =>
            safeExecute(async () => {
                const theme = (params?.theme as string || "").toLowerCase().trim() as ThemeName;
                if (!theme) {
                    const list = Object.entries(THEMES)
                        .map(([key, val]) => `• **${val.label}** (${key}) — ${val.description}`)
                        .join("\n");
                    return `Available styles:\n\n${list}\n\nSay **"set style to [name]"** to apply one.`;
                }
                if (!(theme in THEMES)) {
                    const names = Object.keys(THEMES).join(", ");
                    return `Unknown theme "${theme}". Available: ${names}.`;
                }
                const info = THEMES[theme];
                return `__ACTION__:set_theme:${theme}\nSwitching to **${info.label}** — ${info.description}.`;
            }, "setTheme"),
    }
);

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

export function getToolsForUser(isAdmin: boolean): MCPTool[] {
    if (isAdmin) return toolRegistry;
    return toolRegistry.filter((t) => t.access === "public");
}
