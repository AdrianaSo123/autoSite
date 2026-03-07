"use client";

import { useState } from "react";
import ChatInterface from "./ChatInterface";

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Chat Panel */}
            {isOpen && (
                <div
                    className="fixed bottom-20 right-4 z-50 w-[380px] max-h-[500px] rounded-2xl overflow-hidden"
                    style={{
                        boxShadow: '0 8px 40px rgba(43, 58, 142, 0.15)',
                        border: '1.5px solid var(--ink-border)',
                        background: 'var(--cream)',
                    }}
                >
                    <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{
                            background: 'var(--ink)',
                            color: 'var(--cream)',
                            fontFamily: "'Playfair Display', serif",
                        }}
                    >
                        <span className="font-semibold text-sm">✦ AI Assistant ✦</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:opacity-70 text-lg leading-none transition-opacity"
                            style={{ color: 'var(--cream)' }}
                        >
                            ✕
                        </button>
                    </div>
                    <ChatInterface />
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all"
                style={{
                    background: 'var(--ink)',
                    color: 'var(--cream)',
                    boxShadow: '0 4px 20px rgba(43, 58, 142, 0.3)',
                }}
                aria-label="Open chat"
            >
                {isOpen ? "✕" : "✦"}
            </button>
        </>
    );
}
