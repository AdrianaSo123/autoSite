"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";

// ---------------------------------------------------------------------------
// Markdown renderer (lightweight — bold + newlines)
// ---------------------------------------------------------------------------

function renderMarkdown(text: string): React.ReactNode {
    const lines = text.split("\n");
    return lines.map((line, i) => {
        // Split by bold chunks
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                const inner = part.slice(2, -2);
                // Check if the bold text contains a link
                const linkMatch = inner.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (linkMatch) {
                    return (
                        <strong key={j} className="font-semibold">
                            <a
                                href={linkMatch[2]}
                                className="underline underline-offset-4 hover:opacity-70 transition-opacity"
                                style={{ color: "var(--ink)" }}
                            >
                                {linkMatch[1]}
                            </a>
                        </strong>
                    );
                }
                return <strong key={j} className="font-semibold">{inner}</strong>;
            }

            // Also handle standard non-bold links embedded in the line
            if (part.includes("[") && part.includes("](")) {
                const linkParts = part.split(/(\[[^\]]+\]\([^)]+\))/g);
                return linkParts.map((subPart, k) => {
                    const match = subPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                    if (match) {
                        return (
                            <a
                                key={`${j}-${k}`}
                                href={match[2]}
                                className="underline underline-offset-4 hover:opacity-70 transition-opacity"
                                style={{ color: "var(--ink)" }}
                            >
                                {match[1]}
                            </a>
                        );
                    }
                    return subPart;
                });
            }

            return part;
        });
        return (
            <span key={i}>
                {rendered}
                {i < lines.length - 1 && <br />}
            </span>
        );
    });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SUGGESTIONS = ["Show recent posts", "What is this project?", "Search posts", "Help"];

interface ChatInterfaceProps {
    onFirstMessage?: () => void;
}

export default function ChatInterface({ onFirstMessage }: ChatInterfaceProps = {}) {
    const { messages, input, isLoading, isEmpty, setInput, sendMessage, handleKeyDown, messagesEndRef } =
        useChat({ onFirstMessage });
    const router = useRouter();

    const handleSend = async (text?: string) => {
        const data = await sendMessage(text);
        if (data?.action === "open_admin_studio") {
            setTimeout(() => router.push("/studio"), 800);
        } else if (data?.action?.startsWith("open_post:")) {
            const indexStr = data.action.split(":")[1];
            const index = parseInt(indexStr, 10);

            // Wait for the DOM to update with the "Opening post..." message,
            // then scan the entire chat history for rendered markdown links
            setTimeout(() => {
                const chatContainer = document.querySelector('[data-testid="chat-container"]');
                if (chatContainer) {
                    const links = chatContainer.querySelectorAll('a[href^="/blog/"]');
                    if (index > 0 && index <= links.length) {
                        const targetUrl = links[index - 1].getAttribute("href");
                        if (targetUrl) router.push(targetUrl);
                    }
                }
            }, 800);
        }
    };

    return (
        <div
            className="w-full flex-1 flex flex-col relative"
            style={{ minHeight: "85vh" }}
            data-testid="chat-container"
        >
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-2 md:px-8 pb-32 space-y-6">
                {/* Hero welcome */}
                {isEmpty && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <div className="flex gap-6 mb-6">
                            <span className="sparkle text-lg" style={{ animationDelay: "0s" }}>✦</span>
                            <span className="sparkle text-sm" style={{ animationDelay: "0.5s" }}>✦</span>
                            <span className="sparkle text-lg" style={{ animationDelay: "1s" }}>✦</span>
                        </div>

                        <h2
                            className="text-4xl md:text-5xl font-semibold mb-6"
                            style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                        >
                            Welcome to AI Platform
                        </h2>

                        <p
                            className="text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
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

                        <div className="flex gap-3 flex-wrap justify-center">
                            {SUGGESTIONS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt)}
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
                            className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-base leading-relaxed ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                                }`}
                            style={{
                                background: msg.role === "user" ? "var(--ink)" : "var(--cream-light)",
                                color: msg.role === "user" ? "var(--cream)" : "var(--ink)",
                                border: msg.role === "assistant" ? "1px solid var(--ink-border)" : "none",
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {renderMarkdown(msg.content)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div
                            className="rounded-2xl rounded-bl-sm px-5 py-4 text-base"
                            style={{
                                background: "var(--cream-light)",
                                border: "1px solid var(--ink-border)",
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

            {/* Input area */}
            <div className="absolute bottom-4 left-0 right-0 px-4 md:px-8 pointer-events-none">
                <div className="max-w-4xl mx-auto flex flex-col gap-2 pointer-events-auto">
                    {!isEmpty && (
                        <div className="flex gap-2 flex-wrap mb-1">
                            {SUGGESTIONS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt)}
                                    className="pill-button-outline text-xs py-1.5 px-3 bg-white"
                                    style={{ borderRadius: "999px", fontSize: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    <div
                        className="p-2 pl-4 flex gap-3 shadow-lg rounded-full"
                        style={{
                            background: "var(--cream-light)",
                            border: "1px solid var(--ink-border)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                        }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What would you like to explore?"
                            className="flex-1 text-base outline-none bg-transparent"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
                            className="pill-button text-sm px-6 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ borderRadius: "999px" }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
