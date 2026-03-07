import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
    title: "Blog — AI Publishing Platform",
    description: "Browse all blog posts on the AI Publishing Platform.",
};

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Blog</h1>
            <div className="flex flex-col gap-6">
                {posts.map((post) => (
                    <article
                        key={post.slug}
                        className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                        <Link href={`/blog/${post.slug}`}>
                            <h2 className="text-xl font-semibold mb-2 hover:underline">
                                {post.title}
                            </h2>
                        </Link>
                        <p className="text-sm text-gray-500 mb-3">{post.date}</p>
                        <p className="text-gray-600 dark:text-gray-400">{post.excerpt}</p>
                        <Link
                            href={`/blog/${post.slug}`}
                            className="text-blue-600 dark:text-blue-400 text-sm mt-3 inline-block hover:underline"
                        >
                            Read more →
                        </Link>
                    </article>
                ))}
            </div>
        </div>
    );
}
