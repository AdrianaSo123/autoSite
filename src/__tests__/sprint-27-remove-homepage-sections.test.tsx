/**
 * Sprint 27 Tests — Homepage is conversation-only
 */
import { render, screen } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Hi!" }),
    })
) as jest.Mock;

describe("Sprint 27 — Remove Traditional Homepage Sections", () => {
    it("shows the chat interface on homepage", () => {
        render(<HomeClient />);
        expect(screen.getByPlaceholderText(/What would you like to explore/i)).toBeTruthy();
    });

    it("does NOT show Recent Posts on the homepage", () => {
        render(<HomeClient />);
        expect(screen.queryByText("Recent Posts")).toBeNull();
    });

    it("does NOT show post cards on the homepage", () => {
        render(<HomeClient />);
        expect(screen.queryByText("Test Post")).toBeNull();
    });

    it("shows the welcome message inside the chat", () => {
        render(<HomeClient />);
        expect(screen.getByText("So Studio")).toBeTruthy();
    });
});
