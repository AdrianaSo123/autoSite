/**
 * Sprint 14 Tests — Chat Prompt Suggestions (updated for Sprint 25 layout)
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

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
        expect(screen.getByText("What is this project?")).toBeTruthy();
        expect(screen.getByText("Help")).toBeTruthy();
    });

    it("sends message directly when clicking a prompt suggestion", async () => {
        render(<HomeClient posts={mockPosts} />);
        const button = screen.getByText("Show recent posts");
        fireEvent.click(button);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/chat", expect.any(Object));
        });
    });
});
