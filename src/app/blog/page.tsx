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
