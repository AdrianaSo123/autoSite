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

const SYSTEM_PROMPT =
    "You are the AI assistant for the Strategic AI Intelligence website. " +
    "Help users explore blog posts and understand AI topics. " +
    "If users ask about blog posts, articles, or topics, search the blog tools before answering. " +
    "Be concise, clear, and practical.";

function buildSuggestions(message: string, reply: string): string[] {
    const messageLower = message.toLowerCase();
    const replyLower = reply.toLowerCase();

    const looksLikeBlogResponse =
        /\/blog\//.test(replyLower) ||
        /recent posts|found\s+\d+\s+post|blog summary|post\(s\)/.test(replyLower) ||
        /(blog|post|article)/.test(messageLower);

    const looksLikeConceptResponse =
        /(explain|what is|how does|concept|difference|agentic|ai)/.test(messageLower) &&
        !looksLikeBlogResponse;

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
            "Explain this more simply",
            "Give real-world examples",
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
    messageForSuggestions?: string
): ChatApiResponse {
    const suggestedActions = messageForSuggestions ? buildSuggestions(messageForSuggestions, reply) : [];

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
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as ChatCompletionPayload;
    const text = payload.choices?.[0]?.message?.content?.trim();
    return text || null;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ChatRequestBody;
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
            logActivity("mcp_tool_executed", { message, isAdmin });
            return NextResponse.json(toResponse(toolResult, "agent_tool_call", message));
        }

        // 2. Fall back to command router (greetings, help, admin, actions)
        const result = await routeCommand(message);

        if (result.handled) {
            const suggestionSource = result.action ? undefined : message;
            return NextResponse.json(toResponse(result.reply, result.action || null, suggestionSource));
        }

        // 3. LLM assistant response with system prompt + multi-turn history
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(toResponse(result.reply, null, message));
        }

        const promptMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: message.slice(0, MAX_MESSAGE_CHARS) },
        ];

        let reply = await requestChatCompletion(PRIMARY_MODEL, promptMessages);
        if (!reply) {
            reply = await requestChatCompletion(FALLBACK_MODEL, promptMessages);
        }

        return NextResponse.json(
            toResponse(
                reply ||
                    "I hit a temporary model issue. Please try again, or ask me to show recent posts.",
                null,
                message
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
