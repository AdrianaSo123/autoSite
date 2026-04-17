import { NextRequest, NextResponse } from "next/server";
import { routeCommand } from "@/lib/commands";
import { routeToTool } from "@/lib/mcp/tool-router";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { sessionState, runWithSession, type PostResultSubset } from "@/lib/mcp/session";

type IncomingMessage = {
    role: "user" | "assistant";
    content: string;
};

type ChatRequestBody = {
    message?: unknown;
    history?: unknown;
    postResults?: unknown;
};

type ChatCompletionPayload = {
    choices?: Array<{ message?: { content?: string } }>;
};

type ChatApiResponse = {
    reply: string;
    message: string;
    action: string | null;
    suggestedActions?: string[];
    postResults?: PostResultSubset[];
};

type SuggestionContext = "blog_results" | "concept" | "about_studio" | "general";

const PRIMARY_MODEL = "gpt-4.1";
const FALLBACK_MODEL = "gpt-4o";
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 1800;
const OPENAI_TIMEOUT_MS = 12000;

const SYSTEM_PROMPT =
    "You are the AI assistant for So Studio — a personal studio exploring ideas about AI, UX, and intelligent systems. " +
    "You can ONLY reference blog posts that have been explicitly returned to you by a tool in this conversation. " +
    "NEVER invent, fabricate, or hallucinate blog post titles, dates, slugs, or content — not even as examples. " +
    "If a user asks about posts on a topic and no tool has returned matching results, say clearly that no posts on that topic have been published yet. " +
    "For blog discovery, guide users to use 'show recent posts' or 'search posts about [topic]' so the tool can fetch real data. " +
    "You may discuss AI concepts, UX, and intelligent systems freely from your own knowledge. " +
    "Maintain continuity with prior turns and resolve follow-up references like 'this', 'that', or 'it' using conversation context. " +
    "Never include URLs, slugs, or /blog/ paths in your responses. " +
    "Be concise, clear, and direct.";

function buildLocalFallbackReply(message: string): string {
    const lower = message.toLowerCase();

    if (/(latest|recent|new|newest)\s+(post|posts|article|articles)/.test(lower)) {
        return "I can help with that right now. Try: **Show recent blog posts** and then **open 1** to jump into the latest article.";
    }

    if (/(search|find|posts?\s+about|blog\s+about|articles?\s+(on|about))/.test(lower) && /(post|posts|blog|article)/.test(lower)) {
        return "I can help you find that. Try phrasing it as **search posts for AI agents** or **search posts for model evaluation**.";
    }

    if (/\b(explain|what is|how does|simplify|simpler|real.world examples?|give.*examples?)\b/.test(lower)) {
        return "I'm not able to answer that at the moment. Try **show recent posts** to browse published writing, or ask me a different question.";
    }

    if (/\b(trend|trending|latest in|new in|recent in)\b/.test(lower)) {
        return "I'm not able to answer that at the moment. Try **search posts about AI** to browse what's been published.";
    }

    return "Try asking me to **show recent posts**, **search posts about a topic**, or ask anything about AI or UX.";
}

