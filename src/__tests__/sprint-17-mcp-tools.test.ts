/**
 * Sprint 17 Tests — MCP Tool Infrastructure
 */

// Mock posts to avoid gray-matter ESM import issues in test
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

import { toolRegistry } from "@/lib/agent";

describe("Sprint 17 — MCP Tool Infrastructure", () => {
    it("has a tool registry with registered tools", () => {
        expect(toolRegistry).toBeDefined();
        expect(toolRegistry.length).toBeGreaterThan(0);
    });

    it("each tool has name, description, and execute", () => {
        for (const tool of toolRegistry) {
            expect(tool.name).toBeDefined();
            expect(typeof tool.name).toBe("string");
            expect(tool.description).toBeDefined();
            expect(typeof tool.description).toBe("string");
            expect(tool.execute).toBeDefined();
            expect(typeof tool.execute).toBe("function");
        }
    });

    it("contains getSiteAnalytics tool", () => {
        const analyticsTool = toolRegistry.find((t) => t.name === "getSiteAnalytics");
        expect(analyticsTool).toBeDefined();
    });

    it("contains getRecentPosts tool", () => {
        const postsTool = toolRegistry.find((t) => t.name === "getRecentPosts");
        expect(postsTool).toBeDefined();
    });

    it("contains getSystemStatus tool", () => {
        const statusTool = toolRegistry.find((t) => t.name === "getSystemStatus");
        expect(statusTool).toBeDefined();
    });
});
