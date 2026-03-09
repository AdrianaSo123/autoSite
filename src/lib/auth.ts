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
    secret: process.env.AUTH_SECRET || "fallback_secret_for_development_only",
});


