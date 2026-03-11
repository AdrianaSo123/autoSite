"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";

// ---------------------------------------------------------------------------
// Markdown renderer (lightweight — bold + newlines)
// ---------------------------------------------------------------------------

function renderMarkdown(
    text: string,
    onInternalLink?: (href: string) => void
): React.ReactNode {
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
                    const href = linkMatch[2];
                    const isInternal = href.startsWith("/");
                    return (
                        <strong key={j} className="font-semibold">
                            <a
                                href={href}
                                className="underline underline-offset-4 hover:opacity-70 transition-opacity"
                                style={{ color: "var(--ink)" }}
                                {...(!isInternal ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                                onClick={(e) => {
                                    if (isInternal && onInternalLink) {
                                        e.preventDefault();
                                        onInternalLink(href);
                                    }
                                }}
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
                        const href = match[2];
                        const isInternal = href.startsWith("/");
                        return (
                            <a
                                key={`${j}-${k}`}
                                href={href}
                                className="underline underline-offset-4 hover:opacity-70 transition-opacity"
                                style={{ color: "var(--ink)" }}
                                {...(!isInternal ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                                onClick={(e) => {
                                    if (isInternal && onInternalLink) {
                                        e.preventDefault();
                                        onInternalLink(href);
                                    }
                                }}
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

const SUGGESTIONS = [
    "Show recent posts",
    "Ask about AI",
    "What is this studio?",
];

interface ChatInterfaceProps {
    onFirstMessage?: () => void;
}

export default function ChatInterface({ onFirstMessage }: ChatInterfaceProps = {}) {
    const router = useRouter();
    const { messages, input, isLoading, loadingText, isEmpty, setInput, sendMessage, handleKeyDown, clearChat, messagesEndRef } =
        useChat({
            onFirstMessage,
            onAction: (action) => {
                if (action === "open_admin_studio") {
                    setTimeout(() => router.push("/studio"), 800);
                } else if (action.startsWith("open_post:")) {
                    const targetUrl = action.substring("open_post:".length);
                    setTimeout(() => router.push(targetUrl), 800);
                }
            }
        });

    const handleSend = (text?: string) => {
        sendMessage(text);
    };

    const renderStarterPrompts = ({ compact }: { compact: boolean }) => (
        <div className={`flex flex-wrap ${compact ? "gap-2 mb-1" : "gap-3 justify-center"}`}>
            {SUGGESTIONS.map((prompt) => (
                <button
                    key={`${compact ? "compact" : "hero"}-${prompt}`}
                    onClick={() => handleSend(prompt)}
                    className={`pill-button-outline ${compact ? "text-xs py-1.5 px-3 bg-white" : "text-sm py-2 px-5"}`}
                    style={{
                        borderRadius: "999px",
                        ...(compact
                            ? { fontSize: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }
                            : {}),
                    }}
                >
                    {prompt}
                </button>
            ))}
        </div>
    );

    const lastAssistantIndex = (() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "assistant") return i;
        }
        return -1;
    })();

    const conversationContinued = messages.length > 0 && messages[messages.length - 1].role === "user";

    return (
        <div
            className="w-full flex-1 flex flex-col relative"
            style={{ minHeight: "85vh" }}
            data-testid="chat-container"
        >
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-2 md:px-8 pb-40 space-y-6">
                {/* Hero welcome */}
                {isEmpty && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16 relative">
                        {/* Decorative vase — left */}
                        <div className="hidden md:block absolute left-0 top-8 opacity-25 pointer-events-none select-none" style={{ color: "var(--ink)" }}>
                            <svg width="110" height="190" viewBox="0 0 110 190" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: "var(--ink)" }}>
                                {/* Neck rim */}
                                <ellipse cx="55" cy="18" rx="14" ry="5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                                {/* Neck */}
                                <path d="M41 18 C38 28 35 35 30 50" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                                <path d="M69 18 C72 28 75 35 80 50" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                                {/* Shoulder band */}
                                <path d="M29 52 Q55 44 81 52" stroke="currentColor" strokeWidth="1" fill="none"/>
                                {/* Body */}
                                <path d="M30 50 C18 70 14 95 16 118 C18 145 28 165 40 175 C46 179 51 181 55 181 C59 181 64 179 70 175 C82 165 92 145 94 118 C96 95 92 70 80 50 Z" stroke="currentColor" strokeWidth="1.4" fill="none"/>
                                {/* Central floral circle */}
                                <circle cx="55" cy="112" r="22" stroke="currentColor" strokeWidth="0.9" fill="none"/>
                                {/* Flower petals */}
                                <ellipse cx="55" cy="91" rx="6" ry="11" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                                <ellipse cx="55" cy="133" rx="6" ry="11" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                                <ellipse cx="34" cy="112" rx="11" ry="6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                                <ellipse cx="76" cy="112" rx="11" ry="6" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                                <ellipse cx="40" cy="97" rx="7" ry="12" transform="rotate(45 40 97)" stroke="currentColor" strokeWidth="0.7" fill="none"/>
                                <ellipse cx="70" cy="97" rx="7" ry="12" transform="rotate(-45 70 97)" stroke="currentColor" strokeWidth="0.7" fill="none"/>
                                <ellipse cx="40" cy="127" rx="7" ry="12" transform="rotate(-45 40 127)" stroke="currentColor" strokeWidth="0.7" fill="none"/>
                                <ellipse cx="70" cy="127" rx="7" ry="12" transform="rotate(45 70 127)" stroke="currentColor" strokeWidth="0.7" fill="none"/>
                                {/* Center dot */}
                                <circle cx="55" cy="112" r="4" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                                {/* Small leaves on shoulder */}
                                <path d="M36 62 C32 57 30 52 36 50 C39 53 38 59 36 62Z" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                                <path d="M74 62 C78 57 80 52 74 50 C71 53 72 59 74 62Z" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                                {/* Dot row above base */}
                                <circle cx="44" cy="158" r="1.8" fill="currentColor"/>
                                <circle cx="55" cy="161" r="1.8" fill="currentColor"/>
                                <circle cx="66" cy="158" r="1.8" fill="currentColor"/>
                                {/* Base band */}
                                <path d="M40 175 Q55 181 70 175" stroke="currentColor" strokeWidth="1" fill="none"/>
                                <ellipse cx="55" cy="179" rx="15" ry="5" stroke="currentColor" strokeWidth="1" fill="none"/>
                            </svg>
                        </div>

                        {/* Decorative bowls — right */}
                        <div className="hidden md:block absolute right-0 top-16 opacity-25 pointer-events-none select-none" style={{ color: "var(--ink)" }}>
                            <svg width="90" height="170" viewBox="0 0 90 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Top teacup */}
                                <path d="M22 20 Q45 13 68 20 Q72 38 70 46 Q56 54 45 54 Q34 54 20 46 Q18 38 22 20Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                                <ellipse cx="45" cy="20" rx="23" ry="7" stroke="currentColor" strokeWidth="1" fill="none"/>
                                <path d="M25 44 Q45 50 65 44" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                                <ellipse cx="45" cy="48" rx="20" ry="5" stroke="currentColor" strokeWidth="1" fill="none"/>
                                {/* Leaf motif on teacup */}
                                <path d="M38 33 C36 28 40 24 45 26 C50 24 54 28 52 33 C50 38 45 40 45 40 C45 40 40 38 38 33Z" stroke="currentColor" strokeWidth="0.8" fill="none"/>
                                {/* Handle */}
                                <path d="M68 26 C76 26 80 30 80 36 C80 42 76 46 68 44" stroke="currentColor" strokeWidth="1" fill="none"/>

                                {/* Middle bowl */}
                                <path d="M15 88 Q45 78 75 88 Q80 108 76 118 Q60 128 45 128 Q30 128 14 118 Q10 108 15 88Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                                <ellipse cx="45" cy="88" rx="30" ry="9" stroke="currentColor" strokeWidth="1" fill="none"/>
                                <ellipse cx="45" cy="122" rx="26" ry="7" stroke="currentColor" strokeWidth="1" fill="none"/>
                                {/* Fish motif on bowl */}
                                <path d="M30 108 C34 100 42 98 45 104 C48 98 56 100 60 108 C56 116 48 114 45 108 C42 114 34 116 30 108Z" stroke="currentColor" strokeWidth="0.8" fill="none"/>

                                {/* Small cup at bottom */}
                                <path d="M26 148 Q45 142 64 148 Q66 158 64 162 Q54 167 45 167 Q36 167 26 162 Q24 158 26 148Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                                <ellipse cx="45" cy="148" rx="19" ry="6" stroke="currentColor" strokeWidth="1" fill="none"/>
                                <ellipse cx="45" cy="163" rx="16" ry="5" stroke="currentColor" strokeWidth="0.9" fill="none"/>
                                {/* Dot band on small cup */}
                                <circle cx="36" cy="156" r="1.5" fill="currentColor"/>
                                <circle cx="45" cy="157" r="1.5" fill="currentColor"/>
                                <circle cx="54" cy="156" r="1.5" fill="currentColor"/>
                            </svg>
                        </div>

                        <div className="flex gap-6 mb-6">
                            <span className="sparkle text-lg" style={{ animationDelay: "0s" }}>✦</span>
                            <span className="sparkle text-sm" style={{ animationDelay: "0.5s" }}>✦</span>
                            <span className="sparkle text-lg" style={{ animationDelay: "1s" }}>✦</span>
                        </div>

                        <h2
                            className="text-4xl md:text-5xl font-semibold mb-6"
                            style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                        >
                            So Studio
                        </h2>

                        <p
                            className="text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
                            style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
                        >
                            A studio exploring ideas about AI, UX,
                            and intelligent systems.
                        </p>

                        <p
                            className="text-sm mb-8 italic"
                            style={{ color: "var(--text-secondary)", fontFamily: "'Playfair Display', serif" }}
                        >
                            Start a conversation.
                        </p>

                        {renderStarterPrompts({ compact: false })}
                    </div>
                )}

                {/* Chat messages */}
                <div
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions text"
                    aria-label="Conversation"
                />
                {messages.map((msg, index) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className="max-w-[85%] md:max-w-[75%]">
                            <div
                                className={`rounded-2xl px-5 py-4 text-base leading-relaxed ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                                    }`}
                                style={{
                                    background: msg.role === "user" ? "var(--ink)" : "var(--cream-light)",
                                    color: msg.role === "user" ? "var(--cream)" : "var(--ink)",
                                    border: msg.role === "assistant" ? "1px solid var(--ink-border)" : "none",
                                    fontFamily: "'Inter', sans-serif",
                                }}
                            >
                                {renderMarkdown(msg.content, (href) => router.push(href))}
                            </div>

                            {msg.role === "assistant" &&
                                index === lastAssistantIndex &&
                                !conversationContinued &&
                                msg.suggestedActions &&
                                msg.suggestedActions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2 pl-1">
                                    {msg.suggestedActions.slice(0, 3).map((suggestion) => (
                                        <button
                                            key={`${msg.id}-${suggestion}`}
                                            onClick={() => handleSend(suggestion)}
                                            className="pill-button-outline text-xs py-1 px-2.5 leading-5"
                                            style={{ borderRadius: "999px", maxWidth: "100%" }}
                                            disabled={isLoading}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div
                            className="rounded-2xl rounded-bl-sm px-5 py-4 text-base"
                            role="status"
                            aria-live="polite"
                            style={{
                                background: "var(--cream-light)",
                                border: "1px solid var(--ink-border)",
                                color: "var(--text-secondary)",
                                fontFamily: "'Inter', sans-serif",
                                minWidth: "160px"
                            }}
                        >
                            <span className="fade-in">{loadingText}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div
                className="sticky bottom-0 left-0 right-0 px-4 md:px-8 pt-2 pointer-events-none"
                style={{
                    paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
                    background:
                        "linear-gradient(180deg, rgba(245,240,232,0) 0%, rgba(245,240,232,0.9) 35%, rgba(245,240,232,1) 100%)",
                }}
            >
                <div className="max-w-4xl mx-auto flex flex-col gap-2 pointer-events-auto">
                    {/* Start over button — only visible mid-conversation */}
                    {!isEmpty && (
                        <div className="flex justify-end">
                            <button
                                onClick={clearChat}
                                className="text-xs hover:opacity-70 transition-opacity"
                                style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
                                aria-label="Clear conversation and start over"
                            >
                                ↺ Start over
                            </button>
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
                        <label htmlFor="chat-input" className="sr-only">
                            Chat message
                        </label>
                        <input
                            id="chat-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What would you like to explore?"
                            aria-label="Type your message"
                            className="flex-1 text-base outline-none bg-transparent"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
                            aria-label="Send message"
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
