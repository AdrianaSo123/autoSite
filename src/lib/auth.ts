import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";

declare module "next-auth" {
    interface Session {
        user: {
            isAdmin: boolean;
        } & DefaultSession["user"];
    }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

/**
 * Check if the current session user is the admin.
 */
export function isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return email === ADMIN_EMAIL;
}

/**
 * Resolve the auth secret. Throws at startup in production if AUTH_SECRET is
 * not set — a hardcoded fallback in production allows JWT forgery by anyone
 * who sees the source code (OWASP A02: Cryptographic Failures).
 */
function resolveAuthSecret(): string {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                "AUTH_SECRET environment variable is not set. " +
                "This is required in production to sign JWT tokens securely."
            );
        }
        return "fallback_secret_for_development_only";
    }
    return secret;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        // Pure Google OAuth
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    pages: {
        signIn: "/admin/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        session({ session }) {
            if (session.user) {
                session.user.isAdmin = isAdmin(session.user.email);
            }
            return session;
        }
    },
    secret: resolveAuthSecret(),
});


