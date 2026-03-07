import { getSiteAnalytics } from "@/lib/mcp/get-site-analytics";
import { getAllPosts } from "@/lib/posts";

/**
 * MCP Tool Registry with access control.
 * Tools are classified as "public" (any visitor) or "admin" (authenticated owner only).
 */

export type ToolAccess = "public" | "admin";

export interface MCPTool {
    name: string;
    description: string;
    access: ToolAccess;
    execute: (params?: Record<string, unknown>) => Promise<string>;
}

export const toolRegistry: MCPTool[] = [
    // ─── PUBLIC TOOLS ────────────────────────────────────────
    {
        name: "listRecentPosts",
        description: "Returns the most recent blog posts from the platform.",
        access: "public",
        async execute() {
            const posts = getAllPosts();
            if (posts.length === 0) return "No blog posts yet.";
            const postList = posts
                .slice(0, 5)
                .map((p, i) => `${i + 1}. ${p.title} (${p.date})`)
                .join("\n");
            return `Recent posts:\n${postList}`;
        },
    },
    {
        name: "searchPosts",
        description: "Searches blog posts by keyword in title or excerpt.",
        access: "public",
        async execute(params) {
            const query = (params?.query as string || "").toLowerCase();
            if (!query) return "Please provide a search term.";
            const posts = getAllPosts();
            const matches = posts.filter(
                (p) =>
                    p.title.toLowerCase().includes(query) ||
                    p.excerpt.toLowerCase().includes(query)
            );
            if (matches.length === 0) return `No posts found matching "${query}".`;
            const list = matches
                .map((p, i) => `${i + 1}. ${p.title} (${p.date})`)
                .join("\n");
            return `Found ${matches.length} post(s):\n${list}`;
        },
    },
    {
        name: "getPostSummary",
        description: "Returns a summary of all posts including total count and date range.",
        access: "public",
        async execute() {
            const posts = getAllPosts();
            if (posts.length === 0) return "No posts available yet.";
            const newest = posts[0].date;
            const oldest = posts[posts.length - 1].date;
            return `Blog summary:\n• Total posts: ${posts.length}\n• Newest: ${newest}\n• Oldest: ${oldest}`;
        },
    },

    // ─── ADMIN TOOLS ─────────────────────────────────────────
    {
        name: "getSiteAnalytics",
        description: "Returns visitor analytics for the website including total visitors, page views, and most popular posts.",
        access: "admin",
        async execute() {
            const analytics = await getSiteAnalytics();
            const topPosts = analytics.mostPopularPosts
                .map((p, i) => `${i + 1}. ${p.title} — ${p.views} views`)
                .join("\n");
            return `📊 Site Analytics:\n• Today's visitors: ${analytics.todayVisitors}\n• Total visitors: ${analytics.totalVisitors}\n• Page views: ${analytics.pageViews}\n\nMost popular posts:\n${topPosts}`;
        },
    },
    {
        name: "getSystemStatus",
        description: "Returns the current status of the publishing platform including number of posts and system health.",
        access: "admin",
        async execute() {
            const posts = getAllPosts();
            return `System Status:\n• Posts published: ${posts.length}\n• System: Online\n• API routes: Active\n• Last check: ${new Date().toISOString()}`;
        },
    },
];

/**
 * Get tools available for a given access level.
 * Public users get only public tools. Admin gets all tools.
 */
export function getToolsForUser(isAdmin: boolean): MCPTool[] {
    if (isAdmin) return toolRegistry;
    return toolRegistry.filter((t) => t.access === "public");
}

/**
 * Determine which tool to call based on the user message and access level.
 */
export async function agentProcess(
    message: string,
    isAdmin: boolean = false
): Promise<string> {
    const lower = message.toLowerCase();
    const availableTools = getToolsForUser(isAdmin);

    // Try to match a tool by keywords
    for (const tool of availableTools) {
        const keywords = getToolKeywords(tool.name);
        if (keywords.some((kw) => lower.includes(kw))) {
            try {
                return await tool.execute();
            } catch (error) {
                return `Error executing ${tool.name}: ${error}`;
            }
        }
    }

    // If OPENAI_API_KEY is available and user is admin, use LLM routing
    if (process.env.OPENAI_API_KEY && isAdmin) {
        return await llmAgentProcess(message, availableTools);
    }

    return "";
}

function getToolKeywords(toolName: string): string[] {
    const keywordMap: Record<string, string[]> = {
        listRecentPosts: ["recent posts", "latest posts", "show posts", "list posts"],
        searchPosts: ["search", "find posts", "posts about"],
        getPostSummary: ["post summary", "how many posts", "blog summary"],
        getSiteAnalytics: ["analytics", "visitors", "traffic", "how many people", "page views"],
        getSystemStatus: ["system status", "health", "system check", "platform status"],
    };
    return keywordMap[toolName] || [];
}

async function llmAgentProcess(message: string, tools: MCPTool[]): Promise<string> {
    const toolDescriptions = tools
        .map((t) => `- ${t.name}: ${t.description}`)
        .join("\n");

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an AI assistant for a publishing platform. You have access to these tools:\n\n${toolDescriptions}\n\nBased on the user's message, respond with ONLY the tool name to call, or "none" if no tool is needed.`,
                    },
                    { role: "user", content: message },
                ],
                temperature: 0,
            }),
        });

        if (!response.ok) return "";

        const data = await response.json();
        const toolChoice = data.choices[0]?.message?.content?.trim();

        if (toolChoice && toolChoice !== "none") {
            const tool = tools.find((t) => t.name === toolChoice);
            if (tool) return await tool.execute();
        }
    } catch (error) {
        console.error("LLM agent error:", error);
    }

    return "";
}
