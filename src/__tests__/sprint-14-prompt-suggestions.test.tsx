/**
 * Sprint 14 Tests — Chat Prompt Suggestions
 */
import { render, screen, fireEvent } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Here are recent posts..." }),
    })
) as jest.Mock;

const mockPosts = [
    { slug: "test", title: "Test", date: "2026-03-06", excerpt: "Test." },
];

describe("Sprint 14 — Chat Prompt Suggestions", () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it("displays suggestion buttons", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByText("Show recent posts")).toBeTruthy();
        expect(screen.getByText("What is this?")).toBeTruthy();
        expect(screen.getByText("Help")).toBeTruthy();
    });

    it("sets input text when clicking a prompt suggestion", () => {
        render(<HomeClient posts={mockPosts} />);
        const button = screen.getByText("Show recent posts");
        fireEvent.click(button);

        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        expect(input).toHaveValue("Show recent posts");
    });
});
