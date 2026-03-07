"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatInterfaceProps {
    onFirstMessage?: () => void;
}

const SUGGESTIONS = ["Show recent posts", "What is this project?", "Help"];

export default function ChatInterface({ onFirstMessage }: ChatInterfaceProps = {}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasNotified, setHasNotified] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const content = text || input.trim();
        if (!content || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Notify parent on first user message
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

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply || "Sorry, I couldn't process that.",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            if (data.action === "open_admin_studio") {
                // Short delay to let the message render before redirect
                setTimeout(() => {
                    router.push("/studio");
                }, 800);
            }
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
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div
            className="w-full rounded-2xl overflow-hidden flex flex-col"
            style={{
                border: "1.5px solid var(--ink-border)",
                background: "var(--cream-light)",
                minHeight: "85vh",
            }}
            data-testid="chat-container"
        >
            {/* Messages area — grows to fill */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {/* ✦ Hero welcome — shown only when no conversation */}
                {isEmpty && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <div className="flex gap-6 mb-6">
                            <span className="sparkle text-lg" style={{ animationDelay: "0s" }}>✦</span>
                            <span className="sparkle text-sm" style={{ animationDelay: "0.5s" }}>✦</span>
                            <span className="sparkle text-lg" style={{ animationDelay: "1s" }}>✦</span>
                        </div>

                        <h2
                            className="text-3xl md:text-4xl font-semibold mb-4"
                            style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                        >
                            Welcome to AI Platform
                        </h2>

                        <p
                            className="text-base max-w-md mx-auto mb-2 leading-relaxed"
                            style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
                        >
                            A conversational publishing platform that transforms
                            voice recordings into written articles.
                        </p>

                        <p
                            className="text-sm mb-8 italic"
                            style={{ color: "var(--text-secondary)", fontFamily: "'Playfair Display', serif" }}
                        >
                            Ask me anything to get started.
                        </p>

                        {/* Prompt suggestions inside hero */}
                        <div className="flex gap-3 flex-wrap justify-center">
                            {SUGGESTIONS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => sendMessage(prompt)}
                                    className="pill-button-outline text-sm py-2 px-5"
                                    style={{ borderRadius: "999px" }}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat messages */}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                            style={{
                                background: msg.role === "user" ? "var(--ink)" : "var(--ink-faint)",
                                color: msg.role === "user" ? "var(--cream)" : "var(--ink)",
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div
                            className="rounded-2xl px-4 py-2.5 text-sm"
                            style={{
                                background: "var(--ink-faint)",
                                color: "var(--text-secondary)",
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            ✦ Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Prompt suggestions — shown below messages when conversation has started */}
            {!isEmpty && (
                <div
                    className="px-5 py-3 flex gap-2 flex-wrap"
                    style={{ borderTop: "1px solid var(--ink-faint)" }}
                >
                    {SUGGESTIONS.map((prompt) => (
                        <button
                            key={prompt}
                            onClick={() => sendMessage(prompt)}
                            className="pill-button-outline text-xs py-1.5 px-3"
                            style={{ borderRadius: "999px", fontSize: "0.7rem" }}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input area */}
            <div
                className="p-4 flex gap-3"
                style={{ borderTop: "1px solid var(--ink-border)" }}
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What would you like to explore?"
                    className="pill flex-1 text-sm"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    disabled={isLoading}
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="pill-button text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
