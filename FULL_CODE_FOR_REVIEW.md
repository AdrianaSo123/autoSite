# AI Publishing Platform — Complete Source Code

Generated: Mon Mar  9 16:21:05 EDT 2026

---
## src/app/admin/login/page.tsx
```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError("Invalid credentials. Please try again.");
        } else {
            router.push("/studio");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-sm border rounded-lg p-8 shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-600"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-600"
                        required
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white rounded-md py-2 text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
```

---
## src/app/api/activity/route.ts
```typescript
import { NextResponse } from "next/server";
import { getActivityLog } from "@/lib/activity-log";

export async function GET() {
    try {
        const log = getActivityLog(50);
        return NextResponse.json({ activities: log });
    } catch (error) {
        console.error("Activity log error:", error);
        return NextResponse.json({ error: "Failed to get activity log." }, { status: 500 });
    }
}
```

---
## src/app/api/auth/[...nextauth]/route.ts
```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

---
## src/app/api/chat/route.ts
```typescript
import { NextRequest, NextResponse } from "next/server";
import { routeCommand } from "@/lib/commands";
import { routeToTool } from "@/lib/mcp/tool-router";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ reply: "Please send a message." }, { status: 400 });
        }

        const session = await auth();
        const isAdmin = !!session?.user;

        // 1. Try MCP tool routing (keyword + LLM)
        let toolResult = "";
        try {
            toolResult = await routeToTool(message, isAdmin);
        } catch (error) {
            console.error("Tool routing error:", error);
        }

        if (toolResult) {
            logActivity("mcp_tool_executed", { message, isAdmin });
            return NextResponse.json({
                reply: toolResult,
                action: "agent_tool_call",
            });
        }

        // 2. Fall back to command router (greetings, help, admin, actions)
        const result = await routeCommand(message);

        return NextResponse.json({
            reply: result.reply,
            action: result.action || null,
        });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            { reply: "Something went wrong. Please try again or say \"help\" for available commands." },
            { status: 500 }
        );
    }
}
```

---
## src/app/api/generate-post/route.ts
```typescript
/**
 * ⚠️ DEVELOPMENT / DEMO ROUTE ONLY
 *
 * This endpoint is NOT part of the production pipeline.
 * Blog posts should be generated by the external pipeline and committed to the repo.
 * This route exists for local development and demonstration only.
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePostFromTranscript } from "@/lib/post-generator";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Post generation is handled by the external pipeline in production." },
            { status: 403 }
        );
    }

    try {
        const { transcript, transcriptFile } = await request.json();

        if (!transcript && !transcriptFile) {
            return NextResponse.json(
                { error: "Provide transcript or transcriptFile." },
                { status: 400 }
            );
        }

        const result = await generatePostFromTranscript(transcript || transcriptFile);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Post generation error:", error);
        return NextResponse.json({ error: "Post generation failed." }, { status: 500 });
    }
}
```

---
## src/app/api/transcribe/route.ts
```typescript
/**
 * ⚠️ DEVELOPMENT / DEMO ROUTE ONLY
 *
 * This endpoint is NOT part of the production pipeline.
 * The canonical pipeline uses an external transcription server.
 * This route exists for local development and demonstration only.
 */

