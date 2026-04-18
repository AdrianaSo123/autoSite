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

    console.log("Building RAG index (Incremental Support)...\n");

    const posts = getAllPosts();
    console.log(`Found ${posts.length} post(s) in source`);

    // Load existing index for incremental matching
    let existingIndex: EmbeddedChunk[] = [];
    if (fs.existsSync(INDEX_PATH)) {
        try {
            existingIndex = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
            console.log(`Loaded existing index with ${existingIndex.length} chunks`);
        } catch (e) {
            console.warn("Could not parse existing index, starting fresh.");
        }
    }

    const finalEmbeddedChunks: EmbeddedChunk[] = [];
    const chunksToEmbed: any[] = []; // Temporary holding for new/changed chunks
    
    let reusedPostsCount = 0;
    let newPostsCount = 0;

    for (const post of posts) {
        // Generate new chunks to get the current contentHash
        const currentChunks = chunkPost(post.slug, post.title, post.date, post.content);
        if (currentChunks.length === 0) continue;

        const currentHash = currentChunks[0].contentHash;

        // Check if this post exists in the old index with the SAME hash
        const existingForPost = existingIndex.filter(c => c.slug === post.slug);
        const hashMatches = existingForPost.length > 0 && existingForPost[0].contentHash === currentHash;

        if (hashMatches) {
            // Reuse existing embeddings
            finalEmbeddedChunks.push(...existingForPost);
            reusedPostsCount++;
        } else {
            // Mark for embedding
            chunksToEmbed.push(...currentChunks);
            newPostsCount++;
        }
    }

    console.log(`  Reusing: ${reusedPostsCount} post(s)`);
    console.log(`  Update:  ${newPostsCount} post(s) to be embedded`);

    if (chunksToEmbed.length > 0) {
        console.log(`\nGenerating embeddings for ${chunksToEmbed.length} new/changed chunk(s)...`);
        const newlyEmbedded = await embedChunks(chunksToEmbed);
        finalEmbeddedChunks.push(...newlyEmbedded);
    }

    // Sort to keep index stable (by slug then chunk index)
    finalEmbeddedChunks.sort((a, b) => {
        if (a.slug !== b.slug) return a.slug.localeCompare(b.slug);
        return a.chunkIndex - b.chunkIndex;
    });

    writeIndex(finalEmbeddedChunks);

    const fileSize = fs.statSync(INDEX_PATH).size;
    const sizeMB = (fileSize / 1024 / 1024).toFixed(2);
    console.log(`\nIndex written to ${INDEX_PATH}`);
    console.log(`  Total Posts:  ${posts.length}`);
    console.log(`  Total Chunks: ${finalEmbeddedChunks.length}`);
    console.log(`  Total Size:   ${sizeMB} MB`);
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
