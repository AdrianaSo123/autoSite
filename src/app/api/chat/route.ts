import { NextRequest, NextResponse } from "next/server";
import { routeCommand } from "@/lib/commands";
import { routeToTool } from "@/lib/mcp/tool-router";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

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

function buildSuggestions(message: string, reply: string, history: IncomingMessage[] = []): string[] {
    const messageLower = message.toLowerCase();
    const replyLower = reply.toLowerCase();
    const historyText = history
        .slice(-6)
        .map((m) => m.content.toLowerCase())
        .join(" ");
    const contextText = `${messageLower} ${historyText}`;

    const looksLikeBlogResponse =
        /\/blog\//.test(replyLower) ||
        /recent posts|found\s+\d+\s+post|blog summary|post\(s\)|\d+\.\s+.+\/blog\//.test(replyLower) ||
        /(blog|post|article)/.test(contextText);

    const looksLikeConceptResponse =
        /(explain|what is|how does|concept|difference|agentic|ai|llm|model)/.test(contextText) &&
        !looksLikeBlogResponse;

    const looksGeneralQuestion =
        /(what|why|how|should|can|could|would)/.test(contextText) &&
        !looksLikeBlogResponse &&
        !looksLikeConceptResponse;

    let candidates: string[];

    if (looksLikeBlogResponse) {
        candidates = [
            "Summarize the newest post",
            "Show related AI topics",
            "Explain this concept simply",
        ];
    } else if (looksLikeConceptResponse) {
        candidates = [
            "Show blog posts about this",
            "Give real-world examples",
            "Explain this more simply",
        ];
    } else if (looksGeneralQuestion) {
        candidates = [
            "Show recent blog posts",
            "Show related AI topics",
            "Give a practical next step",
        ];
    } else {
        candidates = [
            "Show recent blog posts",
            "Show related AI topics",
            "Explain this concept simply",
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
    historyForSuggestions: IncomingMessage[] = []
): ChatApiResponse {
    const suggestedActions = messageForSuggestions
        ? buildSuggestions(messageForSuggestions, reply, historyForSuggestions)
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

        // 1. Try MCP tool routing (keyword + LLM)
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

            return NextResponse.json(toResponse(reply, "agent_tool_call", message, history));
        }

        // 2. Fall back to command router (greetings, help, admin, actions)
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

        // 3. LLM assistant response with system prompt + multi-turn history
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                toResponse(
                    "I can help with blog discovery and AI topics. Try asking for recent posts or an explanation of a concept.",
                    null,
                    message,
                    history
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
                history
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
