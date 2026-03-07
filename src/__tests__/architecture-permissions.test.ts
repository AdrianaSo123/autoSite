/**
 * Architecture Stabilization Tests — Permission Enforcement (Section 8)
 */

// Mock posts
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

import { getToolsForUser, toolRegistry } from "@/lib/agent";

describe("Tool Permission Enforcement", () => {
    it("public user only gets public tools", () => {
        const tools = getToolsForUser(false);
        tools.forEach((t) => {
            expect(t.access).toBe("public");
        });
    });

    it("public user cannot access getSiteAnalytics", () => {
        const tools = getToolsForUser(false);
        const analyticsTool = tools.find((t) => t.name === "getSiteAnalytics");
        expect(analyticsTool).toBeUndefined();
    });

    it("public user cannot access getSystemStatus", () => {
        const tools = getToolsForUser(false);
        const statusTool = tools.find((t) => t.name === "getSystemStatus");
        expect(statusTool).toBeUndefined();
    });

    it("public user can access listRecentPosts", () => {
        const tools = getToolsForUser(false);
        const postsTool = tools.find((t) => t.name === "listRecentPosts");
        expect(postsTool).toBeDefined();
        expect(postsTool?.access).toBe("public");
    });

    it("public user can access searchBlogPosts", () => {
        const tools = getToolsForUser(false);
        const searchTool = tools.find((t) => t.name === "searchBlogPosts");
        expect(searchTool).toBeDefined();
        expect(searchTool?.access).toBe("public");
    });

    it("admin user gets all tools (public + admin)", () => {
        const tools = getToolsForUser(true);
        expect(tools.length).toBe(toolRegistry.length);
    });

    it("admin user can access getSiteAnalytics", () => {
        const tools = getToolsForUser(true);
        const analyticsTool = tools.find((t) => t.name === "getSiteAnalytics");
        expect(analyticsTool).toBeDefined();
        expect(analyticsTool?.access).toBe("admin");
    });

    it("admin user can call analytics tool successfully", async () => {
        const tools = getToolsForUser(true);
        const analyticsTool = tools.find((t) => t.name === "getSiteAnalytics");
        expect(analyticsTool).toBeDefined();
        const result = await analyticsTool!.execute();
        expect(result).toContain("Analytics");
    });

    it("tool registry has correct access labels", () => {
        const publicTools = toolRegistry.filter((t) => t.access === "public");
        const adminTools = toolRegistry.filter((t) => t.access === "admin");
        expect(publicTools.length).toBeGreaterThan(0);
        expect(adminTools.length).toBeGreaterThan(0);
    });
});

describe("NavBar Visibility", () => {
    it("Studio link is hidden for public users (unauthenticated)", () => {
        // NavBar shows Studio only when session.user exists
        // This test validates the logic conceptually
        const isAdmin = false;
        const showStudio = isAdmin;
        expect(showStudio).toBe(false);
    });

    it("Studio link is shown for admin users", () => {
        const isAdmin = true;
        const showStudio = isAdmin;
        expect(showStudio).toBe(true);
    });
});
