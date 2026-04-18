/**
 * RAG Embedding Layer
 *
 * Generates embeddings via OpenAI text-embedding-3-small (1536 dimensions).
 */

import type { Chunk } from "./chunk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmbeddedChunk = Chunk & {
    embedding: number[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_API_URL = "https://api.openai.com/v1/embeddings";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Embed a single text string. Returns a 1536-dimension vector.
 */
export async function embedText(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set.");
    }

    const response = await fetch(EMBEDDING_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: text,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embedding API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

/**
 * Embed an array of chunks in a single batch request.
 * Returns EmbeddedChunk[] with the embedding vector attached.
 */
export async function embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
    if (chunks.length === 0) return [];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set.");
    }

    const texts = chunks.map((c) => c.text);

    const response = await fetch(EMBEDDING_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: texts,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embedding API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return chunks.map((chunk, i) => ({
        ...chunk,
        embedding: data.data[i].embedding,
    }));
}
