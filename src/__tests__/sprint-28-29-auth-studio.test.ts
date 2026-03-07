/**
 * Sprint 28+29 Tests — Authentication & Studio Access
 */

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [],
}));

import { isAdmin } from "@/lib/auth";

describe("Sprint 28 — Google Authentication", () => {
    it("isAdmin returns true for admin email", () => {
        expect(isAdmin("admin@example.com")).toBe(true);
    });

    it("isAdmin returns false for non-admin email", () => {
        expect(isAdmin("user@example.com")).toBe(false);
    });

    it("isAdmin returns false for null email", () => {
        expect(isAdmin(null)).toBe(false);
    });

    it("isAdmin returns false for undefined email", () => {
        expect(isAdmin(undefined)).toBe(false);
    });
});

describe("Sprint 29 — Admin Studio Access", () => {
    it("admin user can access studio (isAdmin === true)", () => {
        const adminEmail = "admin@example.com";
        expect(isAdmin(adminEmail)).toBe(true);
    });

    it("non-admin user cannot access studio", () => {
        const regularEmail = "user@gmail.com";
        expect(isAdmin(regularEmail)).toBe(false);
    });

    it("studio nav visibility logic: hidden for non-admin", () => {
        const session = { user: { email: "random@gmail.com" } };
        const showStudio = isAdmin(session.user.email);
        expect(showStudio).toBe(false);
    });

    it("studio nav visibility logic: shown for admin", () => {
        const session = { user: { email: "admin@example.com" } };
        const showStudio = isAdmin(session.user.email);
        expect(showStudio).toBe(true);
    });
});
