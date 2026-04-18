/**
 * RAG Embedding Tests
 */

import { embedText, embedChunks } from "@/lib/rag/embed";
import type { Chunk } from "@/lib/rag/chunk";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
    mockFetch.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
});

afterEach(() => {
    delete process.env.OPENAI_API_KEY;
});

const FAKE_EMBEDDING = Array.from({ length: 1536 }, (_, i) => i * 0.001);

describe("embedText", () => {
    it("calls OpenAI with correct model and returns embedding", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: [{ embedding: FAKE_EMBEDDING }],
            }),
        });

        const result = await embedText("hello world");

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs[0]).toBe("https://api.openai.com/v1/embeddings");

        const body = JSON.parse(callArgs[1].body);
        expect(body.model).toBe("text-embedding-3-small");
        expect(body.input).toBe("hello world");

        expect(result).toEqual(FAKE_EMBEDDING);
        expect(result.length).toBe(1536);
    });

    it("throws when OPENAI_API_KEY is not set", async () => {
        delete process.env.OPENAI_API_KEY;
        await expect(embedText("test")).rejects.toThrow("OPENAI_API_KEY is not set");
    });

    it("throws on API error", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            text: async () => "Rate limited",
        });

        await expect(embedText("test")).rejects.toThrow("Embedding API error (429)");
    });
});

describe("embedChunks", () => {
    const chunks: Chunk[] = [
        { id: "c1", text: "chunk one", slug: "post-1", title: "Post 1", date: "2026-01-01", chunkIndex: 0 },
        { id: "c2", text: "chunk two", slug: "post-1", title: "Post 1", date: "2026-01-01", chunkIndex: 1 },
    ];

    it("returns EmbeddedChunk[] with embeddings attached", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: [
                    { embedding: FAKE_EMBEDDING },
                    { embedding: FAKE_EMBEDDING },
                ],
            }),
        });

        const result = await embedChunks(chunks);

        expect(result.length).toBe(2);
        expect(result[0].id).toBe("c1");
        expect(result[0].embedding).toEqual(FAKE_EMBEDDING);
        expect(result[1].id).toBe("c2");
        expect(result[1].embedding).toEqual(FAKE_EMBEDDING);
    });

    it("returns empty array for empty input", async () => {
        const result = await embedChunks([]);
        expect(result).toEqual([]);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it("sends all texts in a single batch", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: chunks.map(() => ({ embedding: FAKE_EMBEDDING })),
            }),
        });

        await embedChunks(chunks);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.input).toEqual(["chunk one", "chunk two"]);
    });

    it("throws on API error without crashing", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error",
        });

        await expect(embedChunks(chunks)).rejects.toThrow("Embedding API error");
    });
});
