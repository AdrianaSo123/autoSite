/**
 * Sprint 25 Tests — Conversational Layout (updated for Sprint 27)
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Here are the recent posts..." }),
    })
) as jest.Mock;

describe("Sprint 25 — Conversational Layout", () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it("shows hero welcome message inside the chat", () => {
        render(<HomeClient />);
        expect(screen.getByText(/conversational publishing platform/i)).toBeTruthy();
    });

    it("displays prompt suggestion buttons on load", () => {
        render(<HomeClient />);
        expect(screen.getByText("Show recent posts")).toBeTruthy();
        expect(screen.getByText("What is this project?")).toBeTruthy();
        expect(screen.getByText("Help")).toBeTruthy();
    });

    it("sends a message when clicking a prompt suggestion", async () => {
        render(<HomeClient />);
        const button = screen.getByText("Show recent posts");
        fireEvent.click(button);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/chat", expect.any(Object));
        });
    });

    it("hides hero content after the first message is sent", async () => {
        render(<HomeClient />);
        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        const sendBtn = screen.getByText("Send");

        fireEvent.change(input, { target: { value: "Hello" } });
        fireEvent.click(sendBtn);

        await waitFor(() => {
            expect(screen.queryByText(/conversational publishing platform/i)).toBeNull();
        });
    });

    it("chat container has correct data-testid", () => {
        const { container } = render(<HomeClient />);
        const chatSection = container.querySelector("[data-testid='chat-container']");
        expect(chatSection).toBeTruthy();
    });
});
