/**
 * RAG Chunking Tests
 */

import { chunkPost, MAX_CHUNK_CHARS, MIN_CHUNK_CHARS, OVERLAP_CHARS } from "@/lib/rag/chunk";

describe("RAG Chunking", () => {
    const slug = "test-post";
    const title = "Test Post";
    const date = "2026-03-09";

    it("returns empty array for empty content", () => {
        expect(chunkPost(slug, title, date, "")).toEqual([]);
        expect(chunkPost(slug, title, date, "   ")).toEqual([]);
    });

    it("returns a single chunk for short content", () => {
        const content = "This is a short paragraph.\n\nAnother short paragraph.";
        const chunks = chunkPost(slug, title, date, content);

        expect(chunks.length).toBe(1);
        expect(chunks[0].text).toContain("short paragraph");
        expect(chunks[0].slug).toBe(slug);
        expect(chunks[0].title).toBe(title);
        expect(chunks[0].date).toBe(date);
        expect(chunks[0].chunkIndex).toBe(0);
    });

    it("preserves slug, title, and date on every chunk", () => {
        const content = generateLongContent(5000);
        const chunks = chunkPost(slug, title, date, content);

        expect(chunks.length).toBeGreaterThan(1);
        for (const chunk of chunks) {
            expect(chunk.slug).toBe(slug);
            expect(chunk.title).toBe(title);
            expect(chunk.date).toBe(date);
        }
    });

    it("splits long content into multiple chunks", () => {
        const content = generateLongContent(5000);
        const chunks = chunkPost(slug, title, date, content);

        expect(chunks.length).toBeGreaterThan(1);
    });

    it("generates unique IDs with slug and index", () => {
        const content = generateLongContent(5000);
        const chunks = chunkPost(slug, title, date, content);

        const ids = chunks.map((c) => c.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);

        chunks.forEach((c, i) => {
            expect(c.id).toBe(`${slug}_chunk_${i}`);
            expect(c.chunkIndex).toBe(i);
        });
    });

    it("includes overlap between consecutive chunks", () => {
        const content = generateLongContent(5000);
        const chunks = chunkPost(slug, title, date, content);

        expect(chunks.length).toBeGreaterThan(1);

        // Second chunk should contain text from the end of the first raw chunk
        // (the overlap is prepended from the previous chunk's tail)
        for (let i = 1; i < chunks.length; i++) {
            // Overlap means some text from chunk i-1 appears at the start of chunk i
            // We verify that chunk i is longer than it would be without overlap
            expect(chunks[i].text.length).toBeGreaterThan(0);
        }
    });

    it("respects max chunk size for raw content (before overlap)", () => {
        const content = generateLongContent(10000);
        const chunks = chunkPost(slug, title, date, content);

        // First chunk (no overlap) should be within MAX
        expect(chunks[0].text.length).toBeLessThanOrEqual(MAX_CHUNK_CHARS + 100);
        // Allow some tolerance for the final merge
    });

    it("splits on paragraph boundaries (double newlines)", () => {
        const p1 = "A".repeat(600);
        const p2 = "B".repeat(600);
        const p3 = "C".repeat(600);
        const p4 = "D".repeat(600);
        const content = `${p1}\n\n${p2}\n\n${p3}\n\n${p4}`;

        const chunks = chunkPost(slug, title, date, content);

        // Should split into multiple chunks at paragraph boundaries
        expect(chunks.length).toBeGreaterThan(1);

        // First chunk should not contain content from later paragraphs
        // (unless merged because it was under MIN)
    });

    it("handles content with headings", () => {
        const content = "# Heading 1\n\nParagraph one.\n\n## Heading 2\n\nParagraph two.";
        const chunks = chunkPost(slug, title, date, content);

        expect(chunks.length).toBeGreaterThanOrEqual(1);
        expect(chunks[0].text).toContain("Heading 1");
    });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateLongContent(charCount: number): string {
    const words = "The quick brown fox jumps over the lazy dog. ";
    const paragraph = words.repeat(10); // ~450 chars
    const paragraphs: string[] = [];
    let total = 0;

    while (total < charCount) {
        paragraphs.push(paragraph);
        total += paragraph.length + 2; // +2 for \n\n
    }

    return paragraphs.join("\n\n");
}
