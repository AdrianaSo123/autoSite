"use client";

import { useState } from "react";
import Link from "next/link";
import ChatInterface from "@/components/ChatInterface";

interface HomeClientProps {
    posts: { slug: string; title: string; date: string; excerpt: string }[];
}

export default function HomeClient({ posts }: HomeClientProps) {
    const [hasInteracted, setHasInteracted] = useState(false);

    return (
        <div className="flex flex-col items-center fade-in-up">
            {/* ✦ Hero Section — collapses after first interaction */}
            <section
                className="w-full max-w-3xl text-center transition-all duration-700 ease-in-out overflow-hidden"
                style={{
                    paddingTop: hasInteracted ? '2rem' : '4rem',
                    paddingBottom: hasInteracted ? '1rem' : '4rem',
                    opacity: 1,
                }}
            >
                {/* Decorative sparkles */}
                {!hasInteracted && (
                    <div className="flex justify-center gap-8 mb-6 transition-opacity duration-500">
                        <span className="sparkle text-lg" style={{ animationDelay: '0s' }}>✦</span>
                        <span className="sparkle text-sm" style={{ animationDelay: '0.5s' }}>✦</span>
                        <span className="sparkle text-lg" style={{ animationDelay: '1s' }}>✦</span>
                    </div>
                )}

                <h1
                    className="font-semibold leading-tight transition-all duration-500"
                    style={{
                        fontFamily: "'Playfair Display', serif",
                        color: 'var(--ink)',
                        fontSize: hasInteracted ? '1.75rem' : undefined,
                    }}
                >
                    {hasInteracted ? (
                        "AI Platform"
                    ) : (
                        <>
                            <em className="text-5xl md:text-6xl">Welcome to</em>
                            <br />
                            <span className="text-5xl md:text-6xl">AI Platform</span>
                        </>
                    )}
                </h1>

                {!hasInteracted && (
                    <>
                        <p
                            className="text-base md:text-lg max-w-xl mx-auto mb-4 leading-relaxed mt-6"
                            style={{ color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif" }}
                        >
                            A conversational publishing platform that transforms
                            your voice into beautifully written articles.
                        </p>

                        <p
                            className="text-sm mb-10 italic"
                            style={{ color: 'var(--text-secondary)', fontFamily: "'Playfair Display', serif" }}
                        >
                            Speak your ideas. Let AI do the rest.
                        </p>

                        <div className="ink-divider max-w-xs mx-auto" />
                    </>
                )}
            </section>

            {/* ✦ Chat Section — primary interaction area */}
            <section className="w-full max-w-4xl mb-16">
                {!hasInteracted && (
                    <div className="text-center mb-6">
                        <span className="sparkle text-sm mr-2">✦</span>
                        <span
                            className="text-sm uppercase tracking-widest"
                            style={{ color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                        >
                            Ask me anything
                        </span>
                        <span className="sparkle text-sm ml-2">✦</span>
                    </div>
                )}
                <ChatInterface onFirstMessage={() => setHasInteracted(true)} />
            </section>

            {/* ✦ Recent Posts Section */}
            <section className="w-full max-w-3xl mb-16">
                <div className="ink-divider mb-10" />

                <div className="flex items-center justify-center gap-3 mb-8">
                    <span className="sparkle text-sm">✦</span>
                    <h2
                        className="text-2xl md:text-3xl font-semibold"
                        style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
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
                                    style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                                >
                                    {post.title}
                                </h3>
                                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    {post.date}
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    {post.excerpt}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div
                        className="ink-card text-center py-12"
                        style={{ borderStyle: 'dashed', color: 'var(--text-secondary)' }}
                    >
                        No posts yet — record your first idea
                    </div>
                )}
            </section>
        </div>
    );
}
