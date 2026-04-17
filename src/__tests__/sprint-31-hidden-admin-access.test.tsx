/**
 * Sprint 31 Tests — Hidden Admin Access
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(() => "/"),
}));

import ChatInterface from "@/components/ChatInterface";
import NavBar from "@/components/NavBar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

jest.mock("next-auth/react", () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

describe("Sprint 31 — Hidden Admin Access", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("NavBar", () => {
        it("shows Studio link for admin users", () => {
            (useSession as jest.Mock).mockReturnValue({
                data: { user: { email: "admin@example.com", isAdmin: true } },
                status: "authenticated",
            });
            render(<NavBar />);
            expect(screen.getByText("Studio")).toBeTruthy();
        });

        it("does NOT show Studio link for unauthenticated users", () => {
            (useSession as jest.Mock).mockReturnValue({ data: null, status: "unauthenticated" });
            render(<NavBar />);
            expect(screen.queryByText("Studio")).toBeNull();
        });

        it("shows Sign out for authenticated admin", () => {
            (useSession as jest.Mock).mockReturnValue({
                data: { user: { email: "admin@example.com", isAdmin: true } },
                status: "authenticated",
            });
            render(<NavBar />);
            expect(screen.getByText("Sign out")).toBeTruthy();
        });
    });

    describe("Hidden Chat Command", () => {
        let pushMock: jest.Mock;

        beforeEach(() => {
            pushMock = jest.fn();
            (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
        });

        // We changed the implementation in ChatInterface.tsx to use useRouter
        // to make it testable and idiomatic for Next.js
        it("redirects to /studio when API returns open_admin_studio action", async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    json: () =>
                        Promise.resolve({
                            reply: "Opening admin studio...",
                            action: "open_admin_studio",
                        }),
                })
            ) as jest.Mock;

            jest.useFakeTimers();

            render(<ChatInterface />);
            const input = screen.getByRole("textbox");
            const submitBtn = screen.getByText("Send");

            fireEvent.change(input, { target: { value: "/admin" } });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(screen.getByText("Opening admin studio...")).toBeTruthy();
            });

            jest.runAllTimers();

            expect(pushMock).toHaveBeenCalledWith("/studio");

            jest.useRealTimers();
        });

        it("does not redirect when no action is returned", async () => {
            global.fetch = jest.fn(() =>
                Promise.resolve({
                    json: () =>
                        Promise.resolve({
                            reply: "Just a normal reply.",
                        }),
                })
            ) as jest.Mock;

            jest.useFakeTimers();

            render(<ChatInterface />);
            const input = screen.getByRole("textbox");
            const submitBtn = screen.getByText("Send");

            fireEvent.change(input, { target: { value: "Hello" } });
            fireEvent.click(submitBtn);

            await waitFor(() => {
                expect(screen.getByText("Just a normal reply.")).toBeTruthy();
            });

            jest.runAllTimers();

            expect(pushMock).not.toHaveBeenCalled();

            jest.useRealTimers();
        });
    });
});
