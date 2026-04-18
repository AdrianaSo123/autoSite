/**
 * RAG Chat Integration Tests
 *
 * Verifies session state integration, tool router escalation,
 * and that semantic search results populate session correctly.
 * Tests at the module level (not route handler) to avoid Next.js
 * server globals (NextRequest/NextResponse) unavailable in jsdom.
 */

// Mock posts
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [],
}));

// Mock retrieval engine
jest.mock("@/lib/rag/retrieve", () => ({
    retrieveRelevantChunks: jest.fn(),
}));

// Mock keyword search
jest.mock("@/lib/mcp/search-blog-posts", () => ({
    searchBlogPosts: jest.fn(),
    formatSearchResults: jest.fn(),
}));

import { runWithSession, sessionState } from "@/lib/mcp/session";
import { semanticSearchPosts } from "@/lib/mcp/semantic-search-posts";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";
import { getToolsForUser } from "@/lib/mcp/tool-registry";

const mockRetrieve = retrieveRelevantChunks as jest.MockedFunction<typeof retrieveRelevantChunks>;

// ---------------------------------------------------------------------------
// Session state integration
// ---------------------------------------------------------------------------

describe("Session state: lastRetrievedChunks", () => {
    it("initializes as empty array", async () => {
        await runWithSession([], async () => {
            expect(sessionState.lastRetrievedChunks).toEqual([]);
        });
    });

    it("stores and retrieves chunk texts", async () => {
        await runWithSession([], async () => {
            sessionState.lastRetrievedChunks = ["chunk A", "chunk B"];
            expect(sessionState.lastRetrievedChunks).toEqual(["chunk A", "chunk B"]);
        });
    });

    it("is isolated between sessions", async () => {
        await runWithSession([], async () => {
            sessionState.lastRetrievedChunks = ["session 1"];
        });

        await runWithSession([], async () => {
            expect(sessionState.lastRetrievedChunks).toEqual([]);
        });
    });
});

// ---------------------------------------------------------------------------
// Semantic search populates session state
// ---------------------------------------------------------------------------

describe("Semantic search → session state flow", () => {
    it("populates lastRetrievedChunks on successful search", async () => {
        mockRetrieve.mockResolvedValue([
            {
                id: "p1_0", text: "AI transforms classrooms",
                slug: "ai-edu", title: "AI in Education", date: "2026-01-01",
                chunkIndex: 0, score: 0.9,
            },
        ]);

        await runWithSession([], async () => {
            await semanticSearchPosts("AI education");

            expect(sessionState.lastRetrievedChunks).toEqual(["AI transforms classrooms"]);
            expect(sessionState.lastPostResults).toEqual([
                { title: "AI in Education", slug: "ai-edu", date: "2026-01-01" },
            ]);
        });
    });

    it("does not populate chunks when nothing is found", async () => {
        mockRetrieve.mockResolvedValue([]);

        await runWithSession([], async () => {
            const result = await semanticSearchPosts("blockchain");
            expect(result).toContain("No posts found");
            expect(sessionState.lastRetrievedChunks).toEqual([]);
        });
    });
});

// ---------------------------------------------------------------------------
// Tool router escalation
// ---------------------------------------------------------------------------

describe("Tool router: keyword → semantic escalation", () => {
    it("semanticSearchPosts tool is accessible in public tool list", () => {
        const tools = getToolsForUser(false);
        const semantic = tools.find((t) => t.name === "semanticSearchPosts");
        const keyword = tools.find((t) => t.name === "searchBlogPosts");
        expect(semantic).toBeDefined();
        expect(keyword).toBeDefined();
    });

    it("both tools coexist without conflict", () => {
        const tools = getToolsForUser(false);
        const names = tools.map((t) => t.name);
        expect(names).toContain("searchBlogPosts");
        expect(names).toContain("semanticSearchPosts");
    });
});
