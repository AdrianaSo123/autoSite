import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";

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
});

/**
 * Check if the current session user is the admin.
 */
export function isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    return email === ADMIN_EMAIL;
}
