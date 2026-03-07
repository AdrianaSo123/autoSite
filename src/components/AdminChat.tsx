"use client";

import { useState, useRef, useEffect } from "react";

interface AdminMessage {
    id: string;
    role: "admin" | "system";
    content: string;
    timestamp: Date;
}

const ADMIN_COMMANDS = [
    "Process latest recording",
    "Publish draft",
    "Regenerate article",
    "Show analytics",
    "System status",
];

export default function AdminChat() {
    const [messages, setMessages] = useState<AdminMessage[]>([
        {
            id: "welcome",
            role: "system",
            content: "Admin console ready. Enter a command or select one below.",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const executeCommand = async (command?: string) => {
        const cmd = command || input.trim();
        if (!cmd || isLoading) return;

        const adminMsg: AdminMessage = {
            id: Date.now().toString(),
            role: "admin",
            content: cmd,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, adminMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: cmd }),
            });

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "system",
                    content: data.reply || "Command executed.",
                    timestamp: new Date(),
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "system",
                    content: "Error executing command. Please try again.",
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
            executeCommand();
        }
    };

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
                        className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                            style={{
                                background: msg.role === "admin" ? "var(--ink)" : "var(--ink-faint)",
                                color: msg.role === "admin" ? "var(--cream)" : "var(--ink)",
                                fontFamily: "'Inter', monospace",
                            }}
                        >
                            {msg.role === "system" && (
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
                        onClick={() => executeCommand(cmd)}
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
                    onClick={() => executeCommand()}
                    disabled={isLoading || !input.trim()}
                    className="pill-button text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Execute
                </button>
            </div>
        </div>
    );
}
