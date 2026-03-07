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
        <div className="max-w-3xl mx-auto">
            <Link
                href="/blog"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-6 inline-block"
            >
                ← Back to Blog
            </Link>
            <article>
                <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
                <p className="text-sm text-gray-500 mb-8">{post.date}</p>
                <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </article>
        </div>
    );
}
