/**
 * Sprint 20 Tests — Activity Log System (persistent JSON storage)
 */
import fs from "fs";

// Mock fs module
let mockData: string = "[]";
jest.mock("fs", () => ({
    existsSync: jest.fn((p: string) => {
        if (p.endsWith("activity.json")) return true;
        return true; // log dir exists
    }),
    readFileSync: jest.fn(() => mockData),
    writeFileSync: jest.fn((_p: string, data: string) => {
        mockData = data;
    }),
    mkdirSync: jest.fn(),
}));

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [],
}));

import { logActivity } from "@/lib/activity-log";

describe("Sprint 20 — Activity Log System", () => {
    beforeEach(() => {
        mockData = "[]";
        (fs.writeFileSync as jest.Mock).mockClear();
        (fs.readFileSync as jest.Mock).mockClear();
    });

    it("creates a log entry for audio uploaded", () => {
        logActivity("audio_uploaded", { fileName: "test.webm" });
        expect(fs.writeFileSync).toHaveBeenCalled();
        const written = JSON.parse(mockData);
        expect(written[0].type).toBe("audio_uploaded");
    });

    it("creates entries with correct structure", () => {
        logActivity("transcription_completed", { fileName: "test.webm" });
        const written = JSON.parse(mockData);
        expect(written[0].type).toBe("transcription_completed");
        expect(written[0].timestamp).toBeDefined();
        expect(written[0].metadata).toEqual({ fileName: "test.webm" });
    });

    it("creates entries for article generated", () => {
        logActivity("article_generated", { title: "Test Article" });
        const written = JSON.parse(mockData);
        expect(written[0].type).toBe("article_generated");
    });

    it("creates entries for MCP tool executed", () => {
        logActivity("mcp_tool_executed", { toolName: "getSiteAnalytics" });
        const written = JSON.parse(mockData);
        expect(written[0].type).toBe("mcp_tool_executed");
    });

    it("persists entries to the JSON file", () => {
        logActivity("audio_uploaded", { fileName: "test.webm" });
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });
});
