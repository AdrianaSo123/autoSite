import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const posts = getAllPosts().slice(0, 5);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h1 className="text-4xl font-bold mb-4">Conversational Publishing Platform</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl text-center mb-8">
        Welcome to your AI-powered publishing platform. Ask me anything below.
      </p>

      {/* Chat Interface */}
      <ChatInterface />

      {/* Recent posts */}
      <div className="w-full max-w-2xl mt-12">
        <h2 className="text-2xl font-semibold mb-4">Recent Posts</h2>
        {posts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow block"
              >
                <h3 className="font-semibold">{post.title}</h3>
                <p className="text-sm text-gray-500">{post.date}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 flex items-center justify-center text-gray-400">
            No posts yet
          </div>
        )}
      </div>
    </div>
  );
}
