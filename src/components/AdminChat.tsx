"use client";

import { useChat } from "@/hooks/useChat";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ADMIN_COMMANDS = [
    "Show recent posts",
    "Search posts",
    "Blog summary",
];

export default function AdminChat() {
    const { messages, input, isLoading, setInput, sendMessage, handleKeyDown, messagesEndRef } =
        useChat({ welcomeMessage: "Admin console ready. Enter a command or select one below." });

    return (
        <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
                border: "1.5px solid var(--ink-border)",
                background: "var(--cream-light)",
            }}
        >
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                            style={{
                                background: msg.role === "user" ? "var(--ink)" : "var(--ink-faint)",
                                color: msg.role === "user" ? "var(--cream)" : "var(--ink)",
                                fontFamily: "'Inter', monospace",
                            }}
                        >
                            {msg.role === "assistant" && (
                                <span className="text-xs opacity-60 block mb-1">⚙ System</span>
                            )}
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
                            }}
                        >
                            ✦ Executing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Command suggestions */}
            <div
                className="px-5 py-3 flex gap-2 flex-wrap"
                style={{ borderTop: "1px solid var(--ink-faint)" }}
            >
                {ADMIN_COMMANDS.map((cmd) => (
                    <button
                        key={cmd}
                        onClick={() => sendMessage(cmd)}
                        className="pill-button-outline text-xs py-1.5 px-3"
                        style={{ borderRadius: "999px", fontSize: "0.7rem" }}
                    >
                        {cmd}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div
                className="p-4 flex gap-3"
                style={{ borderTop: "1px solid var(--ink-border)" }}
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter admin command..."
                    className="pill flex-1 text-sm"
                    style={{ fontFamily: "'Inter', monospace" }}
                    disabled={isLoading}
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                    className="pill-button text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Execute
                </button>
            </div>
        </div>
    );
}
