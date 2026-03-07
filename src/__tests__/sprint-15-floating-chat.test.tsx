/**
 * Sprint 15 Tests — Floating Chat Interface (FAB)
 */
import { render, screen, fireEvent } from "@testing-library/react";
import FloatingChat from "@/components/FloatingChat";

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Hello!" }),
    })
) as jest.Mock;

describe("Sprint 15 — Floating Chat Interface", () => {
    it("renders a floating action button", () => {
        render(<FloatingChat />);
        const fab = screen.getByLabelText("Open chat");
        expect(fab).toBeTruthy();
    });

    it("opens chat panel when FAB is clicked", () => {
        render(<FloatingChat />);
        const fab = screen.getByLabelText("Open chat");
        fireEvent.click(fab);

        // Chat panel should now be visible with its header
        expect(screen.getByText(/AI Assistant/i)).toBeTruthy();
    });

    it("shows chat input when panel is open", () => {
        render(<FloatingChat />);
        const fab = screen.getByLabelText("Open chat");
        fireEvent.click(fab);

        expect(screen.getByPlaceholderText(/What would you like to explore/i)).toBeTruthy();
    });

    it("closes chat panel when close button is clicked", () => {
        render(<FloatingChat />);
        const fab = screen.getByLabelText("Open chat");
        fireEvent.click(fab);

        const closeBtns = screen.getAllByText("✕");
        fireEvent.click(closeBtns[0]);

        expect(screen.queryByText(/AI Assistant/i)).toBeNull();
    });
});
