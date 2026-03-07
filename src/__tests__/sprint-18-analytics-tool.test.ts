/**
 * Sprint 18 Tests — Site Analytics MCP Tool
 */
import { getSiteAnalytics } from "@/lib/mcp/get-site-analytics";

// Mock posts
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

describe("Sprint 18 — Site Analytics MCP Tool", () => {
    it("returns analytics data with expected shape", async () => {
        const analytics = await getSiteAnalytics();

        expect(analytics).toHaveProperty("totalVisitors");
        expect(analytics).toHaveProperty("pageViews");
        expect(analytics).toHaveProperty("todayVisitors");
        expect(analytics).toHaveProperty("mostPopularPosts");
        expect(analytics).toHaveProperty("lastUpdated");
    });

    it("returns numeric visitor counts", async () => {
        const analytics = await getSiteAnalytics();

        expect(typeof analytics.totalVisitors).toBe("number");
        expect(typeof analytics.pageViews).toBe("number");
        expect(typeof analytics.todayVisitors).toBe("number");
    });

    it("returns most popular posts as an array", async () => {
        const analytics = await getSiteAnalytics();

        expect(Array.isArray(analytics.mostPopularPosts)).toBe(true);
    });

    it("returns a valid ISO timestamp", async () => {
        const analytics = await getSiteAnalytics();

        expect(() => new Date(analytics.lastUpdated)).not.toThrow();
    });
});
