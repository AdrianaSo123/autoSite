import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminChat from "@/components/AdminChat";
import ActivityDashboard from "@/components/ActivityDashboard";

export const metadata = {
    title: "Studio — AI Publishing Platform",
};

export default async function StudioPage() {
    const session = await auth();

    // Unauthenticated or not admin → redirect to sign-in
    if (!session || !session.user?.isAdmin) {
        redirect("/admin/login");
    }

    // Admin → render full studio
    return (
        <div className="max-w-3xl mx-auto fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="sparkle text-sm">✦</span>
                    <h1
                        className="text-3xl font-semibold"
                        style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                    >
                        Studio
                    </h1>
                </div>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {session.user?.email}
                </span>
            </div>
            <div className="ink-divider mb-8" />

            <div className="mb-6">
                <p
                    className="text-sm mb-4"
                    style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
                >
                    Use the admin console below to control the publishing system.
                </p>
            </div>

            <AdminChat />

            <div className="mt-8">
                <ActivityDashboard />
            </div>
        </div>
    );
}
