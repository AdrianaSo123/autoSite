"use client";

import Link from "next/link";
import ChatInterface from "@/components/ChatInterface";

interface HomeClientProps {
    posts: { slug: string; title: string; date: string; excerpt: string }[];
}

export default function HomeClient({ posts }: HomeClientProps) {
    return (
        <div className="flex flex-col items-center fade-in-up">
            {/* ✦ Primary Chat Interface — conversation-first */}
            <section className="w-full max-w-4xl mb-12">
                <ChatInterface />
            </section>

            {/* ✦ Recent Posts — content discovery below chat */}
            <section className="w-full max-w-3xl mb-16">
                <div className="ink-divider mb-10" />

                <div className="flex items-center justify-center gap-3 mb-8">
                    <span className="sparkle text-sm">✦</span>
                    <h2
                        className="text-2xl md:text-3xl font-semibold"
                        style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                    >
                        Recent Posts
                    </h2>
                    <span className="sparkle text-sm">✦</span>
                </div>

                {posts.length > 0 ? (
                    <div className="grid gap-5">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="ink-card block group"
                            >
                                <h3
                                    className="text-lg font-semibold mb-1 group-hover:opacity-80 transition-opacity"
                                    style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                                >
                                    {post.title}
                                </h3>
                                <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                                    {post.date}
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                                    {post.excerpt}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div
                        className="ink-card text-center py-12"
                        style={{ borderStyle: "dashed", color: "var(--text-secondary)" }}
                    >
                        No posts yet — record your first idea
                    </div>
                )}
            </section>
        </div>
    );
}
