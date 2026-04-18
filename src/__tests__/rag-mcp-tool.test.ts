/**
 * RAG MCP Tool Tests
 */

// Mock the retrieval engine
jest.mock("@/lib/rag/retrieve", () => ({
    retrieveRelevantChunks: jest.fn(),
}));

// Mock keyword search for fallback testing
jest.mock("@/lib/mcp/search-blog-posts", () => ({
    searchBlogPosts: jest.fn(),
    formatSearchResults: jest.fn(),
}));

// Mock posts (required by tool-registry transitive imports)
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [],
}));

import { semanticSearchPosts } from "@/lib/mcp/semantic-search-posts";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { searchBlogPosts, formatSearchResults } from "@/lib/mcp/search-blog-posts";
import { getToolsForUser } from "@/lib/mcp/tool-registry";

const mockRetrieve = retrieveRelevantChunks as jest.MockedFunction<typeof retrieveRelevantChunks>;
const mockKeywordSearch = searchBlogPosts as jest.MockedFunction<typeof searchBlogPosts>;
const mockFormatResults = formatSearchResults as jest.MockedFunction<typeof formatSearchResults>;

beforeEach(() => {
    mockRetrieve.mockReset();
    mockKeywordSearch.mockReset();
    mockFormatResults.mockReset();
});

// ---------------------------------------------------------------------------
// semanticSearchPosts function
// ---------------------------------------------------------------------------

describe("semanticSearchPosts", () => {
    it("returns formatted string when chunks are found", async () => {
        mockRetrieve.mockResolvedValue([
            {
                id: "p1_chunk_0", text: "AI transforms education",
                slug: "ai-edu", title: "AI in Education", date: "2026-01-01",
                chunkIndex: 0, score: 0.92,
            },
        ]);

        const result = await semanticSearchPosts("AI education");

        expect(result).toContain("Found 1 post(s)");
        expect(result).toContain("AI in Education");
        expect(result).toContain("/blog/ai-edu");
    });

    it("returns 'No posts found' when no chunks match", async () => {
        mockRetrieve.mockResolvedValue([]);

        const result = await semanticSearchPosts("blockchain");

        expect(result).toContain("No posts found");
    });

    it("falls back to keyword search on retrieval error", async () => {
        mockRetrieve.mockRejectedValue(new Error("Index not found"));
        mockKeywordSearch.mockResolvedValue([]);
        mockFormatResults.mockReturnValue("No posts found matching \"test\".");

        const result = await semanticSearchPosts("test");

        expect(mockKeywordSearch).toHaveBeenCalledWith("test");
        expect(result).toContain("No posts found");
    });

    it("returns help text for empty query", async () => {
        const result = await semanticSearchPosts("");
        expect(result).toContain("Please provide a search term");
    });

    it("deduplicates post references from multiple chunks", async () => {
        mockRetrieve.mockResolvedValue([
            {
                id: "p1_0", text: "chunk 1", slug: "ai-edu",
                title: "AI in Education", date: "2026-01-01",
                chunkIndex: 0, score: 0.9,
            },
            {
                id: "p1_1", text: "chunk 2", slug: "ai-edu",
                title: "AI in Education", date: "2026-01-01",
                chunkIndex: 1, score: 0.85,
            },
        ]);

        const result = await semanticSearchPosts("AI education");

        // Should show 1 post, not 2 entries
        expect(result).toContain("Found 1 post(s)");
    });
});

// ---------------------------------------------------------------------------
// Tool registry integration
// ---------------------------------------------------------------------------

describe("semanticSearchPosts tool registration", () => {
    it("is registered as a public tool", () => {
        const tools = getToolsForUser(false);
        const semanticTool = tools.find((t) => t.name === "semanticSearchPosts");
        expect(semanticTool).toBeDefined();
        expect(semanticTool?.access).toBe("public");
    });

    it("admin user also has access", () => {
        const tools = getToolsForUser(true);
        const semanticTool = tools.find((t) => t.name === "semanticSearchPosts");
        expect(semanticTool).toBeDefined();
    });
});
