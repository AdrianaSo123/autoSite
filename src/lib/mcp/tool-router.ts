/**
 * Tool Router
 *
 * Determines which MCP tool to invoke for a given user message.
 * Strategy: keyword matching first, LLM fallback second.
 */

import { MCPTool, getToolsForUser } from "@/lib/mcp/tool-registry";
import { sessionState } from "@/lib/mcp/session";

const BLOG_INTENT_TERMS = [
    "blog",
    "post",
    "posts",
    "article",
    "articles",
    "written",
    "writeups",
    "published",
    "publish",
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract a 0-based post index from a message.
 * Handles:
 *   - Explicit digit:  "summarize post 4", "article 2"
 *   - Ordinal:         "4th", "2nd", "1st", "3rd"
 * Returns null if nothing found.
 */
function extractPostIndex(lower: string): number | null {
    // Ordinal first ("4th article", "the 2nd post")
    const ordinalMatch = lower.match(/(\d+)(?:st|nd|rd|th)/);
    if (ordinalMatch) return parseInt(ordinalMatch[1], 10) - 1;
    // Plain digit after post/article keyword
    const digitMatch = lower.match(/(?:post|article)\s*#?\s*(\d+)/);
    if (digitMatch) return parseInt(digitMatch[1], 10) - 1;
    return null;
}

/**
 * Scan conversation history for the most recently mentioned /blog/<slug> and
 * return its index in sessionState.lastPostResults. Falls back to 0.
 */
function findPostIndexFromHistory(
    history: Array<{ role: string; content: string }>
): number {
    const slugRegex = /\/blog\/([-\w]+)/g;
    for (let i = history.length - 1; i >= 0; i--) {
        const found: string[] = [];
        let m: RegExpExecArray | null;
        slugRegex.lastIndex = 0;
        while ((m = slugRegex.exec(history[i].content)) !== null) {
            found.push(m[1]);
        }
        for (let j = found.length - 1; j >= 0; j--) {
            const idx = sessionState.lastPostResults.findIndex((p) => p.slug === found[j]);
            if (idx !== -1) return idx;
        }
    }
    return 0;
}

/**
 * Route a user message to the appropriate tool.
 * Returns the tool's output string, or "" if no tool matched.
 */
export async function routeToTool(
    message: string,
    isAdmin: boolean = false,
    history: Array<{ role: string; content: string }> = []
): Promise<string> {
    const lower = message.toLowerCase();
    const tools = getToolsForUser(isAdmin);

    // 0. Blog-intent fast path for natural requests
    if (containsBlogIntent(lower)) {
        const recentTool = tools.find((t) => t.name === "listRecentPosts");
        if (recentTool && /(recent|latest|new|newest|what have you written)/.test(lower) && !/summarize/.test(lower)) {
            return recentTool.execute();
        }

        const summarizeTool = tools.find((t) => t.name === "summarizePost");
        if (summarizeTool && /summarize/.test(lower)) {
            const extracted = extractPostIndex(lower);
            const index = extracted !== null ? extracted : findPostIndexFromHistory(history);
            return summarizeTool.execute({ index });
        }

        const postSummaryTool = tools.find((t) => t.name === "getPostSummary");
        if (postSummaryTool && matchesKeywords(lower, "getPostSummary")) {
            return postSummaryTool.execute();
        }

        const searchTool = tools.find((t) => t.name === "searchBlogPosts");
        if (searchTool) {
            const cleaned = lower
                .replace(/what have you written about/gi, "")
                .replace(/articles? on/gi, "")
                .replace(/blog about/gi, "")
                .replace(/posts? about/gi, "")
                .replace(/show blog posts?/gi, "")
                .replace(/show posts?/gi, "")
                .trim();

            // Skip if only pronouns/noise remain — show recent posts instead
            const NOISE = new Set(["show", "blog", "post", "posts", "about", "find",
                "search", "this", "that", "it", "these", "those", "the", "a", "an"]);
            const meaningfulWords = cleaned.split(/\s+/).filter(
                (w) => w.length >= 2 && !NOISE.has(w)
            );
            if (meaningfulWords.length === 0) {
                const recentTool2 = tools.find((t) => t.name === "listRecentPosts");
                if (recentTool2) return recentTool2.execute();
                return "";
            }

            return searchTool.execute({ query: meaningfulWords.join(" ") });
        }
    }

    // 1. Theme intent — admin only
    const themeTool = tools.find((t) => t.name === "setTheme");
    if (themeTool && /(?:set|change|use|apply|make)\s+(?:the\s+)?(?:style|theme|it)|\bstyle\b.*\bto\b/.test(lower)) {
        const themeMatch = lower.match(/(?:to|style|theme)\s+(studio|bauhaus|swiss|japanese|noir)/);
        const theme = themeMatch ? themeMatch[1] : "";
        return themeTool.execute({ theme });
    }

    // 2. Keyword match — fast, deterministic
    for (const tool of tools) {
        if (matchesKeywords(lower, tool.name)) {
            return tool.execute(extractParams(lower, tool.name));
        }
    }

    // 2. LLM fallback — only for explicit data-retrieval requests, not conversational follow-ups
    if (process.env.OPENAI_API_KEY) {
        // Skip tool selection for conversational messages (follow-ups, concept questions, examples)
        const isConversational = !containsBlogIntent(lower) &&
            /\b(explain|give|examples?|simplify|simpler|more about|tell me|why|how|what is|what are|real.?world|elaborate|compare|difference)\b/i.test(lower);
        if (isConversational) return "";

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
        "blog about", "articles on", "what have you written about", "written about",
    ],
    getPostSummary: [
        "post summary", "how many posts", "blog summary", "blog stats",
        "post count", "total posts", "overview",
    ],
    summarizePost: [
        "summarize the newest post", "summarize the latest post", "summarize newest post",
        "summarize latest post", "summarize post 1", "summarize post 2", "summarize post 3",
        "summarize the first post",
    ],
    setTheme: [
        "set style", "change style", "change theme", "set theme", "use theme",
        "show styles", "show themes", "list styles", "list themes", "available styles",
    ],
};

function matchesKeywords(lower: string, toolName: string): boolean {
    const keywords = KEYWORD_MAP[toolName] || [];
    return keywords.some((kw) => lower.includes(kw));
}

function containsBlogIntent(lower: string): boolean {
    return BLOG_INTENT_TERMS.some((term) => lower.includes(term));
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
    if (toolName === "summarizePost") {
        const extracted = extractPostIndex(message.toLowerCase());
        return { index: extracted !== null ? extracted : 0 };
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
                        content:
                            `You dispatch user requests to tools for a blog platform.\n\nTOOLS:\n${toolDescriptions}\n\n` +
                            `RULES:\n` +
                            `- ONLY call a tool when the user is explicitly asking to LIST, FIND, SEARCH, or SUMMARIZE published blog posts.\n` +
                            `- Return "out_of_scope" for: follow-up questions, concept explanations, "give examples", "explain more", ` +
                            `"simplify", "tell me about", greetings, or anything not directly requesting blog content.\n` +
                            `- Respond with ONLY the tool name or "out_of_scope". No other text.`,
                    },
                    { role: "user", content: message },
                ],
                temperature: 0,
            }),
        });

        if (!response.ok) return "";

        const data = await response.json();
        const toolChoice = data.choices[0]?.message?.content?.trim();

        if (toolChoice && toolChoice !== "out_of_scope" && toolChoice !== "none") {
            const tool = tools.find((t) => t.name === toolChoice);
            if (tool) {
                return tool.execute(extractParams(message.toLowerCase(), tool.name));
            }
        }

        // out_of_scope or no matching tool — let the main LLM handle it as conversation
        return "";

    } catch (error) {
        console.error("LLM tool selection error:", error);
        return "";
    }
}
