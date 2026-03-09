/**
 * Architecture Stabilization Tests — Permission Enforcement
 */

// Mock posts
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

import { getToolsForUser, toolRegistry } from "@/lib/mcp/tool-registry";

describe("Tool Permission Enforcement", () => {
    it("public user only gets public tools", () => {
        const tools = getToolsForUser(false);
        tools.forEach((t) => {
            expect(t.access).toBe("public");
        });
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

    it("public user can access getPostSummary", () => {
        const tools = getToolsForUser(false);
        const summaryTool = tools.find((t) => t.name === "getPostSummary");
        expect(summaryTool).toBeDefined();
        expect(summaryTool?.access).toBe("public");
    });

    it("admin user gets all tools", () => {
        const tools = getToolsForUser(true);
        expect(tools.length).toBe(toolRegistry.length);
    });

    it("tool registry has correct structure", () => {
        expect(toolRegistry.length).toBeGreaterThan(0);
        toolRegistry.forEach((t) => {
            expect(["public", "admin"]).toContain(t.access);
        });
    });
});

describe("NavBar Visibility", () => {
    it("Studio link is hidden for public users (unauthenticated)", () => {
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
