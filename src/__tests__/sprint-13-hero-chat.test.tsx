/**
 * Sprint 13 Tests — Hero Chat Integration (updated for Sprint 27 layout)
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Hello! I'm your assistant." }),
    })
) as jest.Mock;

describe("Sprint 13 — Hero Chat Integration", () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        // Prevent localStorage chat history from a prior test's messages
        // causing isEmpty=false and hiding the welcome heading.
        localStorage.clear();
    });

    it("renders the homepage with a chat interface", () => {
        render(<HomeClient />);
        expect(screen.getByPlaceholderText(/What would you like to explore/i)).toBeTruthy();
    });

    it("displays a welcome message inside the chat on load", () => {
        render(<HomeClient />);
        expect(screen.getByText("So Studio")).toBeTruthy();
    });

    it("has a chat input that accepts text", () => {
        render(<HomeClient />);
        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        fireEvent.change(input, { target: { value: "Show recent posts" } });
        expect(input).toHaveValue("Show recent posts");
    });

    it("sends a message when the user submits", async () => {
        render(<HomeClient />);
        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        const sendButton = screen.getByText("Send");

        fireEvent.change(input, { target: { value: "Hello" } });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/chat", expect.any(Object));
        });
    });

    it("shows welcome text on load", () => {
        render(<HomeClient />);
        expect(screen.getByText("So Studio")).toBeTruthy();
    });
});
