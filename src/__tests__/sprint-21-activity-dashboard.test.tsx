/**
 * Sprint 21 Tests — Admin Activity Dashboard
 */
import { render, screen } from "@testing-library/react";
import ActivityDashboard from "@/components/ActivityDashboard";

// Mock fetch to return activities
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () =>
            Promise.resolve({
                activities: [
                    {
                        id: "act_1",
                        type: "audio_uploaded",
                        timestamp: "2026-03-06T12:00:00Z",
                        metadata: { fileName: "test.webm" },
                    },
                    {
                        id: "act_2",
                        type: "article_generated",
                        timestamp: "2026-03-06T12:05:00Z",
                        metadata: { title: "Test Article" },
                    },
                ],
            }),
    })
) as jest.Mock;

describe("Sprint 21 — Admin Activity Dashboard", () => {
    it("renders the activity dashboard", async () => {
        render(<ActivityDashboard />);
        expect(screen.getByText(/Recent Activity/i)).toBeTruthy();
    });

    it("fetches activities on mount", () => {
        render(<ActivityDashboard />);
        expect(global.fetch).toHaveBeenCalledWith("/api/activity");
    });

    it("shows a refresh button", () => {
        render(<ActivityDashboard />);
        expect(screen.getByText("Refresh")).toBeTruthy();
    });
});
