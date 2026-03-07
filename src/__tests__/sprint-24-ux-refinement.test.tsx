/**
 * Sprint 24 Tests — UX Refinement (updated for Sprint 25 layout)
 */
import { render, screen } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ reply: "Hello!" }),
    })
) as jest.Mock;

const mockPosts = [
    { slug: "post-1", title: "First Post", date: "2026-03-06", excerpt: "First post excerpt." },
    { slug: "post-2", title: "Second Post", date: "2026-03-05", excerpt: "Second post excerpt." },
];

describe("Sprint 24 — UX Refinement", () => {
    it("renders blog cards with proper structure", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByText("First Post")).toBeTruthy();
        expect(screen.getByText("Second Post")).toBeTruthy();
    });

    it("shows post dates on cards", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByText("2026-03-06")).toBeTruthy();
        expect(screen.getByText("2026-03-05")).toBeTruthy();
    });

    it("shows excerpts on cards", () => {
        render(<HomeClient posts={mockPosts} />);
        expect(screen.getByText("First post excerpt.")).toBeTruthy();
        expect(screen.getByText("Second post excerpt.")).toBeTruthy();
    });

    it("displays the chat as the primary interaction area", () => {
        render(<HomeClient posts={mockPosts} />);
        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        expect(input).toBeTruthy();
    });

    it("shows empty state when no posts exist", () => {
        render(<HomeClient posts={[]} />);
        expect(screen.getByText(/No posts yet/i)).toBeTruthy();
    });
});
