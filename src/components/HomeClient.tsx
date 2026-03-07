"use client";

import ChatInterface from "@/components/ChatInterface";

export default function HomeClient() {
    return (
        <div className="flex flex-col items-center fade-in-up">
            {/* ✦ Primary Chat Interface — conversation-first, full homepage */}
            <section className="w-full max-w-4xl">
                <ChatInterface />
            </section>
        </div>
    );
}