import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/transcription";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Transcription is handled by the external pipeline in production." },
            { status: 403 }
        );
    }

    try {
        const { fileName, transcript } = await request.json();

        if (transcript) {
            return NextResponse.json({ transcript });
        }

        if (!fileName) {
            return NextResponse.json({ error: "fileName is required." }, { status: 400 });
        }

        const result = await transcribeAudio(fileName);
        return NextResponse.json({ transcript: result });
    } catch (error) {
        console.error("Transcription error:", error);
        return NextResponse.json({ error: "Transcription failed." }, { status: 500 });
    }
}
```

---
## src/app/api/upload-audio/route.ts
```typescript
/**
 * ⚠️ DEVELOPMENT / DEMO ROUTE ONLY
 *
 * This endpoint is NOT part of the production pipeline.
 * The canonical audio publishing pipeline is:
 *   Recording App → External Server → Whisper → AI Formatting → Git Commit → Vercel Redeploy
 *
 * Next.js should NOT handle persistent file storage in production (serverless).
 * This route exists for local development and demonstration purposes only.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Audio upload is handled by the external recording pipeline in production." },
            { status: 403 }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("audio") as File;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
        }

        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadsDir, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({ success: true, fileName });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}
```

---
## src/app/blog/[slug]/page.tsx
```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getAllSlugs, getPostHtml } from "@/lib/posts";

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const slugs = getAllSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    if (!post) return { title: "Post Not Found" };
    return {
        title: `${post.title} — AI Publishing Platform`,
        description: post.excerpt,
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const htmlContent = await getPostHtml(post.content);

    return (
        <div className="max-w-3xl mx-auto fade-in-up">
            <Link
                href="/blog"
                className="text-sm mb-8 inline-block hover:opacity-70 transition-opacity"
                style={{ color: 'var(--ink)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
            >
                ← Back to Blog
            </Link>
            <article>
                <div className="flex items-center gap-2 mb-2">
                    <span className="sparkle text-xs">✦</span>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{post.date}</p>
                </div>
                <h1
                    className="text-4xl font-semibold mb-8 leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                >
                    {post.title}
                </h1>
                <div className="ink-divider mb-8" />
                <div
                    className="prose max-w-none text-sm leading-relaxed"
                    style={{ color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </article>
        </div>
    );
}
```

---
## src/app/blog/page.tsx
```typescript
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
    title: "Blog — AI Publishing Platform",
    description: "Browse all blog posts on the AI Publishing Platform.",
};

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <div className="max-w-3xl mx-auto fade-in-up">
            <div className="text-center mb-10">
                <div className="flex justify-center gap-4 mb-4">
                    <span className="sparkle text-sm">✦</span>
                    <span className="sparkle text-xs" style={{ animationDelay: '0.5s' }}>✦</span>
                    <span className="sparkle text-sm" style={{ animationDelay: '1s' }}>✦</span>
                </div>
                <h1
                    className="text-4xl font-semibold mb-3"
                    style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                >
                    Blog
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Ideas, articles, and thoughts — all from voice to page.
                </p>
                <div className="ink-divider max-w-xs mx-auto mt-6" />
            </div>

            <div className="flex flex-col gap-5">
                {posts.map((post) => (
                    <article key={post.slug} className="ink-card group">
                        <Link href={`/blog/${post.slug}`}>
                            <h2
                                className="text-xl font-semibold mb-1 group-hover:opacity-80 transition-opacity"
                                style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                            >
                                {post.title}
                            </h2>
                        </Link>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                            {post.date}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {post.excerpt}
                        </p>
                        <Link
                            href={`/blog/${post.slug}`}
                            className="text-sm mt-3 inline-block hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--ink)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
                        >
                            Read more →
                        </Link>
                    </article>
                ))}
            </div>
        </div>
    );
}
```

---
## src/app/layout.tsx
```typescript
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Providers from "@/components/Providers";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: "AI Publishing Platform",
  description: "Conversational AI Publishing Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <header
              className="border-b"
              style={{ borderColor: "var(--ink-border)" }}
            >
              <NavBar />
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full">
              {children}
            </main>
          </div>

          {/* Vercel Analytics */}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
```

---
## src/app/page.tsx
```typescript
import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "AI Publishing Platform",
  description: "Conversational AI Publishing Platform",
};

