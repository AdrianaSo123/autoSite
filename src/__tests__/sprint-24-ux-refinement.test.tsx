/**
 * Sprint 24 Tests — UX Refinement (updated for Sprint 27 chat-only homepage)
 */
import { render, screen } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Hello!" }),
    })
) as jest.Mock;

describe("Sprint 24 — UX Refinement", () => {
    it("displays the chat as the primary interaction area", () => {
        render(<HomeClient />);
        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        expect(input).toBeTruthy();
    });

    it("shows the welcome message on load", () => {
        render(<HomeClient />);
        expect(screen.getByText("So Studio")).toBeTruthy();
    });

    it("has prompt suggestion buttons", () => {
        render(<HomeClient />);
        expect(screen.getByText("Show recent posts")).toBeTruthy();
        expect(screen.getByText("Explain AI agents")).toBeTruthy();
    });
});
