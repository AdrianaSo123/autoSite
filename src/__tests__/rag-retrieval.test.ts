/**
 * RAG Retrieval Engine Tests
 */

// Mock the embed module to avoid real API calls
jest.mock("@/lib/rag/embed", () => ({
    embedText: jest.fn(),
}));

// Mock fs to control index loading
jest.mock("fs", () => {
    const actual = jest.requireActual("fs");
    return {
        ...actual,
        existsSync: jest.fn(),
        readFileSync: jest.fn(),
    };
});

import { cosineSimilarity, retrieveRelevantChunks, clearIndexCache } from "@/lib/rag/retrieve";
import { embedText } from "@/lib/rag/embed";
import fs from "fs";

const mockEmbedText = embedText as jest.MockedFunction<typeof embedText>;
const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
const mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;

beforeEach(() => {
    clearIndexCache();
    mockEmbedText.mockReset();
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
});

// ---------------------------------------------------------------------------
// Cosine Similarity
// ---------------------------------------------------------------------------

describe("cosineSimilarity", () => {
    it("returns 1.0 for identical vectors", () => {
        const v = [1, 2, 3];
        expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
    });

    it("returns 0 for orthogonal vectors", () => {
        expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0, 5);
    });

    it("returns -1 for opposite vectors", () => {
        const a = [1, 2, 3];
        const b = [-1, -2, -3];
        expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
    });

    it("returns 0 for zero vectors", () => {
        expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
    });

    it("returns 0 for different-length vectors", () => {
        expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });

    it("returns 0 for empty vectors", () => {
        expect(cosineSimilarity([], [])).toBe(0);
    });

    it("computes correct similarity for known vectors", () => {
        // cos([1,0,1], [0,1,1]) = 1 / (sqrt(2) * sqrt(2)) = 0.5
        expect(cosineSimilarity([1, 0, 1], [0, 1, 1])).toBeCloseTo(0.5, 5);
    });
});

// ---------------------------------------------------------------------------
// retrieveRelevantChunks
// ---------------------------------------------------------------------------

describe("retrieveRelevantChunks", () => {
    const indexData = [
        {
            id: "a_chunk_0", text: "AI transforms education", slug: "ai-edu",
            title: "AI in Education", date: "2026-01-01", chunkIndex: 0,
            embedding: [0.9, 0.1, 0.0],
        },
        {
            id: "a_chunk_1", text: "AI in classrooms", slug: "ai-edu",
            title: "AI in Education", date: "2026-01-01", chunkIndex: 1,
            embedding: [0.8, 0.2, 0.0],
        },
        {
            id: "b_chunk_0", text: "Cooking tips for weekends", slug: "cooking",
            title: "Weekend Cooking", date: "2026-01-02", chunkIndex: 0,
            embedding: [0.0, 0.1, 0.9],
        },
        {
            id: "c_chunk_0", text: "Machine learning basics", slug: "ml-basics",
            title: "ML Basics", date: "2026-01-03", chunkIndex: 0,
            embedding: [0.7, 0.3, 0.1],
        },
    ];

    function setupIndex(data = indexData) {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify(data));
    }

    it("returns top-k chunks sorted by score", async () => {
        setupIndex();
        // Query embedding close to AI topics
        mockEmbedText.mockResolvedValue([0.9, 0.1, 0.0]);

        const results = await retrieveRelevantChunks("AI in education", 3);

        expect(results.length).toBeGreaterThan(0);
        // Results should be sorted by score descending
        for (let i = 1; i < results.length; i++) {
            expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
        }
    });

    it("filters out chunks below similarity threshold", async () => {
        setupIndex();
        // Query embedding orthogonal to all entries
        mockEmbedText.mockResolvedValue([0.0, 0.0, 0.0]);

        const results = await retrieveRelevantChunks("nothing relevant", 5);
        expect(results.length).toBe(0);
    });

    it("limits chunks per post (max 2)", async () => {
        const manyChunks = Array.from({ length: 5 }, (_, i) => ({
            id: `same_chunk_${i}`, text: `AI topic ${i}`, slug: "same-post",
            title: "Same Post", date: "2026-01-01", chunkIndex: i,
            embedding: [0.9, 0.1, 0.0],
        }));
        setupIndex(manyChunks);
        mockEmbedText.mockResolvedValue([0.9, 0.1, 0.0]);

        const results = await retrieveRelevantChunks("AI", 5);
        const fromSamePost = results.filter((r) => r.slug === "same-post");
        expect(fromSamePost.length).toBeLessThanOrEqual(2);
    });

    it("returns empty for empty index", async () => {
        setupIndex([]);
        mockEmbedText.mockResolvedValue([0.5, 0.5, 0.0]);

        const results = await retrieveRelevantChunks("test", 5);
        expect(results).toEqual([]);
    });

    it("throws when index file is missing", async () => {
        mockExistsSync.mockReturnValue(false);

        await expect(retrieveRelevantChunks("test")).rejects.toThrow("RAG index not found");
    });
});
