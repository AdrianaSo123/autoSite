"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function NavBar() {
    const { data: session } = useSession();
    const isAdmin = !!session?.user;

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
                className="flex gap-6 text-sm"
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
            </div>
        </nav>
    );
}
