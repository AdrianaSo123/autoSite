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
                                {/* Lid knob */}
                                <ellipse cx="55" cy="9" rx="7" ry="4" stroke="currentColor" strokeWidth="1.1"/>
                                <path d="M48 9 C46 13 44 16 43 21 M62 9 C64 13 66 16 67 21" stroke="currentColor" strokeWidth="1"/>
                                {/* Lid rim */}
                                <ellipse cx="55" cy="21" rx="21" ry="6" stroke="currentColor" strokeWidth="1.2"/>
                                {/* Body sides */}
                                <path d="M34 21 L32 168" stroke="currentColor" strokeWidth="1.3"/>
                                <path d="M76 21 L78 168" stroke="currentColor" strokeWidth="1.3"/>
                                {/* Top decorative band lower edge */}
                                <ellipse cx="55" cy="44" rx="22" ry="6" stroke="currentColor" strokeWidth="1"/>
                                {/* Diamond lattice — SE diagonals */}
                                <path d="M34 21 L47 44 M40 21 L54 44 M47 21 L61 44 M54 21 L68 44 M62 21 L76 39" stroke="currentColor" strokeWidth="0.65"/>
                                {/* Diamond lattice — SW diagonals */}
                                <path d="M76 21 L63 44 M70 21 L56 44 M64 21 L50 44 M57 21 L43 44 M50 21 L34 39" stroke="currentColor" strokeWidth="0.65"/>
                                {/* Mid section dividers */}
                                <ellipse cx="55" cy="90" rx="23" ry="6.5" stroke="currentColor" strokeWidth="0.9" strokeDasharray="4 2"/>
                                <ellipse cx="55" cy="144" rx="23" ry="6.5" stroke="currentColor" strokeWidth="0.9" strokeDasharray="4 2"/>
                                {/* Diamond medallion frame */}
                                <path d="M55 97 L77 117 L55 137 L33 117 Z" stroke="currentColor" strokeWidth="1"/>
                                {/* Center circle */}
                                <circle cx="55" cy="117" r="6" stroke="currentColor" strokeWidth="0.9"/>
                                {/* 4 main petals */}
                                <path d="M55 111 C57 106 61 103 59 97 C54 101 51 107 55 111Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M55 123 C57 128 61 131 59 137 C54 133 51 127 55 123Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M49 117 C44 115 41 111 36 113 C38 117 44 120 49 117Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M61 117 C66 115 69 111 74 113 C72 117 66 120 61 117Z" stroke="currentColor" strokeWidth="0.8"/>
                                {/* 4 diagonal leaves */}
                                <path d="M50 108 C47 103 47 98 51 97 C52 102 51 107 50 108Z" stroke="currentColor" strokeWidth="0.7"/>
                                <path d="M60 108 C63 103 63 98 59 97 C58 102 59 107 60 108Z" stroke="currentColor" strokeWidth="0.7"/>
                                <path d="M50 126 C47 131 47 136 51 137 C52 132 51 127 50 126Z" stroke="currentColor" strokeWidth="0.7"/>
                                <path d="M60 126 C63 131 63 136 59 137 C58 132 59 127 60 126Z" stroke="currentColor" strokeWidth="0.7"/>
                                {/* Bottom band */}
                                <ellipse cx="55" cy="152" rx="23" ry="6.5" stroke="currentColor" strokeWidth="1"/>
                                {/* Wave pattern in bottom band */}
                                <path d="M32 161 C36 157 40 165 44 161 C48 157 52 165 56 161 C60 157 64 165 68 161 C72 157 77 161 78 159" stroke="currentColor" strokeWidth="0.9"/>
                                {/* Base foot */}
                                <path d="M32 168 Q55 176 78 168" stroke="currentColor" strokeWidth="1.2"/>
                                <ellipse cx="55" cy="171" rx="23" ry="7" stroke="currentColor" strokeWidth="1.1"/>
                            </svg>
                        </div>

                        {/* Decorative bowls — right */}
                        <div className="hidden md:block absolute right-0 top-16 opacity-25 pointer-events-none select-none" style={{ color: "var(--ink)" }}>
                            <svg width="90" height="172" viewBox="0 0 90 172" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* TOP BOWL (smallest) */}
                                <ellipse cx="45" cy="13" rx="18" ry="5" stroke="currentColor" strokeWidth="1"/>
                                <path d="M27 13 C25 22 25 31 27 40 Q45 47 63 40 C65 31 65 22 63 13" stroke="currentColor" strokeWidth="1.2"/>
                                <ellipse cx="45" cy="42" rx="19" ry="5.5" stroke="currentColor" strokeWidth="1"/>
                                <path d="M37 42 L36 50 M53 42 L54 50" stroke="currentColor" strokeWidth="1"/>
                                <ellipse cx="45" cy="50" rx="9" ry="3" stroke="currentColor" strokeWidth="1"/>
                                {/* Leaf motif */}
                                <path d="M40 27 C37 22 40 18 44 19 C43 24 41 29 40 27Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M50 25 C53 20 50 16 46 17 C47 22 49 27 50 25Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M40 27 L45 23 M50 25 L45 21" stroke="currentColor" strokeWidth="0.6"/>

                                {/* MIDDLE BOWL */}
                                <ellipse cx="45" cy="67" rx="24" ry="7" stroke="currentColor" strokeWidth="1"/>
                                <path d="M21 67 C19 79 19 91 21 101 Q45 109 69 101 C71 91 71 79 69 67" stroke="currentColor" strokeWidth="1.2"/>
                                <ellipse cx="45" cy="103" rx="25" ry="7.5" stroke="currentColor" strokeWidth="1"/>
                                <path d="M33 103 L33 112 M57 103 L57 112" stroke="currentColor" strokeWidth="1"/>
                                <ellipse cx="45" cy="112" rx="12" ry="4" stroke="currentColor" strokeWidth="1"/>
                                {/* Circle + leaf motif */}
                                <circle cx="45" cy="86" r="5" stroke="currentColor" strokeWidth="0.9"/>
                                <path d="M37 82 C34 76 37 71 42 73 C41 79 38 84 37 82Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M53 80 C56 74 53 69 48 71 C49 77 52 82 53 80Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M37 82 L41 84 M53 80 L49 82" stroke="currentColor" strokeWidth="0.6"/>

                                {/* BOTTOM BOWL (largest) */}
                                <ellipse cx="45" cy="128" rx="29" ry="8" stroke="currentColor" strokeWidth="1"/>
                                <path d="M16 128 C14 141 14 152 16 160 Q45 168 74 160 C76 152 76 141 74 128" stroke="currentColor" strokeWidth="1.3"/>
                                <ellipse cx="45" cy="162" rx="30" ry="8" stroke="currentColor" strokeWidth="1"/>
                                <path d="M30 162 L29 168 M60 162 L61 168" stroke="currentColor" strokeWidth="1.1"/>
                                <ellipse cx="45" cy="168" rx="15" ry="4.5" stroke="currentColor" strokeWidth="1"/>
                                {/* Floral motif */}
                                <circle cx="45" cy="146" r="7" stroke="currentColor" strokeWidth="0.9"/>
                                <path d="M45 139 C47 134 51 131 49 126 C44 129 41 134 45 139Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M45 153 C47 158 51 161 49 166 C44 163 41 158 45 153Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M38 146 C33 144 30 140 35 138 C38 142 38 145 38 146Z" stroke="currentColor" strokeWidth="0.8"/>
                                <path d="M52 146 C57 144 60 140 55 138 C52 142 52 145 52 146Z" stroke="currentColor" strokeWidth="0.8"/>
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
                            A studio exploring ideas about AI, UX, and intelligent systems —
                            where design thinking meets the age of agents.
                        </p>

                        <p
                            className="text-sm mb-8 italic"
                            style={{ color: "var(--text-secondary)", fontFamily: "'Playfair Display', serif" }}
                        >
                            Ask a question, explore a post, or just start a conversation.
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