export default function Home() {
  return <HomeClient />;
}
```

---
## src/app/studio/page.tsx
```typescript
import { auth, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminChat from "@/components/AdminChat";
import ActivityDashboard from "@/components/ActivityDashboard";

export const metadata = {
    title: "Studio — AI Publishing Platform",
};

export default async function StudioPage() {
    const session = await auth();

    // Unauthenticated → redirect to sign-in
    if (!session) {
        redirect("/admin/login");
    }

    // Authenticated but not admin → restricted access
    if (!isAdmin(session.user?.email)) {
        return (
            <div className="max-w-3xl mx-auto text-center py-20 fade-in-up">
                <span className="sparkle text-2xl">✦</span>
                <h1
                    className="text-3xl font-semibold mt-4 mb-4"
                    style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                >
                    Studio Access Restricted
                </h1>
                <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
                >
                    This area is only available to the site administrator.
                </p>
            </div>
        );
    }

    // Admin → render full studio
    return (
        <div className="max-w-3xl mx-auto fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="sparkle text-sm">✦</span>
                    <h1
                        className="text-3xl font-semibold"
                        style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                    >
                        Studio
                    </h1>
                </div>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {session.user?.email}
                </span>
            </div>
            <div className="ink-divider mb-8" />

            <div className="mb-6">
                <p
                    className="text-sm mb-4"
                    style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
                >
                    Use the admin console below to control the publishing system.
                </p>
            </div>

            <AdminChat />

            <div className="mt-8">
                <ActivityDashboard />
            </div>
        </div>
    );
}
```

---
## src/components/ActivityDashboard.tsx
```typescript
"use client";

import { useState, useEffect } from "react";

interface ActivityEntry {
    id: string;
    type: string;
    timestamp: string;
    metadata: Record<string, unknown>;
}

interface Metrics {
    totalEvents: number;
    toolsExecuted: number;
    postsGenerated: number;
    recordingsProcessed: number;
    articlesPublished: number;
}

const TYPE_LABELS: Record<string, { icon: string; label: string }> = {
    audio_uploaded: { icon: "🎙️", label: "Recording uploaded" },
    transcription_completed: { icon: "📝", label: "Transcription completed" },
    article_generated: { icon: "✨", label: "Blog post generated" },
    article_published: { icon: "📰", label: "Article published" },
    mcp_tool_executed: { icon: "⚙️", label: "Tool executed" },
};

function computeMetrics(activities: ActivityEntry[]): Metrics {
    return {
        totalEvents: activities.length,
        toolsExecuted: activities.filter((a) => a.type === "mcp_tool_executed").length,
        postsGenerated: activities.filter((a) => a.type === "article_generated").length,
        recordingsProcessed: activities.filter((a) => a.type === "audio_uploaded").length,
        articlesPublished: activities.filter((a) => a.type === "article_published").length,
    };
}

export default function ActivityDashboard() {
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const response = await fetch("/api/activity");
            const data = await response.json();
            setActivities(data.activities || []);
        } catch {
            console.error("Failed to fetch activities");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const d = new Date(timestamp);
        return d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    const metrics = computeMetrics(activities);

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                border: "1.5px solid var(--ink-border)",
                background: "var(--cream-light)",
            }}
        >
            <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--ink-border)" }}
            >
                <h3
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                >
                    ✦ Platform Activity
                </h3>
                <button
                    onClick={fetchActivities}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: "var(--text-secondary)" }}
                >
                    Refresh
                </button>
            </div>

            {/* Metrics summary */}
            {!loading && activities.length > 0 && (
                <div
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-4"
                    style={{ borderBottom: "1px solid var(--ink-border)" }}
                >
                    <MetricCard label="Tools Executed" value={metrics.toolsExecuted} icon="⚙️" />
                    <MetricCard label="Posts Generated" value={metrics.postsGenerated} icon="✨" />
                    <MetricCard label="Recordings" value={metrics.recordingsProcessed} icon="🎙️" />
                    <MetricCard label="Published" value={metrics.articlesPublished} icon="📰" />
                </div>
            )}

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {loading ? (
                    <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>
                        Loading...
                    </p>
                ) : activities.length === 0 ? (
                    <p
                        className="text-sm text-center py-4 italic"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        No activity recorded yet.
                    </p>
                ) : (
                    activities.map((entry) => {
                        const typeInfo = TYPE_LABELS[entry.type] || { icon: "📋", label: entry.type };
                        return (
                            <div
                                key={entry.id}
                                className="flex items-start gap-3 py-2"
                                style={{ borderBottom: "1px solid var(--ink-faint)" }}
                            >
                                <span className="text-lg">{typeInfo.icon}</span>
                                <div className="flex-1">
                                    <p className="text-sm" style={{ color: "var(--ink)" }}>
                                        {typeInfo.label}
                                    </p>
                                    {Object.keys(entry.metadata).length > 0 && (
                                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                            {Object.entries(entry.metadata)
                                                .map(([k, v]) => `${k}: ${v}`)
                                                .join(" · ")}
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                                    {formatTime(entry.timestamp)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="text-center py-2">
            <span className="text-xl">{icon}</span>
            <p
                className="text-2xl font-semibold mt-1"
                style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
            >
                {value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {label}
            </p>
        </div>
    );
}
```

---
## src/components/AdminChat.tsx
```typescript
"use client";

import { useChat } from "@/hooks/useChat";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ADMIN_COMMANDS = [
    "Process latest recording",
    "Publish draft",
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
```

---
## src/components/ChatInterface.tsx
```typescript
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";

// ---------------------------------------------------------------------------
// Markdown renderer (lightweight — bold + newlines)
// ---------------------------------------------------------------------------

function renderMarkdown(text: string): React.ReactNode {
    const lines = text.split("\n");
    return lines.map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
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

const SUGGESTIONS = ["Show recent posts", "What is this project?", "Search posts", "Help"];

interface ChatInterfaceProps {
    onFirstMessage?: () => void;
}

export default function ChatInterface({ onFirstMessage }: ChatInterfaceProps = {}) {
    const { messages, input, isLoading, isEmpty, setInput, sendMessage, handleKeyDown, messagesEndRef } =
        useChat({ onFirstMessage });
    const router = useRouter();

    const handleSend = async (text?: string) => {
        const data = await sendMessage(text);
        if (data?.action === "open_admin_studio") {
            setTimeout(() => router.push("/studio"), 800);
        }
    };

    return (
        <div
            className="w-full flex-1 flex flex-col relative"
            style={{ minHeight: "85vh" }}
            data-testid="chat-container"
        >
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-2 md:px-8 pb-32 space-y-6">
                {/* Hero welcome */}
                {isEmpty && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <div className="flex gap-6 mb-6">
                            <span className="sparkle text-lg" style={{ animationDelay: "0s" }}>✦</span>
                            <span className="sparkle text-sm" style={{ animationDelay: "0.5s" }}>✦</span>
                            <span className="sparkle text-lg" style={{ animationDelay: "1s" }}>✦</span>
                        </div>

                        <h2
                            className="text-4xl md:text-5xl font-semibold mb-6"
                            style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                        >
                            Welcome to AI Platform
                        </h2>

                        <p
                            className="text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
                            style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
                        >
                            A conversational publishing platform that transforms
                            voice recordings into written articles.
                        </p>

                        <p
                            className="text-sm mb-8 italic"
                            style={{ color: "var(--text-secondary)", fontFamily: "'Playfair Display', serif" }}
                        >
                            Ask me anything to get started.
                        </p>

                        <div className="flex gap-3 flex-wrap justify-center">
                            {SUGGESTIONS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt)}
                                    className="pill-button-outline text-sm py-2 px-5"
                                    style={{ borderRadius: "999px" }}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat messages */}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-base leading-relaxed ${msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
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
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div
                            className="rounded-2xl rounded-bl-sm px-5 py-4 text-base"
                            style={{
                                background: "var(--cream-light)",
                                border: "1px solid var(--ink-border)",
                                color: "var(--text-secondary)",
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            ✦ Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="absolute bottom-4 left-0 right-0 px-4 md:px-8 pointer-events-none">
                <div className="max-w-4xl mx-auto flex flex-col gap-2 pointer-events-auto">
                    {!isEmpty && (
                        <div className="flex gap-2 flex-wrap mb-1">
                            {SUGGESTIONS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt)}
                                    className="pill-button-outline text-xs py-1.5 px-3 bg-white"
                                    style={{ borderRadius: "999px", fontSize: "0.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                                >
                                    {prompt}
                                </button>
                            ))}
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
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="What would you like to explore?"
                            className="flex-1 text-base outline-none bg-transparent"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
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
```

---
## src/components/HomeClient.tsx
```typescript
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
```

---
## src/components/NavBar.tsx
```typescript
"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function NavBar() {
    const { data: session } = useSession();

    return (
        <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
                href="/"
                className="font-semibold text-lg tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
            >
                ✦ AI Platform ✦
            </Link>
            <div
                className="flex gap-6 items-center text-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                <Link
                    href="/blog"
                    className="hover:opacity-70 transition-opacity"
                    style={{ color: "var(--ink)" }}
                >
                    Blog
                </Link>
                {session ? (
                    <button
                        onClick={() => signOut()}
                        className="hover:opacity-70 transition-opacity text-xs"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Sign out
                    </button>
                ) : (
                    <button
                        onClick={() => signIn("google")}
                        className="pill-button-outline text-xs py-1.5 px-4"
                        style={{ borderRadius: "999px" }}
                    >
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    );
}
```

---
## src/components/Providers.tsx
```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}
```

---
## src/hooks/useChat.ts
```typescript
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface UseChatOptions {
    /** Initial system message shown on mount (admin console style) */
    welcomeMessage?: string;
    /** Callback fired on the first user message */
    onFirstMessage?: () => void;
}

interface ChatResponse {
    reply?: string;
    action?: string;
}

interface UseChatReturn {
    messages: ChatMessage[];
    input: string;
    isLoading: boolean;
    isEmpty: boolean;
    setInput: (value: string) => void;
    sendMessage: (text?: string) => Promise<ChatResponse | undefined>;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const { welcomeMessage, onFirstMessage } = options;

    const initialMessages: ChatMessage[] = welcomeMessage
        ? [{ id: "welcome", role: "assistant", content: welcomeMessage, timestamp: new Date() }]
        : [];

    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasNotified, setHasNotified] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null!);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = useCallback(
        async (text?: string) => {
            const content = text || input.trim();
            if (!content || isLoading) return;

            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: "user", content, timestamp: new Date() },
            ]);
            setInput("");
            setIsLoading(true);

            if (!hasNotified && onFirstMessage) {
                onFirstMessage();
                setHasNotified(true);
            }

            try {
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: content }),
                });
                const data: ChatResponse = await response.json();

                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: data.reply || "I'm not sure how to respond to that. Try saying \"help\" to see what I can do.",
                        timestamp: new Date(),
                    },
                ]);

                return data as ChatResponse;
            } catch {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: "Something went wrong. Please try again.",
                        timestamp: new Date(),
                    },
                ]);
            } finally {
                setIsLoading(false);
            }
        },
        [input, isLoading, hasNotified, onFirstMessage]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        },
        [sendMessage]
    );

    return {
        messages,
        input,
        isLoading,
        isEmpty: messages.length === 0,
        setInput,
        sendMessage,
        handleKeyDown,
        messagesEndRef,
    };
}
```

---
## src/lib/activity-log.ts
```typescript
/**
 * Activity Log System — Persistent JSON storage
 * Tracks system events for transparency and admin visibility.
 * Persists to /logs/activity.json so entries survive server restarts.
 */

