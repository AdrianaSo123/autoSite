/**
 * Sprint 20 Tests — Activity Log System (TDD)
 */

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [],
}));

import { logActivity, getActivityLog, ActivityEntry } from "@/lib/activity-log";

describe("Sprint 20 — Activity Log System", () => {
    beforeEach(() => {
        // Clear the log before each test
        const log = getActivityLog();
        log.length = 0;
    });

    it("creates a log entry for audio uploaded", () => {
        logActivity("audio_uploaded", { fileName: "test.webm" });
        const log = getActivityLog();
        expect(log.length).toBe(1);
        expect(log[0].type).toBe("audio_uploaded");
    });

    it("creates a log entry for transcription completed", () => {
        logActivity("transcription_completed", { fileName: "test.webm" });
        const log = getActivityLog();
        expect(log[0].type).toBe("transcription_completed");
    });

    it("creates a log entry for article generated", () => {
        logActivity("article_generated", { title: "Test Article" });
        const log = getActivityLog();
        expect(log[0].type).toBe("article_generated");
    });

    it("creates a log entry for MCP tool executed", () => {
        logActivity("mcp_tool_executed", { toolName: "getSiteAnalytics" });
        const log = getActivityLog();
        expect(log[0].type).toBe("mcp_tool_executed");
    });

    it("includes timestamp in log entries", () => {
        logActivity("audio_uploaded", { fileName: "test.webm" });
        const log = getActivityLog();
        expect(log[0].timestamp).toBeDefined();
        expect(() => new Date(log[0].timestamp)).not.toThrow();
    });

    it("stores metadata in log entries", () => {
        logActivity("article_generated", { title: "My Post", slug: "my-post" });
        const log = getActivityLog();
        expect(log[0].metadata).toEqual({ title: "My Post", slug: "my-post" });
    });

    it("returns log entries in reverse chronological order", () => {
        logActivity("audio_uploaded", { fileName: "first.webm" });
        logActivity("transcription_completed", { fileName: "first.webm" });
        logActivity("article_generated", { title: "Article" });

        const log = getActivityLog();
        expect(log.length).toBe(3);
        // Most recent first
        expect(log[0].type).toBe("article_generated");
        expect(log[2].type).toBe("audio_uploaded");
    });
});
