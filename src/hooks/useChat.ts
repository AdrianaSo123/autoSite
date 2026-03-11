"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    suggestedActions?: string[];
}

interface UseChatOptions {
    /** Initial system message shown on mount (admin console style) */
    welcomeMessage?: string;
    /** Callback fired on the first user message */
    onFirstMessage?: () => void;
    /** Callback fired when the API returns an actionable command */
    onAction?: (action: string) => void;
}

interface ChatResponse {
    reply?: string;
    message?: string;
    action?: string;
    suggestedActions?: string[];
}

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 1800;

interface UseChatReturn {
    messages: ChatMessage[];
    input: string;
    isLoading: boolean;
    loadingText: string;
    isEmpty: boolean;
    setInput: (value: string) => void;
    sendMessage: (text?: string) => Promise<ChatResponse | undefined>;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    clearChat: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const CHAT_STORAGE_KEY = "so_studio_chat_history";

function loadStoredMessages(): ChatMessage[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as Array<Omit<ChatMessage, "timestamp"> & { timestamp: string }>;
        return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
        return [];
    }
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const { welcomeMessage, onFirstMessage, onAction } = options;

    const initialMessages: ChatMessage[] = welcomeMessage
        ? [{ id: "welcome", role: "assistant", content: welcomeMessage, timestamp: new Date() }]
        : [];

    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasNotified, setHasNotified] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null!);

    // After mount, restore from localStorage (avoids SSR hydration mismatch)
    useEffect(() => {
        const stored = loadStoredMessages();
        if (stored.length > 0) {
            setMessages(stored);
        }
        setHydrated(true);
    }, []);

    // Persist messages to localStorage whenever they change (only after hydration)
    useEffect(() => {
        if (!hydrated) return;
        if (messages.length > 0) {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, hydrated]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const appendAssistantMessage = useCallback(
        (content: string, suggestedActions?: string[]) => {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content,
                    timestamp: new Date(),
                    suggestedActions,
                },
            ]);
        },
        []
    );

    const sendMessage = useCallback(
        async (text?: string) => {
            const content = text || input.trim();
            if (!content || isLoading) return;

            setMessages((prev) => [
                ...prev.map((m) => ({
                    ...m,
                    suggestedActions: m.role === "assistant" ? undefined : m.suggestedActions,
                })),
                { id: Date.now().toString(), role: "user", content, timestamp: new Date() },
            ]);
            setInput("");
            setIsLoading(true);

            const history = messages
                .slice(-MAX_HISTORY_MESSAGES)
                .map((m) => ({
                    role: m.role,
                    content: m.content.slice(0, MAX_MESSAGE_CHARS),
                }));

            if (!hasNotified && onFirstMessage) {
                onFirstMessage();
                setHasNotified(true);
            }

            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: content.slice(0, MAX_MESSAGE_CHARS),
                        history,
                    }),
                });
                const data: ChatResponse = await response.json();

                appendAssistantMessage(
                    data.reply ||
                        data.message ||
                        "I'm not sure how to respond to that. Try saying \"help\" to see what I can do.",
                    data.suggestedActions?.slice(0, 3)
                );

                if (data.action && onAction) {
                    onAction(data.action);
                }

                return data as ChatResponse;
            } catch {
                appendAssistantMessage("Something went wrong. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
        [input, isLoading, hasNotified, messages, onFirstMessage, onAction, appendAssistantMessage]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        },
        [sendMessage]
    );

    const [loadingText, setLoadingText] = useState("✦ Thinking...");

    // Cycle loading text when active
    useEffect(() => {
        if (!isLoading) {
            setLoadingText("✦ Thinking...");
            return;
        }

        const phrases = [
            "✦ Thinking...",
            "✦ Connecting...",
            "✦ Analyzing context...",
            "✦ Drafting response...",
            "✦ Securing publishing studio...",
        ];

        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % phrases.length;
            setLoadingText(phrases[i]);
        }, 3000);

        return () => clearInterval(interval);
    }, [isLoading]);

    const clearChat = useCallback(() => {
        localStorage.removeItem(CHAT_STORAGE_KEY);
        setMessages([]);
        setInput("");
        setHasNotified(false);
    }, []);

    return {
        messages,
        input,
        isLoading,
        loadingText,
        isEmpty: messages.length === 0,
        setInput,
        sendMessage,
        handleKeyDown,
        clearChat,
        messagesEndRef,
    };
}
