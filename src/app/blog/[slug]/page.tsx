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
