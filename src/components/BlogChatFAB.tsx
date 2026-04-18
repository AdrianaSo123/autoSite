"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { applyTheme, type ThemeName } from "@/lib/theme";

// ---------------------------------------------------------------------------
// Mini markdown — bold + line breaks only
// ---------------------------------------------------------------------------
function MiniMarkdown({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <>
            {lines.map((line, i) => {
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                    <span key={i}>
                        {parts.map((part, j) =>
                            part.startsWith("**") && part.endsWith("**") ? (
                                <strong key={j} className="font-semibold">
                                    {part.slice(2, -2)}
                                </strong>
                            ) : (
                                part
                            )
                        )}
                        {i < lines.length - 1 && <br />}
                    </span>
                );
            })}
        </>
    );
}

// ---------------------------------------------------------------------------
// SVG icons
// ---------------------------------------------------------------------------
const IconChat = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const IconClose = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const IconExpand = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
    </svg>
);
const IconCollapse = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
        <line x1="10" y1="14" x2="3" y2="21" /><line x1="21" y1="3" x2="14" y2="10" />
    </svg>
);
const IconSend = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------
const MINI_SUGGESTIONS = [
    "Summarize this article",
    "Show related posts",
    "What is So Studio?",
];

// ---------------------------------------------------------------------------
// BlogChatFAB
// ---------------------------------------------------------------------------
export default function BlogChatFAB() {
    const [open, setOpen] = React.useState(false);
    const [fullscreen, setFullscreen] = React.useState(false);
    const router = useRouter();
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const {
        messages,
        input,
        isLoading,
        loadingText,
        isEmpty,
        setInput,
        sendMessage,
        clearChat,
        messagesEndRef,
    } = useChat({
        onAction: (action) => {
            if (action === "open_admin_studio") {
                setTimeout(() => router.push("/studio"), 600);
            } else if (action.startsWith("open_post:")) {
                const url = action.substring("open_post:".length);
                setTimeout(() => router.push(url), 600);
            } else if (action.startsWith("set_theme:")) {
                const theme = action.substring("set_theme:".length) as ThemeName;
                applyTheme(theme);
            }
        },
    });

    // Scroll to bottom on new messages
    useEffect(() => {
        if (open && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
                messagesContainerRef.current.scrollHeight;
        }
    }, [messages, open]);

    // Escape closes / collapses
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (fullscreen) setFullscreen(false);
                else setOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, fullscreen]);

    const handleSend = (text?: string) => sendMessage(text);

    const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Panel geometry — mini vs fullscreen
    const panelStyle: React.CSSProperties = fullscreen
        ? {
            position: "fixed",
            inset: 0,
            zIndex: 60,
            borderRadius: 0,
            border: "none",
            width: "100%",
            height: "100%",
            maxHeight: "100%",
            bottom: 0,
            left: 0,
            transform: "none",
            transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
        }
        : {
            position: "fixed",
            right: 24,
            bottom: open ? 24 : -520,
            width: "min(420px, 100vw - 48px)",
            height: 540,
            maxHeight: "80vh",
            borderRadius: "16px",
            border: "1.5px solid var(--ink-border)",
            transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
            zIndex: 60,
            boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
        };


    return (
        <>
            {/* ── FAB button (bottom-right) ── */}
            {!open && (
                <button
                    aria-label="Ask So Studio"
                    title="Ask So Studio"
                    onClick={() => setOpen(true)}
                    className="fixed z-50 flex items-center justify-center w-10 h-10 rounded-full active:scale-95 transition-all duration-150 hover:scale-110"
                    style={{
                        bottom: 24,
                        right: 24,
                        background: "var(--cream)",
                        border: "1.5px solid var(--ink-border)",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                        color: "var(--ink)",
                    }}
                >
                    <span className="sparkle" style={{ fontSize: "1.1rem", lineHeight: 1 }}>✦</span>
                </button>
            )}

            {/* ── Fullscreen backdrop ── */}
            {open && fullscreen && (
                <div
                    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    onClick={() => setFullscreen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Chat panel ── */}
            {open && (
                <div
                    role="dialog"
                    aria-label="So Studio chat"
                    aria-modal="true"
                    className="flex flex-col"
                    style={{
                        ...panelStyle,
                        background: "var(--cream-light)",
                        boxShadow: "0 -4px 32px rgba(0,0,0,0.14)",
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between px-4 py-3 shrink-0"
                        style={{
                            borderBottom: "1px solid var(--ink-border)",
                            background: "var(--cream)",
                        }}
                    >
                        {/* Left: icon + title */}
                        <div className="flex items-center gap-2">
                            <span style={{ color: "var(--ink)" }}><IconChat /></span>
                            <span
                                className="text-sm font-semibold"
                                style={{ color: "var(--ink)", fontFamily: "var(--font-heading)" }}
                            >
                                Ask So Studio
                            </span>
                        </div>

                        {/* Right: clear, expand/collapse, close */}
                        <div className="flex items-center gap-1">
                            {messages.length > 0 && (
                                <button
                                    onClick={clearChat}
                                    title="Clear chat"
                                    className="px-2 py-1 rounded-full hover:opacity-60 transition-opacity text-xs"
                                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                                >
                                    Clear
                                </button>
                            )}
                            <button
                                onClick={() => setFullscreen((v) => !v)}
                                aria-label={fullscreen ? "Collapse chat" : "Expand to full screen"}
                                title={fullscreen ? "Collapse" : "Full screen"}
                                className="p-1.5 rounded-full hover:opacity-60 transition-opacity"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                {fullscreen ? <IconCollapse /> : <IconExpand />}
                            </button>
                            <button
                                onClick={() => { setOpen(false); setFullscreen(false); }}
                                aria-label="Close chat"
                                className="p-1.5 rounded-full hover:opacity-60 transition-opacity"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                <IconClose />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto py-4 space-y-3"
                        style={{
                            minHeight: 0,
                            paddingLeft: fullscreen ? "clamp(16px, 8vw, 160px)" : "16px",
                            paddingRight: fullscreen ? "clamp(16px, 8vw, 160px)" : "16px",
                        }}
                    >
                        {isEmpty ? (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center gap-4">
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                                >
                                    Ask anything about this article or the blog.
                                </p>
                                <div className="flex flex-col gap-2 w-full max-w-xs">
                                    {MINI_SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => handleSend(s)}
                                            className="text-xs py-2 px-4 rounded-full text-left hover:opacity-80 transition-opacity"
                                            style={{
                                                background: "var(--ink-faint)",
                                                color: "var(--ink)",
                                                border: "1px solid var(--ink-border)",
                                                fontFamily: "var(--font-body)",
                                            }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className="leading-relaxed rounded-2xl px-4 py-2.5"
                                        style={{
                                            maxWidth: fullscreen ? "60%" : "85%",
                                            fontSize: fullscreen ? "0.9rem" : "0.8rem",
                                            background: msg.role === "user" ? "var(--ink)" : "var(--cream)",
                                            color: msg.role === "user" ? "var(--cream)" : "var(--text-primary)",
                                            border: msg.role === "assistant" ? "1px solid var(--ink-border)" : "none",
                                            fontFamily: "var(--font-body)",
                                        }}
                                    >
                                        {msg.role === "assistant" ? (
                                            <MiniMarkdown text={msg.content} />
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div
                                    className="text-xs rounded-2xl px-4 py-2.5"
                                    style={{
                                        background: "var(--cream)",
                                        color: "var(--text-secondary)",
                                        border: "1px solid var(--ink-border)",
                                        fontFamily: "var(--font-body)",
                                    }}
                                >
                                    {loadingText || "Thinking…"}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input bar */}
                    <div
                        className="shrink-0 px-4 py-3"
                        style={{
                            borderTop: "1px solid var(--ink-border)",
                            background: "var(--cream)",
                            paddingLeft: fullscreen ? "clamp(16px, 8vw, 160px)" : "16px",
                            paddingRight: fullscreen ? "clamp(16px, 8vw, 160px)" : "16px",
                        }}
                    >
                        <div
                            className="flex items-center gap-2 rounded-full px-4 py-2.5"
                            style={{
                                background: "var(--cream-light)",
                                border: "1.5px solid var(--ink-border)",
                            }}
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleInputKey}
                                placeholder="Ask a question…"
                                disabled={isLoading}
                                autoFocus={open}
                                className="flex-1 bg-transparent outline-none placeholder:opacity-40"
                                style={{
                                    fontSize: fullscreen ? "0.95rem" : "0.8rem",
                                    color: "var(--text-primary)",
                                    fontFamily: "var(--font-body)",
                                }}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={isLoading || !input.trim()}
                                aria-label="Send"
                                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-opacity disabled:opacity-30"
                                style={{ background: "var(--ink)", color: "var(--cream)" }}
                            >
                                <IconSend />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
