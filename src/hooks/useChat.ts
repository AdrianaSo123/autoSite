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
}

interface UseChatOptions {
    /** Initial system message shown on mount (admin console style) */
    welcomeMessage?: string;
    /** Callback fired on the first user message */
    onFirstMessage?: () => void;
}

interface ChatResponse {
    reply?: string;
    action?: string;
}

interface UseChatReturn {
    messages: ChatMessage[];
    input: string;
    isLoading: boolean;
    isEmpty: boolean;
    setInput: (value: string) => void;
    sendMessage: (text?: string) => Promise<ChatResponse | undefined>;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const { welcomeMessage, onFirstMessage } = options;

    const initialMessages: ChatMessage[] = welcomeMessage
        ? [{ id: "welcome", role: "assistant", content: welcomeMessage, timestamp: new Date() }]
        : [];

    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasNotified, setHasNotified] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null!);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = useCallback(
        async (text?: string) => {
            const content = text || input.trim();
            if (!content || isLoading) return;

            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: "user", content, timestamp: new Date() },
            ]);
            setInput("");
            setIsLoading(true);

            if (!hasNotified && onFirstMessage) {
                onFirstMessage();
                setHasNotified(true);
            }

            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: content }),
                });
                const data: ChatResponse = await response.json();

                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: data.reply || "I'm not sure how to respond to that. Try saying \"help\" to see what I can do.",
                        timestamp: new Date(),
                    },
                ]);

                return data as ChatResponse;
            } catch {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: "Something went wrong. Please try again.",
                        timestamp: new Date(),
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
        },
        [input, isLoading, hasNotified, onFirstMessage]
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

    return {
        messages,
        input,
        isLoading,
        isEmpty: messages.length === 0,
        setInput,
        sendMessage,
        handleKeyDown,
        messagesEndRef,
    };
}
