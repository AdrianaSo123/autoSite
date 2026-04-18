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
const BATCH_SIZE = 100; // conservative batch size
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Execute an async function with exponential backoff retry logic.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        const delay = Math.pow(2, MAX_RETRIES - retries + 1) * 1000;
        console.warn(`Embedding request failed, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return withRetry(fn, retries - 1);
    }
}

/**
 * Low-level call to OpenAI Embeddings API.
 */
async function callEmbeddingApi(input: string | string[]): Promise<number[][]> {
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
            input,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embedding API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Embed a single text string. Returns a 1536-dimension vector.
 */
export async function embedText(text: string): Promise<number[]> {
    const results = await withRetry(() => callEmbeddingApi(text));
    return results[0];
}

/**
 * Embed an array of chunks in batches with retry logic.
 * Returns EmbeddedChunk[] with the embedding vector attached.
 */
export async function embedChunks(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
    if (chunks.length === 0) return [];

    const embedded: EmbeddedChunk[] = [];

    // Process in batches to respect API limits and keep memory usage stable
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const texts = batch.map((c) => c.text);

        console.log(`  Embedding batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)}...`);

        const embeddings = await withRetry(() => callEmbeddingApi(texts));

        const mapped = batch.map((chunk, j) => ({
            ...chunk,
            embedding: embeddings[j],
        }));

        embedded.push(...mapped);
    }

    return embedded;
}

