/**
 * Sprint 19 Tests — Chat Command Router
 *
 * After the SRP refactor, post listing is handled by the MCP tool router,
 * not the command router. The command router handles: greetings, help,
 * admin access, and action commands.
 */

// commands.ts imports getAllPosts from posts.ts, which imports remark (ESM-only).
// Mock posts at the module level so Jest doesn't need to resolve the ESM chain.
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
    getPostBySlug: () => undefined,
    getAllSlugs: () => ["test"],
}));

import { routeCommand } from "@/lib/commands";

describe("Sprint 19 — Chat Command Router", () => {
    it("routes 'help' to help text", async () => {
        const result = await routeCommand("help");
        expect(result).not.toBeNull();
        expect(result!.reply).toContain("Show recent posts");
    });

    it("routes greeting correctly", async () => {
        const result = await routeCommand("hello");
        expect(result).not.toBeNull();
        expect(result!.reply).toContain("So Studio assistant");
    });

    it("routes admin command", async () => {
        const result = await routeCommand("/admin");
        expect(result).not.toBeNull();
        expect(result!.action).toBe("open_admin_studio");
    });

    it("routes 'process recording' to action", async () => {
        const result = await routeCommand("process latest recording");
        expect(result).not.toBeNull();
        expect(result!.action).toBe("process_recording");
    });

    it("routes 'publish draft' to action", async () => {
        const result = await routeCommand("publish draft");
        expect(result).not.toBeNull();
        expect(result!.action).toBe("publish_draft");
    });

    it("handles unknown commands gracefully", async () => {
        const result = await routeCommand("xyzzy random thing");
        expect(result).toBeNull();
    });

    it("does not trigger commands for incidental keywords", async () => {
        const result = await routeCommand("can you publish draft ideas for me?");
        expect(result).toBeNull();
    });
});
