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
        title: `${post.title} — So Studio`,
        description: post.excerpt,
    };
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const htmlContent = await getPostHtml(post.content);

    return (
        <div className="max-w-3xl mx-auto fade-in-up relative">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs mb-8" style={{ color: 'var(--text-secondary)', fontFamily: "var(--font-body)" }}>
                <Link href="/" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--ink)' }}>Home</Link>
                <span aria-hidden="true">/</span>
                <Link href="/blog" className="hover:opacity-70 transition-opacity" style={{ color: 'var(--ink)' }}>Blog</Link>
                <span aria-hidden="true">/</span>
                <span className="truncate max-w-[240px]" aria-current="page">{post.title}</span>
            </nav>
            <article>
                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)', fontFamily: "var(--font-body)" }}>
                    {formatDate(post.date)}
                </p>
                <h1
                    className="text-4xl font-semibold mb-8 leading-tight"
                    style={{ fontFamily: "var(--font-heading)", color: 'var(--ink)' }}
                >
                    {post.title}
                </h1>
                <div className="ink-divider mb-8" />
                <div
                    className="prose max-w-none text-base leading-relaxed"
                    style={{ color: 'var(--text-primary)', fontFamily: "var(--font-body)" }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </article>
        </div>
    );
}
