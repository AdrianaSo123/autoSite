"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatInterfaceProps {
    onFirstMessage?: () => void;
}

export default function ChatInterface({ onFirstMessage }: ChatInterfaceProps = {}) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your AI publishing assistant. Ask me anything or try commands like \"Show recent posts\" or \"What is this project?\"",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasNotified, setHasNotified] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
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
                body: JSON.stringify({ message: userMessage.content }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply || "Sorry, I couldn't process that.",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
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

    return (
        <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
                border: '1.5px solid var(--ink-border)',
                background: 'var(--cream-light)',
            }}
        >
            {/* Messages area */}
            <div className="h-[500px] overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                            style={{
                                background: msg.role === "user" ? 'var(--ink)' : 'var(--ink-faint)',
                                color: msg.role === "user" ? 'var(--cream)' : 'var(--ink)',
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
                                background: 'var(--ink-faint)',
                                color: 'var(--text-secondary)',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            ✦ Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            <div
                className="px-5 py-3 flex gap-2 flex-wrap"
                style={{ borderTop: '1px solid var(--ink-faint)' }}
            >
                {["Show recent posts", "What is this?", "Help"].map((prompt) => (
                    <button
                        key={prompt}
                        onClick={() => { setInput(prompt); }}
                        className="pill-button-outline text-xs py-1.5 px-3"
                        style={{ borderRadius: '999px', fontSize: '0.7rem' }}
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Input area */}
            <div
                className="p-4 flex gap-3"
                style={{ borderTop: '1px solid var(--ink-border)' }}
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
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="pill-button text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
