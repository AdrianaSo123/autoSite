/**
 * Sprint 19 Tests — Chat Command Router
 *
 * After the SRP refactor, post listing is handled by the MCP tool router,
 * not the command router. The command router handles: greetings, help,
 * admin access, and action commands.
 */
import { routeCommand } from "@/lib/commands";

describe("Sprint 19 — Chat Command Router", () => {
    it("routes 'help' to help text", async () => {
        const result = await routeCommand("help");
        expect(result.reply).toContain("Show recent posts");
    });

    it("routes greeting correctly", async () => {
        const result = await routeCommand("hello");
        expect(result.reply).toContain("AI publishing assistant");
    });

    it("routes admin command", async () => {
        const result = await routeCommand("/admin");
        expect(result.action).toBe("open_admin_studio");
    });

    it("routes 'process recording' to action", async () => {
        const result = await routeCommand("process latest recording");
        expect(result.action).toBe("process_recording");
    });

    it("routes 'publish draft' to action", async () => {
        const result = await routeCommand("publish draft");
        expect(result.action).toBe("publish_draft");
    });

    it("handles unknown commands gracefully", async () => {
        const result = await routeCommand("xyzzy random thing");
        expect(result.reply).toContain("help");
    });
});
