/**
 * RAG Retrieval Engine
 *
 * Loads the pre-built index, embeds queries, and returns
 * the top-k most semantically relevant chunks.
 */

import fs from "fs";
import path from "path";
import type { Chunk } from "@/lib/rag/chunk";
import { embedText } from "@/lib/rag/embed";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScoredChunk = Chunk & { score: number };

interface IndexEntry extends Chunk {
    embedding: number[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INDEX_PATH = path.join(process.cwd(), "data", "rag-index.json");
const MIN_SIMILARITY = 0.3;
const MAX_PER_POST = 2;

// ---------------------------------------------------------------------------
// Index loading (cached per cold start)
// ---------------------------------------------------------------------------

let cachedIndex: IndexEntry[] | null = null;

function loadIndex(): IndexEntry[] {
    if (cachedIndex) return cachedIndex;

    if (!fs.existsSync(INDEX_PATH)) {
        throw new Error(
            `RAG index not found at ${INDEX_PATH}. Run "npm run build:rag-index" first.`
        );
    }

    const raw = fs.readFileSync(INDEX_PATH, "utf8");
    cachedIndex = JSON.parse(raw) as IndexEntry[];
    return cachedIndex;
}

/** Clear the cached index (used in tests). */
export function clearIndexCache(): void {
    cachedIndex = null;
}

// ---------------------------------------------------------------------------
// Cosine similarity
// ---------------------------------------------------------------------------

export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;

    return dot / magnitude;
}

// ---------------------------------------------------------------------------
// Retrieval
// ---------------------------------------------------------------------------

/**
 * Retrieve the top-k most relevant chunks for a query.
 * Embeds the query, computes cosine similarity against the index,
 * filters by threshold, and limits per-post representation.
 */
export async function retrieveRelevantChunks(
    query: string,
    k = 5
): Promise<ScoredChunk[]> {
    const index = loadIndex();
    if (index.length === 0) return [];

    const queryEmbedding = await embedText(query);

    const scored: ScoredChunk[] = index.map((entry) => ({
        id: entry.id,
        text: entry.text,
        slug: entry.slug,
        title: entry.title,
        date: entry.date,
        chunkIndex: entry.chunkIndex,
        score: cosineSimilarity(queryEmbedding, entry.embedding),
    }));

    return scored
        .filter((c) => c.score >= MIN_SIMILARITY)
        .sort((a, b) => b.score - a.score)
        .reduce<ScoredChunk[]>((acc, chunk) => {
            const countForPost = acc.filter((c) => c.slug === chunk.slug).length;
            if (countForPost < MAX_PER_POST) acc.push(chunk);
            return acc;
        }, [])
        .slice(0, k);
}
