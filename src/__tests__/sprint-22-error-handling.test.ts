/**
 * Sprint 22 Tests — Reliability and Error Handling
 *
 * Tests that the command router handles edge cases gracefully:
 * empty input, very long messages, special characters.
 */

// commands.ts imports getAllPosts from posts.ts, which imports remark (ESM-only).
// Mock posts at the module level so Jest doesn't need to resolve the ESM chain.
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
    getPostBySlug: () => undefined,
    getAllSlugs: () => ["test"],
}));

import { routeCommand } from "@/lib/commands";

describe("Sprint 22 — Reliability and Error Handling", () => {
    // routeCommand returns null when no command pattern matches — the caller
    // (chat route) is responsible for the fallback reply. Null-return IS the
    // graceful handling; the function must not throw.
    it("handles empty input without crashing (returns null)", async () => {
        const result = await routeCommand("");
        expect(result).toBeNull();
    });

    it("handles very long messages without crashing (returns null)", async () => {
        const longMsg = "a".repeat(10000);
        const result = await routeCommand(longMsg);
        expect(result).toBeNull();
    });

    it("handles special characters in messages", async () => {
        // Starts with a greeting prefix — should still return a valid reply.
        const result = await routeCommand("hello <script>alert('xss')</script>");
        expect(result).not.toBeNull();
        expect(result!.reply).toBeDefined();
    });

    it("returns null for unknown commands (caller handles fallback)", async () => {
        const result = await routeCommand("xyzzy something unknown");
        expect(result).toBeNull();
    });
});
