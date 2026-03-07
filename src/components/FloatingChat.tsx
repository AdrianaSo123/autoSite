"use client";

import { useState } from "react";
import ChatInterface from "./ChatInterface";

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-20 right-4 z-50 w-[380px] max-h-[500px] rounded-xl shadow-2xl border bg-white dark:bg-gray-900 dark:border-gray-700 overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 bg-blue-600 text-white">
                        <span className="font-semibold text-sm">AI Assistant</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-gray-200 text-lg leading-none"
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
                className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center text-2xl"
                aria-label="Open chat"
            >
                {isOpen ? "✕" : "💬"}
            </button>
        </>
    );
}
