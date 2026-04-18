/**
 * RAG Chunking Layer
 *
 * Splits markdown content into semantically meaningful chunks
 * with overlap for context continuity.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Chunk {
    id: string;
    text: string;
    slug: string;
    title: string;
    date: string;
    chunkIndex: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Token approximation: 1 token ≈ 4 characters
const MAX_CHUNK_CHARS = 2000; // ~500 tokens
const MIN_CHUNK_CHARS = 800;  // ~200 tokens
const OVERLAP_CHARS = 120;    // ~30 tokens

// Exported for testing
export { MAX_CHUNK_CHARS, MIN_CHUNK_CHARS, OVERLAP_CHARS };

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Split a post's markdown content into overlapping chunks.
 * Prefers paragraph and heading boundaries.
 */
export function chunkPost(
    slug: string,
    title: string,
    date: string,
    content: string
): Chunk[] {
    if (!content || content.trim().length === 0) return [];

    const sections = splitIntoSections(content);
    if (sections.length === 0) return [];

    // Phase 1: merge sections into raw chunks respecting size limits
    const rawChunks = mergeSections(sections);

    // Phase 2: add overlap from previous chunk's tail
    return rawChunks.map((text, i) => {
        let finalText = text;
        if (i > 0) {
            const prevTail = rawChunks[i - 1].slice(-OVERLAP_CHARS).trim();
            if (prevTail) {
                finalText = prevTail + "\n\n" + text;
            }
        }
        return {
            id: `${slug}_chunk_${i}`,
            text: finalText.trim(),
            slug,
            title,
            date,
            chunkIndex: i,
        };
    });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Split markdown into sections by double-newlines and headings.
 */
function splitIntoSections(content: string): string[] {
    return content
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}

/**
 * Merge consecutive sections into chunks that respect size limits.
 */
function mergeSections(sections: string[]): string[] {
    const chunks: string[] = [];
    let buffer = "";

    for (const section of sections) {
        if (!buffer) {
            buffer = section;
            continue;
        }

        const merged = buffer + "\n\n" + section;

        if (merged.length > MAX_CHUNK_CHARS && buffer.length >= MIN_CHUNK_CHARS) {
            chunks.push(buffer);
            buffer = section;
        } else {
            buffer = merged;
        }
    }

    if (buffer.trim()) {
        chunks.push(buffer);
    }

    return chunks;
}
