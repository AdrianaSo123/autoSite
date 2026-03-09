/**
 * Sprint 17 Tests — MCP Tool Infrastructure (updated for architecture stabilization)
 */

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

import { toolRegistry, getToolsForUser } from "@/lib/mcp/tool-registry";

describe("Sprint 17 — MCP Tool Infrastructure", () => {
    it("has a tool registry with registered tools", () => {
        expect(toolRegistry).toBeDefined();
        expect(toolRegistry.length).toBeGreaterThan(0);
    });

    it("each tool has name, description, access, and execute", () => {
        for (const tool of toolRegistry) {
            expect(typeof tool.name).toBe("string");
            expect(typeof tool.description).toBe("string");
            expect(["public", "admin"]).toContain(tool.access);
            expect(typeof tool.execute).toBe("function");
        }
    });

    it("contains listRecentPosts tool", () => {
        expect(toolRegistry.find((t) => t.name === "listRecentPosts")).toBeDefined();
    });

    it("contains searchBlogPosts tool", () => {
        expect(toolRegistry.find((t) => t.name === "searchBlogPosts")).toBeDefined();
    });

    it("contains getPostSummary tool", () => {
        expect(toolRegistry.find((t) => t.name === "getPostSummary")).toBeDefined();
    });

    it("provides getToolsForUser function", () => {
        expect(typeof getToolsForUser).toBe("function");
    });
});
