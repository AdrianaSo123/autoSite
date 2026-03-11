"use client";

import React, { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { applyTheme, loadSavedTheme, type ThemeName } from "@/lib/theme";

// Lightweight markdown renderer (matches ChatInterface)
function renderMarkdown(text: string): React.ReactNode {
    const lines = text.split("\n");
    return lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
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

const ADMIN_COMMANDS = [
    "Show recent posts",
    "Blog summary",
    "Set style",
];

export default function AdminChat() {
    useEffect(() => { loadSavedTheme(); }, []);

    const { messages, input, isLoading, isEmpty, setInput, sendMessage, handleKeyDown, clearChat, messagesEndRef } =
        useChat({
            onAction: (action) => {
                if (action.startsWith("set_theme:")) {
                    const theme = action.substring("set_theme:".length) as ThemeName;
                    applyTheme(theme);
                }
            },
        });

    return (
        <div
            className="w-full flex-1 flex flex-col relative"
            style={{ minHeight: "75vh" }}
        >
            {/* Messages area */}
            <div
                className="flex-1 overflow-y-auto px-2 md:px-8 pb-40 space-y-6"
                role="log"
                aria-live="polite"
                aria-relevant="additions text"
                aria-label="Admin console conversation"
            >
                {isEmpty && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <span className="sparkle text-lg mb-6">✦</span>
                        <h2
                            className="text-3xl font-semibold mb-4"
                            style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                        >
                            Admin Console
                        </h2>
                        <p
                            className="text-sm mb-8"
                            style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
                        >
                            Select a command below or type one to get started.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {ADMIN_COMMANDS.map((cmd) => (
                                <button
                                    key={`hero-${cmd}`}
                                    onClick={() => sendMessage(cmd)}
                                    className="pill-button-outline text-sm py-2 px-5"
                                    style={{ borderRadius: "999px" }}
                                >
                                    {cmd}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className="max-w-[85%] md:max-w-[75%]">
                            <div
                                className={`rounded-2xl px-5 py-4 text-base leading-relaxed ${
                                    msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
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
                                minWidth: "120px",
                            }}
                        >
                            ✦ Executing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Sticky input bar */}
            <div
                className="sticky bottom-0 left-0 right-0 px-4 md:px-8 pt-2 pointer-events-none"
                style={{
                    paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
                    background:
                        "linear-gradient(180deg, rgba(245,240,232,0) 0%, rgba(245,240,232,0.9) 35%, rgba(245,240,232,1) 100%)",
                }}
            >
                <div className="max-w-4xl mx-auto flex flex-col gap-2 pointer-events-auto">
                    {/* Compact command chips above input */}
                    {!isEmpty && (
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                                {ADMIN_COMMANDS.map((cmd) => (
                                    <button
                                        key={`chip-${cmd}`}
                                        onClick={() => sendMessage(cmd)}
                                        className="pill-button-outline text-xs py-1.5 px-3 bg-white"
                                        style={{ borderRadius: "999px", fontSize: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                                        disabled={isLoading}
                                    >
                                        {cmd}
                                    </button>
                                ))}
                            </div>
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
                        <label htmlFor="admin-chat-input" className="sr-only">Admin command</label>
                        <input
                            id="admin-chat-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter admin command..."
                            aria-label="Enter admin command"
                            className="flex-1 text-base outline-none bg-transparent"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={isLoading || !input.trim()}
                            aria-label="Execute command"
                            className="pill-button text-sm px-6 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ borderRadius: "999px" }}
                        >
                            Execute
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
