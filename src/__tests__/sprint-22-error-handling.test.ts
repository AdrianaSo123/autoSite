/**
 * Sprint 22 Tests — Reliability and Error Handling (TDD)
 */
import { routeCommand } from "@/lib/commands";

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [],
}));

jest.mock("@/lib/mcp/get-site-analytics", () => ({
    getSiteAnalytics: () => Promise.reject(new Error("API timeout")),
}));

describe("Sprint 22 — Reliability and Error Handling", () => {
    it("handles empty post list gracefully", async () => {
        const result = await routeCommand("show recent posts");
        expect(result.reply).toContain("No blog posts");
    });

    it("handles analytics failure gracefully", async () => {
        const result = await routeCommand("how many visitors");
        expect(result.reply).toBeDefined();
        expect(typeof result.reply).toBe("string");
        // Should not throw
    });

    it("handles unknown commands without crashing", async () => {
        const result = await routeCommand("");
        expect(result.reply).toBeDefined();
    });

    it("handles very long messages without crashing", async () => {
        const longMsg = "a".repeat(10000);
        const result = await routeCommand(longMsg);
        expect(result.reply).toBeDefined();
    });

    it("handles special characters in messages", async () => {
        const result = await routeCommand("hello <script>alert('xss')</script>");
        expect(result.reply).toBeDefined();
    });
});
