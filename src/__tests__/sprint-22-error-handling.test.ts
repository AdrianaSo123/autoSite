/**
 * Sprint 22 Tests — Reliability and Error Handling
 *
 * Tests that the command router handles edge cases gracefully:
 * empty input, very long messages, special characters.
 */
import { routeCommand } from "@/lib/commands";

describe("Sprint 22 — Reliability and Error Handling", () => {
    it("handles empty input without crashing", async () => {
        const result = await routeCommand("");
        expect(result.reply).toBeDefined();
    });

    it("handles very long messages without crashing", async () => {
        const longMsg = "a".repeat(10000);
        const result = await routeCommand(longMsg);
        expect(result.reply).toBeDefined();
    });

    it("handles special characters in messages", async () => {
        const result = await routeCommand("hello <script>alert('xss')</script>");
        expect(result.reply).toBeDefined();
    });

    it("returns a fallback for unknown commands", async () => {
        const result = await routeCommand("xyzzy something unknown");
        expect(result.reply).toContain("help");
    });
});
