import { NextRequest, NextResponse } from "next/server";
import { routeCommand } from "@/lib/commands";
import { routeToTool } from "@/lib/mcp/tool-router";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { sessionState } from "@/lib/mcp/session";

type IncomingMessage = {
    role: "user" | "assistant";
    content: string;
};

type ChatRequestBody = {
    message?: unknown;
    history?: unknown;
};

type ChatCompletionPayload = {
    choices?: Array<{ message?: { content?: string } }>;
};

type ChatApiResponse = {
    reply: string;
    message: string;
    action: string | null;
    suggestedActions?: string[];
};

type SuggestionContext = "blog_results" | "concept" | "general";

const PRIMARY_MODEL = "gpt-4.1";
const FALLBACK_MODEL = "gpt-4o";
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 1800;
const OPENAI_TIMEOUT_MS = 12000;

const SYSTEM_PROMPT =
    "You are the AI assistant for the Strategic AI Intelligence website. " +
    "Help users explore blog posts and understand AI topics. " +
    "If users ask about blog posts, articles, or topics, search the blog tools before answering. " +
    "Maintain continuity with prior turns and resolve follow-up references like 'this', 'that', or 'it' using conversation context. " +
    "When sharing tool-derived information, present it as a concise, readable summary. " +
    "Be concise, clear, and practical.";

function buildLocalFallbackReply(message: string, _history: IncomingMessage[]): string {
    const lower = message.toLowerCase();

    if (/(latest|recent|new|newest)\s+(post|posts|article|articles)/.test(lower)) {
        return "I can help with that right now. Try: **Show recent blog posts** and then **open 1** to jump into the latest article.";
    }

    if (/(search|find|posts?\s+about|blog\s+about|articles?\s+(on|about))/.test(lower) && /(post|posts|blog|article)/.test(lower)) {
        return "I can help you find that. Try phrasing it as **search posts for AI agents** or **search posts for model evaluation**.";
    }

    if (/\b(explain|what is|how does|simplify|simpler|real.world examples?|give.*examples?)\b/.test(lower)) {
        return "To answer follow-up questions I need a live LLM connection. Make sure `OPENAI_API_KEY` is set in `.env.local` and restart the dev server.";
    }

    if (/\b(trend|trending|latest in|new in|recent in)\b/.test(lower)) {
        return "For live AI trend questions I need an LLM connection. You can also try **search posts for AI** to browse published posts.";
    }

    return "I can help with blog discovery and AI topics. Ask me to **show recent blog posts**, **search posts about a topic**, or **explain an AI concept**.";
}

function inferSuggestionContext(message: string, reply: string): SuggestionContext {
    const messageLower = message.toLowerCase();
    const replyLower = reply.toLowerCase();

    if (
        /\/blog\//.test(replyLower) ||
        /recent posts|found\s+\d+\s+post|blog summary|post\(s\)|\d+\.\s+.+\/blog\//.test(replyLower) ||
        /(blog|post|article)/.test(messageLower)
    ) {
        return "blog_results";
    }

    if (/(explain|what is|how does|concept|difference|agentic|ai|llm|model)/.test(messageLower)) {
        return "concept";
    }

    return "general";
}

function buildSuggestions(
    message: string,
    reply: string,
    context: SuggestionContext = inferSuggestionContext(message, reply)
): string[] {
    const messageLower = message.toLowerCase();

    let candidates: string[];

    if (context === "blog_results") {
        const postCount = sessionState.lastPostResults.length;
        candidates = postCount >= 3
            ? ["Open post 1", "Open post 2", "Open post 3"]
            : postCount === 2
            ? ["Open post 1", "Open post 2", "Summarize the newest post"]
            : ["Open post 1", "Summarize the newest post", "Show related AI topics"];
    } else if (context === "concept") {
        candidates = [
            "Show blog posts about this",
            "Give real-world examples",
            "Explain this more simply",
        ];
    } else {
        candidates = [
            "Show recent blog posts",
            "Show related AI topics",
            "Give a practical next step",
        ];
    }

    const deduped = candidates.filter((item, index, arr) => {
        return arr.findIndex((v) => v.toLowerCase() === item.toLowerCase()) === index;
    });

    return deduped
        .filter((item) => item.toLowerCase() !== messageLower.trim())
        .slice(0, 3);
}

