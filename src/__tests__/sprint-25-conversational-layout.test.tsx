/**
 * Sprint 25 Tests — Conversational Layout Refactor (TDD)
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

// Mock fetch for chat
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Here are the recent posts..." }),
    })
) as jest.Mock;

const mockPosts = [
    { slug: "test-post", title: "Test Post", date: "2026-03-06", excerpt: "A test." },
];

describe("Sprint 25 — Conversational Layout", () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it("shows hero welcome message inside the chat container on load", () => {
        render(<HomeClient posts={mockPosts} />);
        // The welcome message should be inside the chat, not a separate hero section
        expect(screen.getByText(/conversational publishing platform/i)).toBeTruthy();
    });

    it("displays prompt suggestion buttons on load", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByText("Show recent posts")).toBeTruthy();
        expect(screen.getByText("What is this project?")).toBeTruthy();
        expect(screen.getByText("Help")).toBeTruthy();
    });

    it("sends a message when clicking a prompt suggestion", async () => {
        render(<HomeClient posts={mockPosts} />);
        const button = screen.getByText("Show recent posts");
        fireEvent.click(button);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/chat", expect.any(Object));
        });
    });

    it("hides hero content after the first message is sent", async () => {
        render(<HomeClient posts={mockPosts} />);
        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        const sendBtn = screen.getByText("Send");

        fireEvent.change(input, { target: { value: "Hello" } });
        fireEvent.click(sendBtn);

        await waitFor(() => {
            // The welcome hero message should no longer be visible
            expect(screen.queryByText(/conversational publishing platform/i)).toBeNull();
        });
    });

    it("keeps recent posts section below the chat", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByText("Recent Posts")).toBeTruthy();
        expect(screen.getByText("Test Post")).toBeTruthy();
    });

    it("chat container has correct minimum height styling", () => {
        const { container } = render(<HomeClient posts={mockPosts} />);
        const chatSection = container.querySelector("[data-testid='chat-container']");
        expect(chatSection).toBeTruthy();
    });
});