function inferSuggestionContext(message: string, reply: string): SuggestionContext {
    const messageLower = message.toLowerCase();
    const replyLower = reply.toLowerCase();

    const hasFetchedPosts = sessionState.lastPostResults.length > 0;

    if (
        hasFetchedPosts &&
        (
            /\/blog\//.test(replyLower) ||
            /recent posts|found\s+\d+\s+post|blog summary|post\(s\)|\d+\.\s+.+\/blog\//.test(replyLower)
        )
    ) {
        return "blog_results";
    }

    // Studio / platform questions
    if (/\b(studio|platform|this site|this app|this tool|what can you do|what do you do|who are you|what is so studio)\b/.test(messageLower)) {
        return "about_studio";
    }

    // AI/tech concept questions — require an actual technical term alongside the question word
    const hasTechTerm = /(agentic|llm|model|rag|transformer|embedding|inference|fine.?tun|agent|vector|neural|diffusion|token|prompt|gpt|claude|gemini|ai|machine learning|deep learning|automation)/.test(messageLower);
    if (hasTechTerm && /(explain|what is|what are|how does|how do|difference|why does|why is|simplify|compare)/.test(messageLower)) {
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
        const posts = sessionState.lastPostResults;
        const postCount = posts.length;
        const openActions = posts
            .slice(0, 3)
            .map((p) => `Open "${p.title}"`);
        if (postCount >= 3) {
            candidates = openActions;
        } else if (postCount === 2) {
            candidates = [...openActions, "Summarize the newest post"];
        } else if (postCount === 1) {
            candidates = [...openActions, "Summarize this post", "Show related AI topics"];
        } else {
            candidates = ["Show recent blog posts", "Search posts about AI", "Explain an AI concept"];
        }
    } else if (context === "about_studio") {
        candidates = [
            "Show recent blog posts",
            "Search posts about AI",
            "What AI topics do you cover?",
        ];
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
    suggestionContext?: SuggestionContext
): ChatApiResponse {
    const suggestedActions = messageForSuggestions
        ? buildSuggestions(messageForSuggestions, reply, suggestionContext)
        : [];

    // Capture post results from the request-scoped session so the client
    // can echo them back on the next request, enabling cross-request
    // session continuity (e.g. "open 1") in serverless environments.
    const postResults = sessionState.lastPostResults;

    return {
        reply,
        message: reply,
        action,
        ...(suggestedActions.length > 0 ? { suggestedActions } : {}),
        ...(postResults.length > 0 ? { postResults } : {}),
    };
}

function normalizePostResults(raw: unknown): PostResultSubset[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .slice(0, 10)
        .map((item) => ({
            title: typeof item.title === "string" ? item.title.slice(0, 200) : "",
            // Sanitize slug — strip any non-safe characters to prevent path traversal
            // via client-echoed postResults
            slug: typeof item.slug === "string"
                ? item.slug.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 200)
                : "",
            date: typeof item.date === "string" ? item.date.slice(0, 20) : "",
        }))
        .filter((item) => item.title && item.slug);
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
                "Keep key facts, remove noise, and do not include any URLs or /blog/ paths in your response. " +
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
    const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
        return NextResponse.json({ reply: "Please send a message." }, { status: 400 });
    }

    const incomingPostResults = normalizePostResults(body.postResults);

    // Wrap the entire handler in a request-scoped session context.
    // This isolates sessionState.lastPostResults to this request only,
    // preventing cross-user contamination and ensuring serverless
    // cold starts always begin with the client-supplied post context.
    return runWithSession(incomingPostResults, async () => {
    try {
        const history = normalizeHistory(body.history);
        const session = await auth();
        const isAdmin = !!session?.user?.isAdmin;

        // 1. Command router first — deterministic, highest priority
        const result = await routeCommand(message);

        if (result) {
            logActivity("command_routed", {
                route: "chat_api",
                action: result.action || "none",
            });
            const suggestionSource = result.action ? undefined : message;
            return NextResponse.json(
                toResponse(result.reply, result.action || null, suggestionSource)
            );
        }

        // 2. MCP tool routing (blog search, post listing)
        let toolResult = "";
        try {
            toolResult = await routeToTool(message, isAdmin, history);
        } catch (error) {
            console.error("Tool routing error:", error);
        }

        // 2b. Blog-intent with no results → grounded "no posts" reply (prevents LLM hallucination).
        // Regex is intentionally narrow: only fire when the message unambiguously
        // seeks blog content. Broad terms like "search" or "find" alone are excluded
        // to avoid false-positives on unrelated questions.
        const hasBlogIntent = /\b(blog|posts?\s+about|articles?\s+about|show\s+posts?|recent\s+posts?|latest\s+posts?|find\s+posts?|search\s+posts?|any\s+posts?|your\s+posts?|your\s+articles?|what\s+have\s+you\s+written|what.{0,30}published)\b/i.test(message);
        if (hasBlogIntent && !toolResult) {
            const noResultReply = "I searched the blog but couldn't find any posts matching that topic. Try **Show recent posts** to see what's been published, or ask about a different topic.";
            return NextResponse.json(toResponse(noResultReply, null, message, "blog_results"));
        }

        if (toolResult) {
            logActivity("mcp_tool_executed", {
                route: "chat_api",
                isAdmin,
                hadHistory: history.length > 0,
            });

            // Extract embedded action (e.g. __ACTION__:set_theme:midnight)
            let embeddedAction: string | null = null;
            let cleanToolResult = toolResult;
            const actionMatch = toolResult.match(/^__ACTION__:([^\n]+)\n/);
            if (actionMatch) {
                embeddedAction = actionMatch[1];
                cleanToolResult = toolResult.slice(actionMatch[0].length);
            }

            const summarized = await summarizeToolResult(message, cleanToolResult, history);
            const reply = summarized || cleanToolResult;

            if (summarized) {
                logActivity("tool_response_summarized", { route: "chat_api" });
            }

            return NextResponse.json(toResponse(reply, embeddedAction ?? "agent_tool_call", message, embeddedAction ? "general" : "blog_results"));
        }

        // 3. LLM assistant response with system prompt + multi-turn history
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                toResponse(
                    buildLocalFallbackReply(message),
                    null,
                    message,
                    inferSuggestionContext(message, buildLocalFallbackReply(message))
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
    }); // end runWithSession
}
