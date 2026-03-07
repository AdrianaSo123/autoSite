"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function NavBar() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL
        || session?.user?.email === "admin@example.com";

    return (
        <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
                href="/"
                className="font-semibold text-lg tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
            >
                ✦ AI Platform ✦
            </Link>
            <div
                className="flex gap-6 items-center text-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                <Link
                    href="/blog"
                    className="hover:opacity-70 transition-opacity"
                    style={{ color: "var(--ink)" }}
                >
                    Blog
                </Link>
                {isAdmin && (
                    <Link
                        href="/studio"
                        className="hover:opacity-70 transition-opacity"
                        style={{ color: "var(--ink)" }}
                    >
                        Studio
                    </Link>
                )}
                {session ? (
                    <button
                        onClick={() => signOut()}
                        className="hover:opacity-70 transition-opacity text-xs"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Sign out
                    </button>
                ) : (
                    <button
                        onClick={() => signIn("google")}
                        className="pill-button-outline text-xs py-1.5 px-4"
                        style={{ borderRadius: "999px" }}
                    >
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    );
}
