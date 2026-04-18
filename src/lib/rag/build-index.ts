/**
 * RAG Index Builder — CLI Script
 *
 * Loads all posts, chunks them, generates embeddings,
 * and writes the index to data/rag-index.json.
 *
 * Usage: npm run build:rag-index
 *
 * Uses relative imports (not @/ aliases) for tsx CLI compatibility.
 */

import fs from "fs";
import path from "path";
import { getAllPosts } from "../posts";
import { chunkPost } from "./chunk";
import { embedChunks, type EmbeddedChunk } from "./embed";

const INDEX_PATH = path.join(process.cwd(), "data", "rag-index.json");

async function buildIndex(): Promise<void> {
    // Gracefully skip if no API key (e.g. preview deploys)
    if (!process.env.OPENAI_API_KEY) {
        console.log("OPENAI_API_KEY not set, skipping RAG index build.");
        process.exit(0);
    }

    console.log("Building RAG index...\n");

    const posts = getAllPosts();
    console.log(`Found ${posts.length} post(s)`);

    if (posts.length === 0) {
        writeIndex([]);
        console.log("Empty index written (no posts).");
        return;
    }

    // Chunk all posts
    const allChunks = posts.flatMap((post) =>
        chunkPost(post.slug, post.title, post.date, post.content)
    );
    console.log(`Generated ${allChunks.length} chunk(s)`);

    // Embed all chunks (single batch)
    console.log("Generating embeddings...");
    const embedded = await embedChunks(allChunks);

    // Full rebuild — stale entries removed by design
    writeIndex(embedded);

    const fileSize = fs.statSync(INDEX_PATH).size;
    const sizeMB = (fileSize / 1024 / 1024).toFixed(2);
    console.log(`\nIndex written to ${INDEX_PATH}`);
    console.log(`  Posts:  ${posts.length}`);
    console.log(`  Chunks: ${embedded.length}`);
    console.log(`  Size:   ${sizeMB} MB`);
}

function writeIndex(entries: EmbeddedChunk[]): void {
    const dir = path.dirname(INDEX_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(INDEX_PATH, JSON.stringify(entries), "utf8");
}

buildIndex().catch((err) => {
    console.error("Index build failed:", err);
    process.exit(1);
});
