/**
 * Sprint 13 Tests — Hero Chat Integration
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

// Mock fetch for chat API
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Hello! I'm your assistant." }),
    })
) as jest.Mock;

const mockPosts = [
    {
        slug: "test-post",
        title: "Test Post",
        date: "2026-03-06",
        excerpt: "A test post excerpt.",
    },
];

describe("Sprint 13 — Hero Chat Integration", () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it("renders the homepage with a chat interface", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByPlaceholderText(/What would you like to explore/i)).toBeTruthy();
    });

    it("displays a greeting message on load", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByText(/Hello.*AI publishing assistant/i)).toBeTruthy();
    });

    it("has a chat input that accepts text", () => {
        render(<HomeClient posts={mockPosts} />);
        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        fireEvent.change(input, { target: { value: "Show recent posts" } });
        expect(input).toHaveValue("Show recent posts");
    });

    it("sends a message when the user submits", async () => {
        render(<HomeClient posts={mockPosts} />);
        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        const sendButton = screen.getByText("Send");

        fireEvent.change(input, { target: { value: "Hello" } });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/chat", expect.any(Object));
        });
    });

    it("displays recent posts section", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByText("Recent Posts")).toBeTruthy();
        expect(screen.getByText("Test Post")).toBeTruthy();
    });

    it("shows welcome hero text before interaction", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByText(/Welcome to/i)).toBeTruthy();
    });
});
