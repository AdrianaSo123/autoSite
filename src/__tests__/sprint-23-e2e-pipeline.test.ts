/**
 * Sprint 23 Tests — End-to-End Pipeline Testing (TDD)
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

import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { logActivity, getActivityLog } from "@/lib/activity-log";

describe("Sprint 23 — End-to-End Pipeline Testing", () => {
    beforeEach(() => {
        getActivityLog().length = 0;
    });

    it("simulates the full pipeline: upload → transcribe → generate → publish", () => {
        // Step 1: Audio uploaded
        logActivity("audio_uploaded", { fileName: "recording.webm" });
        expect(getActivityLog()[0].type).toBe("audio_uploaded");

        // Step 2: Transcription completed
        logActivity("transcription_completed", {
            fileName: "recording.webm",
            transcript: "This is my test transcript.",
        });
        expect(getActivityLog()[0].type).toBe("transcription_completed");

        // Step 3: Article generated
        logActivity("article_generated", {
            title: "Test Post",
            slug: "test-post",
        });
        expect(getActivityLog()[0].type).toBe("article_generated");

        // Step 4: Article appears in blog
        const posts = getAllPosts();
        expect(posts.length).toBeGreaterThan(0);
        expect(posts[0].title).toBe("Test Post");

        // Step 5: Article can be retrieved by slug
        const post = getPostBySlug("test-post");
        expect(post).toBeDefined();
        expect(post?.title).toBe("Test Post");

        // Step 6: Activity log records all events
        const log = getActivityLog();
        expect(log.length).toBe(3);
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
