"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

export default function NavBar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    return (
        <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
                href="/"
                className="font-semibold text-lg tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
            >
                ✦ adriana.so ✦
            </Link>
            <div
                className="flex gap-6 items-center text-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                <Link
                    href="/blog"
                    className="transition-opacity"
                    style={{
                        color: "var(--ink)",
                        opacity: isActive("/blog") ? 1 : 0.6,
                        fontWeight: isActive("/blog") ? 600 : 400,
                        borderBottom: isActive("/blog") ? "1.5px solid var(--ink)" : "none",
                        paddingBottom: "2px",
                    }}
                >
                    Blog
                </Link>
                {session?.user?.isAdmin && (
                    <Link
                        href="/studio"
                        className="transition-opacity"
                        style={{
                            color: "var(--ink)",
                            opacity: isActive("/studio") ? 1 : 0.6,
                            fontWeight: isActive("/studio") ? 600 : 400,
                            borderBottom: isActive("/studio") ? "1.5px solid var(--ink)" : "none",
                            paddingBottom: "2px",
                        }}
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
                        title="Sign in to access the admin studio"
                    >
                        Admin
                    </button>
                )}
            </div>
        </nav>
    );
}
