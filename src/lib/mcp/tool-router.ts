/**
 * Tool Router
 *
 * Determines which MCP tool to invoke for a given user message.
 * Strategy: keyword matching first, LLM fallback second.
 */

import { MCPTool, getToolsForUser } from "@/lib/mcp/tool-registry";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Route a user message to the appropriate tool.
 * Returns the tool's output string, or "" if no tool matched.
 */
export async function routeToTool(
    message: string,
    isAdmin: boolean = false
): Promise<string> {
    const lower = message.toLowerCase();
    const tools = getToolsForUser(isAdmin);

    // 1. Keyword match — fast, deterministic
    for (const tool of tools) {
        if (matchesKeywords(lower, tool.name)) {
            return tool.execute(extractParams(lower, tool.name));
        }
    }

    // 2. LLM fallback — only when API key is available
    if (process.env.OPENAI_API_KEY) {
        return llmToolSelection(message, tools);
    }

    return "";
}

// ---------------------------------------------------------------------------
// Keyword matching
// ---------------------------------------------------------------------------

const KEYWORD_MAP: Record<string, string[]> = {
    listRecentPosts: [
        "recent posts", "latest posts", "show posts", "list posts",
        "what posts", "blog posts", "show me posts", "any posts",
        "what have you published", "what's been published",
    ],
    searchBlogPosts: [
        "search", "find posts", "posts about", "search blog", "search posts",
        "look for", "find articles", "articles about", "do you have posts",
    ],
    getPostSummary: [
        "post summary", "how many posts", "blog summary", "blog stats",
        "post count", "total posts", "overview",
    ],
};

function matchesKeywords(lower: string, toolName: string): boolean {
    const keywords = KEYWORD_MAP[toolName] || [];
    return keywords.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Parameter extraction
// ---------------------------------------------------------------------------

function extractParams(message: string, toolName: string): Record<string, unknown> {
    if (toolName === "searchBlogPosts") {
        const patterns = [
            /posts about (.+)/i,
            /search (?:for |blog )?(.+)/i,
            /find (?:posts )?(?:about )?(.+)/i,
        ];
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) return { query: match[1].trim() };
        }
        return { query: message };
    }
    return {};
}

// ---------------------------------------------------------------------------
// LLM fallback
// ---------------------------------------------------------------------------

async function llmToolSelection(message: string, tools: MCPTool[]): Promise<string> {
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
            if (tool) {
                return tool.execute(extractParams(message.toLowerCase(), tool.name));
            }
        }
    } catch (error) {
        console.error("LLM tool selection error:", error);
        return "⚠️ I had trouble processing that request. Please try again.";
    }

    return "";
}
