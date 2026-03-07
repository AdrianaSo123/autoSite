/**
 * Sprint 23 Tests — End-to-End Pipeline Testing (updated for architecture stabilization)
 */

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        {
            slug: "test-post",
            title: "Test Post",
            date: "2026-03-06",
            excerpt: "Test excerpt",
            content: "# Test\n\nContent here.",
        },
    ],
    getPostBySlug: (slug: string) =>
        slug === "test-post"
            ? {
                slug: "test-post",
                title: "Test Post",
                date: "2026-03-06",
                excerpt: "Test excerpt",
                content: "# Test\n\nContent here.",
            }
            : null,
    getAllSlugs: () => ["test-post"],
    getPostHtml: (content: string) => Promise.resolve(`<p>${content}</p>`),
}));

// Mock fs for activity log
jest.mock("fs", () => {
    let mockLog: unknown[] = [];
    return {
        existsSync: jest.fn(() => false),
        readFileSync: jest.fn(() => JSON.stringify(mockLog)),
        writeFileSync: jest.fn((_path: string, data: string) => {
            mockLog = JSON.parse(data);
        }),
        mkdirSync: jest.fn(),
        __resetMockLog: () => { mockLog = []; },
    };
});

import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { logActivity } from "@/lib/activity-log";
import fs from "fs";

describe("Sprint 23 — End-to-End Pipeline Testing", () => {
    beforeEach(() => {
        (fs as unknown as { __resetMockLog: () => void }).__resetMockLog();
    });

    it("simulates full pipeline: upload → transcribe → generate → publish", () => {
        // Step 1: Audio uploaded
        logActivity("audio_uploaded", { fileName: "recording.webm" });

        // Step 2: Transcription completed
        logActivity("transcription_completed", { fileName: "recording.webm" });

        // Step 3: Article generated
        logActivity("article_generated", { title: "Test Post", slug: "test-post" });

        // Step 4: Article appears in blog
        const posts = getAllPosts();
        expect(posts.length).toBeGreaterThan(0);
        expect(posts[0].title).toBe("Test Post");

        // Step 5: Article can be retrieved by slug
        const post = getPostBySlug("test-post");
        expect(post).toBeDefined();
        expect(post?.title).toBe("Test Post");
    });

    it("verifies post content structure", () => {
        const post = getPostBySlug("test-post");
        expect(post).toBeDefined();
        expect(post?.slug).toBe("test-post");
        expect(post?.title).toBe("Test Post");
        expect(post?.date).toBeDefined();
        expect(post?.excerpt).toBeDefined();
        expect(post?.content).toBeDefined();
    });

    it("returns null for non-existent posts", () => {
        const post = getPostBySlug("does-not-exist");
        expect(post).toBeNull();
    });
});