function toResponse(
    reply: string,
    action: string | null = null,
    messageForSuggestions?: string,
    _historyForSuggestions: IncomingMessage[] = [],
    suggestionContext?: SuggestionContext
): ChatApiResponse {
    const suggestedActions = messageForSuggestions
        ? buildSuggestions(messageForSuggestions, reply, suggestionContext)
        : [];

    return {
        reply,
        message: reply,
        action,
        ...(suggestedActions.length > 0 ? { suggestedActions } : {}),
    };
}

function normalizeHistory(raw: unknown): IncomingMessage[] {
    if (!Array.isArray(raw)) return [];

    const normalized = raw
        .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
        .map((m) => {
            const role = m.role === "assistant" ? "assistant" : m.role === "user" ? "user" : null;
            const content = typeof m.content === "string" ? m.content.trim() : "";
            return role && content
                ? { role, content: content.slice(0, MAX_MESSAGE_CHARS) }
                : null;
        })
        .filter((m): m is IncomingMessage => m !== null);

    return normalized.slice(-MAX_HISTORY_MESSAGES);
}

async function requestChatCompletion(
    model: string,
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.3,
            }),
            signal: controller.signal,
        });

        if (!response.ok) return null;

        const payload = (await response.json()) as ChatCompletionPayload;
        const text = payload.choices?.[0]?.message?.content?.trim();
        return text || null;
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

async function summarizeToolResult(
    userMessage: string,
    toolResult: string,
    history: IncomingMessage[]
): Promise<string | null> {
    if (!process.env.OPENAI_API_KEY) return null;

    const summaryMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        {
            role: "system",
            content:
                "Summarize tool output for an end user in 2-5 short lines. " +
                "Keep key facts, remove noise, and preserve links/paths when present. " +
                "Do not invent data.",
        },
        ...history.slice(-4),
        {
            role: "user",
            content:
                `User request: ${userMessage}\n\n` +
                `Tool output:\n${toolResult.slice(0, 4000)}`,
        },
    ];

    let summary = await requestChatCompletion(PRIMARY_MODEL, summaryMessages);
    if (!summary) {
        logActivity("llm_fallback_used", { stage: "tool_summary", reason: "primary_failed" });
        summary = await requestChatCompletion(FALLBACK_MODEL, summaryMessages);
    }
    return summary;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
        const message = typeof body.message === "string" ? body.message.trim() : "";

        if (!message) {
            return NextResponse.json({ reply: "Please send a message." }, { status: 400 });
        }

        const history = normalizeHistory(body.history);
        const session = await auth();
        const isAdmin = !!session?.user;

        // 1. Command router first — deterministic, highest priority
        const result = await routeCommand(message);

        if (result) {
            logActivity("command_routed", {
                route: "chat_api",
                action: result.action || "none",
            });
            const suggestionSource = result.action ? undefined : message;
            return NextResponse.json(
                toResponse(result.reply, result.action || null, suggestionSource, history)
            );
        }

        // 2. MCP tool routing (blog search, post listing)
        let toolResult = "";
        try {
            toolResult = await routeToTool(message, isAdmin);
        } catch (error) {
            console.error("Tool routing error:", error);
        }

        if (toolResult) {
            logActivity("mcp_tool_executed", {
                route: "chat_api",
                isAdmin,
                hadHistory: history.length > 0,
            });

            const summarized = await summarizeToolResult(message, toolResult, history);
            const reply = summarized || toolResult;

            if (summarized) {
                logActivity("tool_response_summarized", { route: "chat_api" });
            }

            return NextResponse.json(toResponse(reply, "agent_tool_call", message, history, "blog_results"));
        }

        // 3. LLM assistant response with system prompt + multi-turn history
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                toResponse(
                    buildLocalFallbackReply(message, history),
                    null,
                    message,
                    history,
                    inferSuggestionContext(message, buildLocalFallbackReply(message, history))
                )
            );
        }

        const promptMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: message.slice(0, MAX_MESSAGE_CHARS) },
        ];

        let reply = await requestChatCompletion(PRIMARY_MODEL, promptMessages);
        if (!reply) {
            logActivity("llm_fallback_used", { stage: "chat_reply", reason: "primary_failed" });
            reply = await requestChatCompletion(FALLBACK_MODEL, promptMessages);
        }

        return NextResponse.json(
            toResponse(
                reply ||
                    "I hit a temporary model issue. Please try again, or ask me to show recent posts.",
                null,
                message,
                history,
                inferSuggestionContext(
                    message,
                    reply ||
                        "I hit a temporary model issue. Please try again, or ask me to show recent posts."
                )
            )
        );
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            { reply: "Something went wrong. Please try again or say \"help\" for available commands." },
            { status: 500 }
        );
    }
}
