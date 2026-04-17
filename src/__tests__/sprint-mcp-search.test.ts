/**
 * MCP Tool Test — searchBlogPosts
 */

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        {
            slug: "building-with-ai",
            title: "Building with AI: A New Approach",
            date: "2026-03-05",
            excerpt: "How AI is transforming software development.",
            content: "# Building with AI\n\nAI is changing the way we build things.",
        },
        {
            slug: "ai-publishing-platform",
            title: "Welcome to the AI Publishing Platform",
            date: "2026-03-06",
            excerpt: "An introduction to our conversational AI publishing platform.",
            content: "# Welcome\n\nThis platform turns voice into articles.",
        },
        {
            slug: "weekend-cooking-tips",
            title: "Weekend Cooking Tips",
            date: "2026-03-04",
            excerpt: "Five recipes to try this weekend.",
            content: "# Cooking\n\nTry these recipes for the weekend.",
        },
    ],
}));

import { searchBlogPosts, formatSearchResults } from "@/lib/mcp/search-blog-posts";

describe("searchBlogPosts MCP Tool", () => {
    it("returns matching posts when query matches title", async () => {
        const results = await searchBlogPosts("AI");
        expect(results.length).toBe(2);
        expect(results.map((r) => r.slug)).toContain("building-with-ai");
        expect(results.map((r) => r.slug)).toContain("ai-publishing-platform");
    });

    it("returns empty array when no posts match", async () => {
        const results = await searchBlogPosts("blockchain");
        expect(results).toEqual([]);
    });

    it("handles case-insensitive search", async () => {
        const upper = await searchBlogPosts("AI");
        const lower = await searchBlogPosts("ai");
        expect(upper.length).toBe(lower.length);
    });

    it("searches content as well as title", async () => {
        const results = await searchBlogPosts("recipes");
        expect(results.length).toBe(1);
        expect(results[0].slug).toBe("weekend-cooking-tips");
    });

    it("returns empty for empty query", async () => {
        const results = await searchBlogPosts("");
        expect(results).toEqual([]);
    });

    it("formats results as a readable string", () => {
        const results = [
            { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test.", score: 10 },
        ];
        const formatted = formatSearchResults("test", results);
        expect(formatted).toContain("Found 1 post(s)");
        expect(formatted).toContain("Test Post");
    });

    it("formats empty results with a helpful message", () => {
        const formatted = formatSearchResults("xyz", []);
        expect(formatted).toContain("No posts found");
        expect(formatted).toContain("xyz");
    });
});
