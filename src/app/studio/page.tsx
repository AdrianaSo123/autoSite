import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
    title: "Studio — AI Publishing Platform",
};

export default async function StudioPage() {
    const session = await auth();

    if (!session) {
        redirect("/admin/login");
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Studio</h1>
                <span className="text-sm text-gray-500">Signed in as {session.user?.email}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href="/blog"
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow block"
                >
                    <h2 className="font-semibold mb-2">📝 Blog Posts</h2>
                    <p className="text-sm text-gray-500">View and manage your published posts.</p>
                </Link>

                <div className="border rounded-lg p-6">
                    <h2 className="font-semibold mb-2">🎙️ Recordings</h2>
                    <p className="text-sm text-gray-500">Upload and process audio recordings.</p>
                </div>

                <div className="border rounded-lg p-6">
                    <h2 className="font-semibold mb-2">💬 Chat Control</h2>
                    <p className="text-sm text-gray-500">Admin chat commands for system control.</p>
                </div>

                <div className="border rounded-lg p-6">
                    <h2 className="font-semibold mb-2">📊 Analytics</h2>
                    <p className="text-sm text-gray-500">Site traffic and visitor data.</p>
                </div>
            </div>
        </div>
    );
}
