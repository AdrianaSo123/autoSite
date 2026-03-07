/**
 * Sprint 19 Tests — Chat Command Router
 */
import { routeCommand } from "@/lib/commands";

// Mock posts
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

// Mock analytics
jest.mock("@/lib/mcp/get-site-analytics", () => ({
    getSiteAnalytics: () =>
        Promise.resolve({
            totalVisitors: 100,
            pageViews: 500,
            todayVisitors: 20,
            mostPopularPosts: [{ title: "Test Post", views: 50 }],
            lastUpdated: new Date().toISOString(),
        }),
}));

describe("Sprint 19 — Chat Command Router", () => {
    it("routes 'show recent posts' to post listing", async () => {
        const result = await routeCommand("show recent posts");
        expect(result.reply).toContain("Test Post");
    });

    it("routes 'help' to help text", async () => {
        const result = await routeCommand("help");
        expect(result.reply).toContain("Show recent posts");
    });

    it("routes greeting correctly", async () => {
        const result = await routeCommand("hello");
        expect(result.reply).toContain("AI publishing assistant");
    });

    it("routes analytics query to analytics tool", async () => {
        const result = await routeCommand("how many visitors");
        expect(result.reply).toContain("Analytics");
    });

    it("handles unknown commands gracefully", async () => {
        const result = await routeCommand("xyzzy random thing");
        expect(result.reply).toContain("help");
    });
});