import fs from "fs";
import path from "path";

export type ActivityType =
    | "audio_uploaded"
    | "transcription_completed"
    | "article_generated"
    | "article_published"
    | "mcp_tool_executed";

export interface ActivityEntry {
    id: string;
    type: ActivityType;
    timestamp: string;
    metadata: Record<string, unknown>;
}

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "activity.json");
const MAX_ENTRIES = 500;

/**
 * Read the log file from disk.
 */
function readLog(): ActivityEntry[] {
    try {
        if (!fs.existsSync(LOG_FILE)) return [];
        const raw = fs.readFileSync(LOG_FILE, "utf8");
        return JSON.parse(raw) as ActivityEntry[];
    } catch {
        return [];
    }
}

/**
 * Write the log to disk.
 */
function writeLog(entries: ActivityEntry[]): void {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
        fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), "utf8");
    } catch (error) {
        console.error("Failed to write activity log:", error);
    }
}

/**
 * Log a system activity event. Persists to JSON file.
 */
export function logActivity(
    type: ActivityType,
    metadata: Record<string, unknown> = {}
): ActivityEntry {
    const entry: ActivityEntry = {
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        timestamp: new Date().toISOString(),
        metadata,
    };

    const log = readLog();
    log.unshift(entry); // newest first

    // Cap at max entries
    if (log.length > MAX_ENTRIES) {
        log.length = MAX_ENTRIES;
    }

    writeLog(log);
    return entry;
}

