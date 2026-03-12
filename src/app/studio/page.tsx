import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminChat from "@/components/AdminChat";

export const metadata = {
    title: "Studio — So Studio",
};

export default async function StudioPage() {
    const session = await auth();

    // Unauthenticated or not admin → redirect to sign-in
    if (!session || !session.user?.isAdmin) {
        redirect("/admin/login");
    }

    // Admin → render full studio
    return (
        <div className="flex flex-col flex-1 fade-in-up w-full">
            {/* Studio header */}
            <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="sparkle text-sm">✦</span>
                    <h1
                        className="text-2xl font-semibold"
                        style={{ fontFamily: "var(--font-heading)", color: "var(--ink)" }}
                    >
                        Studio
                    </h1>
                </div>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {session.user?.email}
                </span>
            </div>

            {/* Full-screen chat — matches homepage layout */}
            <section className="w-full max-w-5xl mx-auto flex flex-col">
                <AdminChat />
            </section>
        </div>
    );
}
