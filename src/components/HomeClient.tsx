"use client";

import ChatInterface from "@/components/ChatInterface";

export default function HomeClient() {
    return (
        <div className="flex flex-col flex-1 items-center fade-in-up w-full h-full">
            {/* ✦ Primary Chat Interface — conversation-first, full homepage */}
            <section className="w-full flex-1 max-w-5xl flex flex-col">
                <ChatInterface />
            </section>
        </div>
    );
}