/**
 * Get the activity log, newest first.
 */
export function getActivityLog(limit?: number): ActivityEntry[] {
    const log = readLog();
    if (limit) return log.slice(0, limit);
    return log;
}
```

---
## src/lib/auth.ts
```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        // Pure Google OAuth
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    pages: {
        signIn: "/admin/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET || "fallback_secret_for_development_only",
});

/**
 * Check if the current session user is the admin.
 */
export function isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return email === ADMIN_EMAIL;
}
```

---
## src/lib/commands.ts
```typescript
/**
 * Command Router
 *
 * Handles non-tool commands: greetings, help, admin access, and action commands.
 * Tool-based queries (post listing, search, summaries) are handled by the
 * MCP tool router — this module only handles conversational and action intents.
 */

export interface CommandResult {
    reply: string;
    action?: string;
}

export async function routeCommand(message: string): Promise<CommandResult> {
    const lower = message.toLowerCase().trim();

    // Hidden admin access
    if (lower === "/admin" || lower === "/studio") {
        return {
            reply: "Opening admin studio...",
            action: "open_admin_studio",
        };
    }

    // Process latest recording
    if (lower.includes("process") && (lower.includes("recording") || lower.includes("latest"))) {
        return {
            reply: "I'll process the latest recording. This will transcribe the audio and generate a blog post from it. (Requires OPENAI_API_KEY to be configured.)",
            action: "process_recording",
        };
    }

    // Publish draft
    if (lower.includes("publish") && lower.includes("draft")) {
        return {
            reply: "I'll publish the latest draft post. Let me check what's available...",
            action: "publish_draft",
        };
    }

    // Help
    if (lower.includes("what is this") || lower.includes("about this") || lower.includes("help")) {
        return {
            reply: "This is a **Conversational AI Publishing Platform**. Here's what I can do:\n\n• **Show recent posts** — List the latest blog posts\n• **Process latest recording** — Transcribe audio and generate a post\n• **Publish draft** — Publish a draft blog post\n• **Search posts** — Search blog posts by keyword\n\nJust type a command naturally!",
        };
    }

    // Greetings
    if (lower.match(/^(hi|hey|hello|yo|sup)\b/)) {
        return {
            reply: "Hey! 👋 I'm your AI publishing assistant. Try asking me to \"show recent posts\" or say \"help\" to see what I can do.",
        };
    }

    // Default
    return {
        reply: `I'm not sure how to handle that yet. Try saying **"help"** to see available commands.`,
    };
}
```

---
## src/lib/mcp/search-blog-posts.ts
```typescript
/**
 * MCP Tool: searchBlogPosts
 *
 * Searches blog posts by keyword in title and content.
 * Returns a ranked list of matching post slugs and titles.
 *
 * MCP Tool Definition:
 * {
 *   "name": "searchBlogPosts",
 *   "description": "Search blog posts for a keyword and return matching articles.",
 *   "parameters": { "query": "string" }
 * }
 */

