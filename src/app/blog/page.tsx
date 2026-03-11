import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
    title: "Blog — So Studio",
    description: "Ideas, articles, and thoughts from So Studio.",
};

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

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
                    style={{ fontFamily: "var(--font-heading)", color: 'var(--ink)' }}
                >
                    Blog
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Ideas, articles, and thoughts — all from voice to page.
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif" }}>
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'} published
                </p>
                <div className="ink-divider max-w-xs mx-auto mt-6" />
            </div>

            <div className="flex flex-col gap-5">
                {posts.map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                        <article className="ink-card">
                            <h2
                                className="text-xl font-semibold mb-1 group-hover:opacity-80 transition-opacity"
                                style={{ fontFamily: "var(--font-heading)", color: 'var(--ink)' }}
                            >
                                {post.title}
                            </h2>
                            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', fontFamily: "var(--font-body)" }}>
                                {formatDate(post.date)}
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: "var(--font-body)" }}>
                                {post.excerpt}
                            </p>
                            <span
                                className="text-sm mt-3 inline-block group-hover:opacity-70 transition-opacity"
                                style={{ color: 'var(--ink)', fontFamily: "var(--font-heading)", fontStyle: 'italic' }}
                            >
                                Read more →
                            </span>
                        </article>
                    </Link>
                ))}
            </div>
        </div>
    );
}
