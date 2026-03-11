"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        await signIn("google", { callbackUrl: "/studio" });
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div
                className="w-full max-w-sm rounded-2xl p-10 text-center"
                style={{
                    border: "1.5px solid var(--ink-border)",
                    background: "var(--cream-light)",
                }}
            >
                <span className="sparkle text-base block mb-4">✦</span>
                <h1
                    className="text-2xl font-semibold mb-2"
                    style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                >
                    Studio Access
                </h1>
                <p
                    className="text-sm mb-8"
                    style={{ color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}
                >
                    Sign in with your Google account to access the admin studio.
                </p>
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="pill-button w-full disabled:opacity-50"
                    style={{ borderRadius: "999px" }}
                >
                    {loading ? "Redirecting..." : "Continue with Google"}
                </button>
            </div>
        </div>
    );
}