import { getAllPosts } from "@/lib/posts";

export interface SearchResult {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    score: number;
}

/**
 * Search all blog posts for a keyword with relevance ranking.
 * Matches against title, excerpt, and content (case-insensitive).
 * Supports partial word matching and ranks by match quality.
 */
export async function searchBlogPosts(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    const terms = query.toLowerCase().trim().split(/\s+/);
    const posts = getAllPosts();

    const scored: SearchResult[] = [];

    for (const post of posts) {
        let score = 0;
        const titleLower = post.title.toLowerCase();
        const excerptLower = post.excerpt.toLowerCase();
        const contentLower = post.content?.toLowerCase() ?? "";

        for (const term of terms) {
            // Title match (highest weight)
            if (titleLower.includes(term)) score += 10;
            // Excerpt match (medium weight)
            if (excerptLower.includes(term)) score += 5;
            // Content match (lower weight)
            if (contentLower.includes(term)) score += 2;
        }

        // Exact phrase match bonus
        const fullQuery = query.toLowerCase().trim();
        if (titleLower.includes(fullQuery)) score += 15;
        if (excerptLower.includes(fullQuery)) score += 8;

        if (score > 0) {
            scored.push({
                slug: post.slug,
                title: post.title,
                date: post.date,
                excerpt: post.excerpt,
                score,
            });
        }
    }

    // Sort by relevance score (descending)
    return scored.sort((a, b) => b.score - a.score);
}

/**
 * Format search results as a readable string for chat display.
 */
export function formatSearchResults(query: string, results: SearchResult[]): string {
    if (results.length === 0) {
        return `No posts found matching "${query}". Try a different search term.`;
    }

    const list = results
        .map((r, i) => `${i + 1}. **${r.title}** (${r.date})\n   ${r.excerpt}`)
        .join("\n\n");

    return `🔍 Found ${results.length} post(s) matching "${query}":\n\n${list}`;
}
```

---
## src/lib/mcp/tool-registry.ts
```typescript
/**
 * MCP Tool Registry
 *
 * Single source of truth for all platform tools.
 * Each tool declares its name, description, access level, and execute function.
 */

import { getAllPosts } from "@/lib/posts";
import { searchBlogPosts, formatSearchResults } from "@/lib/mcp/search-blog-posts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolAccess = "public" | "admin";

export interface MCPTool {
    name: string;
    description: string;
    access: ToolAccess;
    execute: (params?: Record<string, unknown>) => Promise<string>;
}

// ---------------------------------------------------------------------------
// Defensive wrapper — no tool can crash the API
// ---------------------------------------------------------------------------

