/**
 * Sprint 16 Tests — Admin Chat Mode
 */
import { render, screen, fireEvent } from "@testing-library/react";
import AdminChat from "@/components/AdminChat";

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Done. Recording processed." }),
    })
) as jest.Mock;

// Mock next-auth session
jest.mock("next-auth/react", () => ({
    useSession: () => ({
        data: { user: { email: "admin@example.com", name: "Admin" } },
        status: "authenticated",
    }),
}));

describe("Sprint 16 — Admin Chat Mode", () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    it("renders admin chat interface", () => {
        render(<AdminChat />);
        expect(screen.getByPlaceholderText(/Enter admin command/i)).toBeTruthy();
    });

    it("shows admin-specific prompt suggestions", () => {
        render(<AdminChat />);
        expect(screen.getByText("Show recent posts")).toBeTruthy();
        expect(screen.getByText("Blog summary")).toBeTruthy();
    });

    it("accepts and sends admin commands", async () => {
        render(<AdminChat />);
        const input = screen.getByPlaceholderText(/Enter admin command/i);
        fireEvent.change(input, { target: { value: "Process latest recording" } });

        const sendBtn = screen.getByText("Execute");
        fireEvent.click(sendBtn);

        expect(global.fetch).toHaveBeenCalledWith("/api/chat", expect.any(Object));
    });
});
