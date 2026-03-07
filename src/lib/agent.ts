import { getSiteAnalytics } from "@/lib/mcp/get-site-analytics";
import { getAllPosts } from "@/lib/posts";

/**
 * MCP Tool registry — each tool has a name, description, and execute function.
 * The AI agent uses these descriptions to determine which tool to call.
 */

export interface MCPTool {
    name: string;
    description: string;
    execute: (params?: Record<string, unknown>) => Promise<string>;
}

export const toolRegistry: MCPTool[] = [
    {
        name: "getSiteAnalytics",
        description: "Returns visitor analytics for the website including total visitors, page views, and most popular posts.",
        async execute() {
            const analytics = await getSiteAnalytics();
            const topPosts = analytics.mostPopularPosts
                .map((p, i) => `${i + 1}. ${p.title} — ${p.views} views`)
                .join("\n");
            return `📊 Site Analytics:\n• Today's visitors: ${analytics.todayVisitors}\n• Total visitors: ${analytics.totalVisitors}\n• Page views: ${analytics.pageViews}\n\nMost popular posts:\n${topPosts}`;
        },
    },
    {
        name: "getRecentPosts",
        description: "Returns the most recent blog posts from the platform.",
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
        name: "getSystemStatus",
        description: "Returns the current status of the publishing platform including number of posts and system health.",
        async execute() {
            const posts = getAllPosts();
            return `System Status:\n• Posts published: ${posts.length}\n• System: Online\n• API routes: Active\n• Last check: ${new Date().toISOString()}`;
        },
    },
];

/**
 * Determine which tool(s) to call based on the user message.
 * This is a simple keyword-based agent. In production, this would
 * use an LLM to analyze the message and determine tool usage.
 */
export async function agentProcess(message: string): Promise<string> {
    const lower = message.toLowerCase();

    // Try to match a tool
    for (const tool of toolRegistry) {
        const keywords = getToolKeywords(tool.name);
        if (keywords.some((kw) => lower.includes(kw))) {
            try {
                return await tool.execute();
            } catch (error) {
                return `Error executing ${tool.name}: ${error}`;
            }
        }
    }

    // If OPENAI_API_KEY is available, use LLM for intelligent routing
    if (process.env.OPENAI_API_KEY) {
        return await llmAgentProcess(message);
    }

    // Fallback
    return "";
}

function getToolKeywords(toolName: string): string[] {
    const keywordMap: Record<string, string[]> = {
        getSiteAnalytics: ["analytics", "visitors", "traffic", "how many people", "page views"],
        getRecentPosts: ["recent posts", "latest posts", "show posts", "list posts"],
        getSystemStatus: ["system status", "health", "system check", "platform status"],
    };
    return keywordMap[toolName] || [];
}

/**
 * LLM-powered agent that determines tool usage automatically.
 */
async function llmAgentProcess(message: string): Promise<string> {
    const toolDescriptions = toolRegistry
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
                        content: `You are an AI assistant for a publishing platform. You have access to these tools:\n\n${toolDescriptions}\n\nBased on the user's message, respond with ONLY the tool name to call, or "none" if no tool is needed. Just the tool name, nothing else.`,
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
            const tool = toolRegistry.find((t) => t.name === toolChoice);
            if (tool) {
                return await tool.execute();
            }
        }
    } catch (error) {
        console.error("LLM agent error:", error);
    }

    return "";
}