async function safeExecute(
    fn: () => Promise<string>,
    toolName: string
): Promise<string> {
    try {
        const result = await fn();
        return result || `${toolName} completed but returned no data.`;
    } catch (error) {
        console.error(`Tool ${toolName} failed:`, error);
        return `⚠️ ${toolName} encountered an error. Please try again.`;
    }
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const toolRegistry: MCPTool[] = [
    {
        name: "listRecentPosts",
        description: "Returns the most recent blog posts from the platform.",
        access: "public",
        execute: () =>
            safeExecute(async () => {
                const posts = getAllPosts();
                if (posts.length === 0) return "No blog posts yet.";
                const list = posts
                    .slice(0, 5)
                    .map((p, i) => `${i + 1}. **${p.title}** (${p.date})`)
                    .join("\n");
                return `📝 **Recent Posts**\n\n${list}`;
            }, "listRecentPosts"),
    },
    {
        name: "searchBlogPosts",
        description: "Search blog posts for a keyword and return matching articles.",
        access: "public",
        execute: (params) =>
            safeExecute(async () => {
                const query = (params?.query as string) || "";
                if (!query) return "Please provide a search term.";
                const results = await searchBlogPosts(query);
                return formatSearchResults(query, results);
            }, "searchBlogPosts"),
    },
    {
        name: "getPostSummary",
        description: "Returns a summary of all posts including total count and date range.",
        access: "public",
        execute: () =>
            safeExecute(async () => {
                const posts = getAllPosts();
                if (posts.length === 0) return "No posts available yet.";
                const newest = posts[0].date;
                const oldest = posts[posts.length - 1].date;
                return `📊 **Blog Summary**\n\n• Total posts: **${posts.length}**\n• Newest: ${newest}\n• Oldest: ${oldest}`;
            }, "getPostSummary"),
    },
];

// ---------------------------------------------------------------------------
// Access control
// ---------------------------------------------------------------------------

export function getToolsForUser(isAdmin: boolean): MCPTool[] {
    if (isAdmin) return toolRegistry;
    return toolRegistry.filter((t) => t.access === "public");
}
```

---
## src/lib/mcp/tool-router.ts
```typescript
/**
 * Tool Router
 *
 * Determines which MCP tool to invoke for a given user message.
 * Strategy: keyword matching first, LLM fallback second.
 */

import { MCPTool, getToolsForUser } from "@/lib/mcp/tool-registry";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Route a user message to the appropriate tool.
 * Returns the tool's output string, or "" if no tool matched.
 */
export async function routeToTool(
    message: string,
    isAdmin: boolean = false
): Promise<string> {
    const lower = message.toLowerCase();
    const tools = getToolsForUser(isAdmin);

    // 1. Keyword match — fast, deterministic
    for (const tool of tools) {
        if (matchesKeywords(lower, tool.name)) {
            return tool.execute(extractParams(lower, tool.name));
        }
    }

    // 2. LLM fallback — only when API key is available
    if (process.env.OPENAI_API_KEY) {
        return llmToolSelection(message, tools);
    }

    return "";
}

// ---------------------------------------------------------------------------
// Keyword matching
// ---------------------------------------------------------------------------

const KEYWORD_MAP: Record<string, string[]> = {
    listRecentPosts: [
        "recent posts", "latest posts", "show posts", "list posts",
        "what posts", "blog posts", "show me posts", "any posts",
        "what have you published", "what's been published",
    ],
    searchBlogPosts: [
        "search", "find posts", "posts about", "search blog", "search posts",
        "look for", "find articles", "articles about", "do you have posts",
    ],
    getPostSummary: [
        "post summary", "how many posts", "blog summary", "blog stats",
        "post count", "total posts", "overview",
    ],
};

function matchesKeywords(lower: string, toolName: string): boolean {
    const keywords = KEYWORD_MAP[toolName] || [];
    return keywords.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Parameter extraction
// ---------------------------------------------------------------------------

function extractParams(message: string, toolName: string): Record<string, unknown> {
    if (toolName === "searchBlogPosts") {
        const patterns = [
            /posts about (.+)/i,
            /search (?:for |blog )?(.+)/i,
            /find (?:posts )?(?:about )?(.+)/i,
        ];
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) return { query: match[1].trim() };
        }
        return { query: message };
    }
    return {};
}

// ---------------------------------------------------------------------------
// LLM fallback
// ---------------------------------------------------------------------------

async function llmToolSelection(message: string, tools: MCPTool[]): Promise<string> {
    const toolDescriptions = tools
        .map((t) => `- ${t.name}: ${t.description}`)
        .join("\n");

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an AI assistant for a publishing platform. You have access to these tools:\n\n${toolDescriptions}\n\nBased on the user's message, respond with ONLY the tool name to call, or "none" if no tool is needed.`,
                    },
                    { role: "user", content: message },
                ],
                temperature: 0,
            }),
        });

        if (!response.ok) return "";

        const data = await response.json();
        const toolChoice = data.choices[0]?.message?.content?.trim();

        if (toolChoice && toolChoice !== "none") {
            const tool = tools.find((t) => t.name === toolChoice);
            if (tool) {
                return tool.execute(extractParams(message.toLowerCase(), tool.name));
            }
        }
    } catch (error) {
        console.error("LLM tool selection error:", error);
        return "⚠️ I had trouble processing that request. Please try again.";
    }

    return "";
}
```

---
## src/lib/post-generator.ts
```typescript
import fs from "fs";
import path from "path";

const postsDir = path.join(process.cwd(), "posts");

export interface GeneratedPost {
    success: boolean;
    slug?: string;
    title?: string;
    error?: string;
}

/**
 * Generate a blog post from a transcript using OpenAI.
 * Requires OPENAI_API_KEY environment variable.
 */
export async function generatePostFromTranscript(transcript: string): Promise<GeneratedPost> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { success: false, error: "OPENAI_API_KEY not set in environment variables." };
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a blog post editor. Given a transcript of spoken content, create a well-structured blog post in markdown format.

Your output MUST follow this exact format:

---
title: "The Title"
date: "YYYY-MM-DD"
excerpt: "A brief summary in one sentence."
---

# The Title

(body content here in markdown)

Rules:
- Clean up filler words, repetition, and speech artifacts
- Organize into clear sections with headings
- Keep the author's voice and ideas intact
- Use proper markdown formatting
- The date should be today's date
- Generate a URL-friendly slug from the title (lowercase, hyphens, no special chars)
- Return ONLY the markdown content, nothing else`,
                    },
                    {
                        role: "user",
                        content: `Here is the transcript:\n\n${transcript}`,
                    },
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `OpenAI API error: ${errorText}` };
        }

        const data = await response.json();
        const markdownContent = data.choices[0]?.message?.content;

        if (!markdownContent) {
            return { success: false, error: "No content generated." };
        }

        // Extract title from frontmatter
        const titleMatch = markdownContent.match(/title:\s*"([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : "untitled-post";

        // Create slug from title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();

        // Save to posts directory
        if (!fs.existsSync(postsDir)) {
            fs.mkdirSync(postsDir, { recursive: true });
        }

        const filePath = path.join(postsDir, `${slug}.md`);
        fs.writeFileSync(filePath, markdownContent);

        return {
            success: true,
            slug,
            title,
        };
    } catch (error) {
        return { success: false, error: `Post generation failed: ${error}` };
    }
}
```

---
## src/lib/posts.ts
```typescript
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "posts");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Post {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    content: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a markdown file's frontmatter into a Post object. */
function parsePostFile(slug: string, raw: string): Post {
    const { data, content } = matter(raw);
    return {
        slug,
        title: data.title || slug,
        date: data.date || "",
        excerpt: data.excerpt || "",
        content,
    };
}

/** Read a single .md file and parse it, or return undefined if missing. */
function readPostFile(slug: string): Post | undefined {
    const filePath = path.join(postsDirectory, `${slug}.md`);
    if (!fs.existsSync(filePath)) return undefined;
    return parsePostFile(slug, fs.readFileSync(filePath, "utf8"));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAllPosts(): Post[] {
    if (!fs.existsSync(postsDirectory)) return [];

    return fs
        .readdirSync(postsDirectory)
        .filter((f) => f.endsWith(".md"))
        .map((f) => readPostFile(f.replace(/\.md$/, ""))!)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
    return readPostFile(slug);
}

export async function getPostHtml(content: string): Promise<string> {
    const result = await remark().use(html).process(content);
    return result.toString();
}

export function getAllSlugs(): string[] {
    if (!fs.existsSync(postsDirectory)) return [];
    return fs
        .readdirSync(postsDirectory)
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""));
}
```

---
## src/lib/transcription.ts
```typescript
import fs from "fs";
import path from "path";

const transcriptsDir = path.join(process.cwd(), "transcripts");

export interface TranscriptionResult {
    success: boolean;
    transcript?: string;
    fileName?: string;
    error?: string;
}

/**
 * Transcribe an audio file using OpenAI Whisper API.
 * Requires OPENAI_API_KEY environment variable.
 */
export async function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { success: false, error: "OPENAI_API_KEY not set in environment variables." };
    }

    try {
        const audioBuffer = fs.readFileSync(audioFilePath);
        const audioFileName = path.basename(audioFilePath);

        // Build multipart form data for Whisper API
        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: "audio/webm" });
        formData.append("file", blob, audioFileName);
        formData.append("model", "whisper-1");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `Whisper API error: ${errorText}` };
        }

        const data = await response.json();
        const transcript = data.text;

        // Store transcript
        if (!fs.existsSync(transcriptsDir)) {
            fs.mkdirSync(transcriptsDir, { recursive: true });
        }

        const transcriptFileName = audioFileName.replace(/\.[^.]+$/, ".txt");
        const transcriptPath = path.join(transcriptsDir, transcriptFileName);
        fs.writeFileSync(transcriptPath, transcript);

        return {
            success: true,
            transcript,
            fileName: transcriptFileName,
        };
    } catch (error) {
        return { success: false, error: `Transcription failed: ${error}` };
    }
}
```

