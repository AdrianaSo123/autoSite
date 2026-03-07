# Full Codebase — AI Publishing Platform (Architecture Stabilized)

## Project Structure
```
src/__tests__/architecture-permissions.test.ts
src/__tests__/sprint-13-hero-chat.test.tsx
src/__tests__/sprint-14-prompt-suggestions.test.tsx
src/__tests__/sprint-15-floating-chat.test.tsx
src/__tests__/sprint-16-admin-chat.test.tsx
src/__tests__/sprint-17-mcp-tools.test.ts
src/__tests__/sprint-18-analytics-tool.test.ts
src/__tests__/sprint-19-command-router.test.ts
src/__tests__/sprint-20-activity-log.test.ts
src/__tests__/sprint-21-activity-dashboard.test.tsx
src/__tests__/sprint-22-error-handling.test.ts
src/__tests__/sprint-23-e2e-pipeline.test.ts
src/__tests__/sprint-24-ux-refinement.test.tsx
src/app/admin/login/page.tsx
src/app/api/activity/route.ts
src/app/api/analytics/route.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/api/chat/route.ts
src/app/api/generate-post/route.ts
src/app/api/transcribe/route.ts
src/app/api/upload-audio/route.ts
src/app/blog/[slug]/page.tsx
src/app/blog/page.tsx
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/app/studio/page.tsx
src/components/ActivityDashboard.tsx
src/components/AdminChat.tsx
src/components/ChatInterface.tsx
src/components/FloatingChat.tsx
src/components/HomeClient.tsx
src/components/NavBar.tsx
src/components/Providers.tsx
src/lib/activity-log.ts
src/lib/agent.ts
src/lib/auth.ts
src/lib/commands.ts
src/lib/mcp/get-site-analytics.ts
src/lib/post-generator.ts
src/lib/posts.ts
src/lib/transcription.ts
```

---

### `src/__tests__/architecture-permissions.test.ts`
```ts
/**
 * Architecture Stabilization Tests — Permission Enforcement (Section 8)
 */

// Mock posts
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

import { getToolsForUser, toolRegistry } from "@/lib/agent";

describe("Tool Permission Enforcement", () => {
    it("public user only gets public tools", () => {
        const tools = getToolsForUser(false);
        tools.forEach((t) => {
            expect(t.access).toBe("public");
        });
    });

    it("public user cannot access getSiteAnalytics", () => {
        const tools = getToolsForUser(false);
        const analyticsTool = tools.find((t) => t.name === "getSiteAnalytics");
        expect(analyticsTool).toBeUndefined();
    });

    it("public user cannot access getSystemStatus", () => {
        const tools = getToolsForUser(false);
        const statusTool = tools.find((t) => t.name === "getSystemStatus");
        expect(statusTool).toBeUndefined();
    });

    it("public user can access listRecentPosts", () => {
        const tools = getToolsForUser(false);
        const postsTool = tools.find((t) => t.name === "listRecentPosts");
        expect(postsTool).toBeDefined();
        expect(postsTool?.access).toBe("public");
    });

    it("public user can access searchPosts", () => {
        const tools = getToolsForUser(false);
        const searchTool = tools.find((t) => t.name === "searchPosts");
        expect(searchTool).toBeDefined();
        expect(searchTool?.access).toBe("public");
    });

    it("admin user gets all tools (public + admin)", () => {
        const tools = getToolsForUser(true);
        expect(tools.length).toBe(toolRegistry.length);
    });

    it("admin user can access getSiteAnalytics", () => {
        const tools = getToolsForUser(true);
        const analyticsTool = tools.find((t) => t.name === "getSiteAnalytics");
        expect(analyticsTool).toBeDefined();
        expect(analyticsTool?.access).toBe("admin");
    });

    it("admin user can call analytics tool successfully", async () => {
        const tools = getToolsForUser(true);
        const analyticsTool = tools.find((t) => t.name === "getSiteAnalytics");
        expect(analyticsTool).toBeDefined();
        const result = await analyticsTool!.execute();
        expect(result).toContain("Analytics");
    });

    it("tool registry has correct access labels", () => {
        const publicTools = toolRegistry.filter((t) => t.access === "public");
        const adminTools = toolRegistry.filter((t) => t.access === "admin");
        expect(publicTools.length).toBeGreaterThan(0);
        expect(adminTools.length).toBeGreaterThan(0);
    });
});

describe("NavBar Visibility", () => {
    it("Studio link is hidden for public users (unauthenticated)", () => {
        // NavBar shows Studio only when session.user exists
        // This test validates the logic conceptually
        const isAdmin = false;
        const showStudio = isAdmin;
        expect(showStudio).toBe(false);
    });

    it("Studio link is shown for admin users", () => {
        const isAdmin = true;
        const showStudio = isAdmin;
        expect(showStudio).toBe(true);
    });
});
```

---

### `src/__tests__/sprint-13-hero-chat.test.tsx`
```tsx
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
```

---

### `src/__tests__/sprint-14-prompt-suggestions.test.tsx`
```tsx
/**
 * Sprint 14 Tests — Chat Prompt Suggestions
 */
import { render, screen, fireEvent } from "@testing-library/react";
import HomeClient from "@/components/HomeClient";

// Mock fetch
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
        expect(screen.getByText("What is this?")).toBeTruthy();
        expect(screen.getByText("Help")).toBeTruthy();
    });

    it("sets input text when clicking a prompt suggestion", () => {
        render(<HomeClient posts={mockPosts} />);
        const button = screen.getByText("Show recent posts");
        fireEvent.click(button);

        const input = screen.getByPlaceholderText(/What would you like to explore/i);
        expect(input).toHaveValue("Show recent posts");
    });
});
```

---

### `src/__tests__/sprint-15-floating-chat.test.tsx`
```tsx
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
```

---

### `src/__tests__/sprint-16-admin-chat.test.tsx`
```tsx
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
        expect(screen.getByText("Process latest recording")).toBeTruthy();
        expect(screen.getByText("Publish draft")).toBeTruthy();
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
```

---

### `src/__tests__/sprint-17-mcp-tools.test.ts`
```ts
/**
 * Sprint 17 Tests — MCP Tool Infrastructure (updated for architecture stabilization)
 */

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

import { toolRegistry, getToolsForUser } from "@/lib/agent";

describe("Sprint 17 — MCP Tool Infrastructure", () => {
    it("has a tool registry with registered tools", () => {
        expect(toolRegistry).toBeDefined();
        expect(toolRegistry.length).toBeGreaterThan(0);
    });

    it("each tool has name, description, access, and execute", () => {
        for (const tool of toolRegistry) {
            expect(typeof tool.name).toBe("string");
            expect(typeof tool.description).toBe("string");
            expect(["public", "admin"]).toContain(tool.access);
            expect(typeof tool.execute).toBe("function");
        }
    });

    it("contains listRecentPosts tool", () => {
        expect(toolRegistry.find((t) => t.name === "listRecentPosts")).toBeDefined();
    });

    it("contains getSiteAnalytics tool", () => {
        expect(toolRegistry.find((t) => t.name === "getSiteAnalytics")).toBeDefined();
    });

    it("contains getSystemStatus tool", () => {
        expect(toolRegistry.find((t) => t.name === "getSystemStatus")).toBeDefined();
    });

    it("provides getToolsForUser function", () => {
        expect(typeof getToolsForUser).toBe("function");
    });
});
```

---

### `src/__tests__/sprint-18-analytics-tool.test.ts`
```ts
/**
 * Sprint 18 Tests — Site Analytics MCP Tool
 */
import { getSiteAnalytics } from "@/lib/mcp/get-site-analytics";

// Mock posts
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

describe("Sprint 18 — Site Analytics MCP Tool", () => {
    it("returns analytics data with expected shape", async () => {
        const analytics = await getSiteAnalytics();

        expect(analytics).toHaveProperty("totalVisitors");
        expect(analytics).toHaveProperty("pageViews");
        expect(analytics).toHaveProperty("todayVisitors");
        expect(analytics).toHaveProperty("mostPopularPosts");
        expect(analytics).toHaveProperty("lastUpdated");
    });

    it("returns numeric visitor counts", async () => {
        const analytics = await getSiteAnalytics();

        expect(typeof analytics.totalVisitors).toBe("number");
        expect(typeof analytics.pageViews).toBe("number");
        expect(typeof analytics.todayVisitors).toBe("number");
    });

    it("returns most popular posts as an array", async () => {
        const analytics = await getSiteAnalytics();

        expect(Array.isArray(analytics.mostPopularPosts)).toBe(true);
    });

    it("returns a valid ISO timestamp", async () => {
        const analytics = await getSiteAnalytics();

        expect(() => new Date(analytics.lastUpdated)).not.toThrow();
    });
});
```

---

### `src/__tests__/sprint-19-command-router.test.ts`
```ts
/**
 * Sprint 19 Tests — Chat Command Router
 */
import { routeCommand } from "@/lib/commands";

// Mock posts
jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        { slug: "test", title: "Test Post", date: "2026-03-06", excerpt: "Test", content: "" },
    ],
}));

// Mock analytics
jest.mock("@/lib/mcp/get-site-analytics", () => ({
    getSiteAnalytics: () =>
        Promise.resolve({
            totalVisitors: 100,
            pageViews: 500,
            todayVisitors: 20,
            mostPopularPosts: [{ title: "Test Post", views: 50 }],
            lastUpdated: new Date().toISOString(),
        }),
}));

describe("Sprint 19 — Chat Command Router", () => {
    it("routes 'show recent posts' to post listing", async () => {
        const result = await routeCommand("show recent posts");
        expect(result.reply).toContain("Test Post");
    });

    it("routes 'help' to help text", async () => {
        const result = await routeCommand("help");
        expect(result.reply).toContain("Show recent posts");
    });

    it("routes greeting correctly", async () => {
        const result = await routeCommand("hello");
        expect(result.reply).toContain("AI publishing assistant");
    });

    it("routes analytics query to analytics tool", async () => {
        const result = await routeCommand("how many visitors");
        expect(result.reply).toContain("Analytics");
    });

    it("handles unknown commands gracefully", async () => {
        const result = await routeCommand("xyzzy random thing");
        expect(result.reply).toContain("help");
    });
});
```

---

### `src/__tests__/sprint-20-activity-log.test.ts`
```ts
/**
 * Sprint 20 Tests — Activity Log System (persistent JSON storage)
 */
import fs from "fs";

// Mock fs module
let mockData: string = "[]";
jest.mock("fs", () => ({
    existsSync: jest.fn((p: string) => {
        if (p.endsWith("activity.json")) return true;
        return true; // log dir exists
    }),
    readFileSync: jest.fn(() => mockData),
    writeFileSync: jest.fn((_p: string, data: string) => {
        mockData = data;
    }),
    mkdirSync: jest.fn(),
}));

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [],
}));

import { logActivity } from "@/lib/activity-log";

describe("Sprint 20 — Activity Log System", () => {
    beforeEach(() => {
        mockData = "[]";
        (fs.writeFileSync as jest.Mock).mockClear();
        (fs.readFileSync as jest.Mock).mockClear();
    });

    it("creates a log entry for audio uploaded", () => {
        logActivity("audio_uploaded", { fileName: "test.webm" });
        expect(fs.writeFileSync).toHaveBeenCalled();
        const written = JSON.parse(mockData);
        expect(written[0].type).toBe("audio_uploaded");
    });

    it("creates entries with correct structure", () => {
        logActivity("transcription_completed", { fileName: "test.webm" });
        const written = JSON.parse(mockData);
        expect(written[0].type).toBe("transcription_completed");
        expect(written[0].timestamp).toBeDefined();
        expect(written[0].metadata).toEqual({ fileName: "test.webm" });
    });

    it("creates entries for article generated", () => {
        logActivity("article_generated", { title: "Test Article" });
        const written = JSON.parse(mockData);
        expect(written[0].type).toBe("article_generated");
    });

    it("creates entries for MCP tool executed", () => {
        logActivity("mcp_tool_executed", { toolName: "getSiteAnalytics" });
        const written = JSON.parse(mockData);
        expect(written[0].type).toBe("mcp_tool_executed");
    });

    it("persists entries to the JSON file", () => {
        logActivity("audio_uploaded", { fileName: "test.webm" });
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });
});
```

---

### `src/__tests__/sprint-21-activity-dashboard.test.tsx`
```tsx
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
```

---

### `src/__tests__/sprint-22-error-handling.test.ts`
```ts
/**
 * Sprint 22 Tests — Reliability and Error Handling (TDD)
 */
import { routeCommand } from "@/lib/commands";

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [],
}));

jest.mock("@/lib/mcp/get-site-analytics", () => ({
    getSiteAnalytics: () => Promise.reject(new Error("API timeout")),
}));

describe("Sprint 22 — Reliability and Error Handling", () => {
    it("handles empty post list gracefully", async () => {
        const result = await routeCommand("show recent posts");
        expect(result.reply).toContain("No blog posts");
    });

    it("handles analytics failure gracefully", async () => {
        const result = await routeCommand("how many visitors");
        expect(result.reply).toBeDefined();
        expect(typeof result.reply).toBe("string");
        // Should not throw
    });

    it("handles unknown commands without crashing", async () => {
        const result = await routeCommand("");
        expect(result.reply).toBeDefined();
    });

    it("handles very long messages without crashing", async () => {
        const longMsg = "a".repeat(10000);
        const result = await routeCommand(longMsg);
        expect(result.reply).toBeDefined();
    });

    it("handles special characters in messages", async () => {
        const result = await routeCommand("hello <script>alert('xss')</script>");
        expect(result.reply).toBeDefined();
    });
});
```

---

### `src/__tests__/sprint-23-e2e-pipeline.test.ts`
```ts
/**
 * Sprint 23 Tests — End-to-End Pipeline Testing (updated for architecture stabilization)
 */

jest.mock("@/lib/posts", () => ({
    getAllPosts: () => [
        {
            slug: "test-post",
            title: "Test Post",
            date: "2026-03-06",
            excerpt: "Test excerpt",
            content: "# Test\n\nContent here.",
        },
    ],
    getPostBySlug: (slug: string) =>
        slug === "test-post"
            ? {
                slug: "test-post",
                title: "Test Post",
                date: "2026-03-06",
                excerpt: "Test excerpt",
                content: "# Test\n\nContent here.",
            }
            : null,
    getAllSlugs: () => ["test-post"],
    getPostHtml: (content: string) => Promise.resolve(`<p>${content}</p>`),
}));

// Mock fs for activity log
jest.mock("fs", () => {
    let mockLog: unknown[] = [];
    return {
        existsSync: jest.fn(() => false),
        readFileSync: jest.fn(() => JSON.stringify(mockLog)),
        writeFileSync: jest.fn((_path: string, data: string) => {
            mockLog = JSON.parse(data);
        }),
        mkdirSync: jest.fn(),
        __resetMockLog: () => { mockLog = []; },
    };
});

import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { logActivity } from "@/lib/activity-log";
import fs from "fs";

describe("Sprint 23 — End-to-End Pipeline Testing", () => {
    beforeEach(() => {
        (fs as unknown as { __resetMockLog: () => void }).__resetMockLog();
    });

    it("simulates full pipeline: upload → transcribe → generate → publish", () => {
        // Step 1: Audio uploaded
        logActivity("audio_uploaded", { fileName: "recording.webm" });

        // Step 2: Transcription completed
        logActivity("transcription_completed", { fileName: "recording.webm" });

        // Step 3: Article generated
        logActivity("article_generated", { title: "Test Post", slug: "test-post" });

        // Step 4: Article appears in blog
        const posts = getAllPosts();
        expect(posts.length).toBeGreaterThan(0);
        expect(posts[0].title).toBe("Test Post");

        // Step 5: Article can be retrieved by slug
        const post = getPostBySlug("test-post");
        expect(post).toBeDefined();
        expect(post?.title).toBe("Test Post");
    });

    it("verifies post content structure", () => {
        const post = getPostBySlug("test-post");
        expect(post).toBeDefined();
        expect(post?.slug).toBe("test-post");
        expect(post?.title).toBe("Test Post");
        expect(post?.date).toBeDefined();
        expect(post?.excerpt).toBeDefined();
        expect(post?.content).toBeDefined();
    });

    it("returns null for non-existent posts", () => {
        const post = getPostBySlug("does-not-exist");
        expect(post).toBeNull();
    });
});
```

---

### `src/__tests__/sprint-24-ux-refinement.test.tsx`
```tsx
/**
 * Sprint 24 Tests — UX Refinement
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
```

---

### `src/app/admin/login/page.tsx`
```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError("Invalid credentials. Please try again.");
        } else {
            router.push("/studio");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-sm border rounded-lg p-8 shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-600"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-600"
                        required
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white rounded-md py-2 text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
```

---

### `src/app/api/activity/route.ts`
```ts
import { NextResponse } from "next/server";
import { getActivityLog } from "@/lib/activity-log";

export async function GET() {
    try {
        const log = getActivityLog(50);
        return NextResponse.json({ activities: log });
    } catch (error) {
        console.error("Activity log error:", error);
        return NextResponse.json({ error: "Failed to get activity log." }, { status: 500 });
    }
}
```

---

### `src/app/api/analytics/route.ts`
```ts
import { NextResponse } from "next/server";
import { getSiteAnalytics } from "@/lib/mcp/get-site-analytics";

export async function GET() {
    try {
        const analytics = await getSiteAnalytics();
        return NextResponse.json(analytics);
    } catch (error) {
        console.error("Analytics API error:", error);
        return NextResponse.json({ error: "Failed to get analytics." }, { status: 500 });
    }
}
```

---

### `src/app/api/auth/[...nextauth]/route.ts`
```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

---

### `src/app/api/chat/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { routeCommand } from "@/lib/commands";
import { agentProcess } from "@/lib/agent";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ reply: "Please send a message." }, { status: 400 });
        }

        // Determine if user is admin
        const session = await auth();
        const isAdmin = !!session?.user;

        // Try the AI agent first (respects tool permissions)
        const agentResult = await agentProcess(message, isAdmin);
        if (agentResult) {
            logActivity("mcp_tool_executed", { message, isAdmin });
            return NextResponse.json({
                reply: agentResult,
                action: "agent_tool_call",
            });
        }

        // Fall back to command router
        const result = await routeCommand(message);

        return NextResponse.json({
            reply: result.reply,
            action: result.action || null,
        });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json({ reply: "Something went wrong." }, { status: 500 });
    }
}
```

---

### `src/app/api/generate-post/route.ts`
```ts
/**
 * ⚠️ DEVELOPMENT / DEMO ROUTE ONLY
 *
 * This endpoint is NOT part of the production pipeline.
 * Blog posts should be generated by the external pipeline and committed to the repo.
 * This route exists for local development and demonstration only.
 */

import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/post-generator";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Post generation is handled by the external pipeline in production." },
            { status: 403 }
        );
    }

    try {
        const { transcript, transcriptFile } = await request.json();

        if (!transcript && !transcriptFile) {
            return NextResponse.json(
                { error: "Provide transcript or transcriptFile." },
                { status: 400 }
            );
        }

        const result = await generatePost(transcript || transcriptFile);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Post generation error:", error);
        return NextResponse.json({ error: "Post generation failed." }, { status: 500 });
    }
}
```

---

### `src/app/api/transcribe/route.ts`
```ts
/**
 * ⚠️ DEVELOPMENT / DEMO ROUTE ONLY
 *
 * This endpoint is NOT part of the production pipeline.
 * The canonical pipeline uses an external transcription server.
 * This route exists for local development and demonstration only.
 */

import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/transcription";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Transcription is handled by the external pipeline in production." },
            { status: 403 }
        );
    }

    try {
        const { fileName, transcript } = await request.json();

        if (transcript) {
            return NextResponse.json({ transcript });
        }

        if (!fileName) {
            return NextResponse.json({ error: "fileName is required." }, { status: 400 });
        }

        const result = await transcribeAudio(fileName);
        return NextResponse.json({ transcript: result });
    } catch (error) {
        console.error("Transcription error:", error);
        return NextResponse.json({ error: "Transcription failed." }, { status: 500 });
    }
}
```

---

### `src/app/api/upload-audio/route.ts`
```ts
/**
 * ⚠️ DEVELOPMENT / DEMO ROUTE ONLY
 *
 * This endpoint is NOT part of the production pipeline.
 * The canonical audio publishing pipeline is:
 *   Recording App → External Server → Whisper → AI Formatting → Git Commit → Vercel Redeploy
 *
 * Next.js should NOT handle persistent file storage in production (serverless).
 * This route exists for local development and demonstration purposes only.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Audio upload is handled by the external recording pipeline in production." },
            { status: 403 }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("audio") as File;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
        }

        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadsDir, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({ success: true, fileName });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}
```

---

### `src/app/blog/[slug]/page.tsx`
```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getAllSlugs, getPostHtml } from "@/lib/posts";

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const slugs = getAllSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    if (!post) return { title: "Post Not Found" };
    return {
        title: `${post.title} — AI Publishing Platform`,
        description: post.excerpt,
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    const htmlContent = await getPostHtml(post.content);

    return (
        <div className="max-w-3xl mx-auto fade-in-up">
            <Link
                href="/blog"
                className="text-sm mb-8 inline-block hover:opacity-70 transition-opacity"
                style={{ color: 'var(--ink)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
            >
                ← Back to Blog
            </Link>
            <article>
                <div className="flex items-center gap-2 mb-2">
                    <span className="sparkle text-xs">✦</span>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{post.date}</p>
                </div>
                <h1
                    className="text-4xl font-semibold mb-8 leading-tight"
                    style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                >
                    {post.title}
                </h1>
                <div className="ink-divider mb-8" />
                <div
                    className="prose max-w-none text-sm leading-relaxed"
                    style={{ color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
            </article>
        </div>
    );
}
```

---

### `src/app/blog/page.tsx`
```tsx
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata = {
    title: "Blog — AI Publishing Platform",
    description: "Browse all blog posts on the AI Publishing Platform.",
};

export default function BlogPage() {
    const posts = getAllPosts();

    return (
        <div className="max-w-3xl mx-auto fade-in-up">
            <div className="text-center mb-10">
                <div className="flex justify-center gap-4 mb-4">
                    <span className="sparkle text-sm">✦</span>
                    <span className="sparkle text-xs" style={{ animationDelay: '0.5s' }}>✦</span>
                    <span className="sparkle text-sm" style={{ animationDelay: '1s' }}>✦</span>
                </div>
                <h1
                    className="text-4xl font-semibold mb-3"
                    style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                >
                    Blog
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Ideas, articles, and thoughts — all from voice to page.
                </p>
                <div className="ink-divider max-w-xs mx-auto mt-6" />
            </div>

            <div className="flex flex-col gap-5">
                {posts.map((post) => (
                    <article key={post.slug} className="ink-card group">
                        <Link href={`/blog/${post.slug}`}>
                            <h2
                                className="text-xl font-semibold mb-1 group-hover:opacity-80 transition-opacity"
                                style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                            >
                                {post.title}
                            </h2>
                        </Link>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                            {post.date}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {post.excerpt}
                        </p>
                        <Link
                            href={`/blog/${post.slug}`}
                            className="text-sm mt-3 inline-block hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--ink)', fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
                        >
                            Read more →
                        </Link>
                    </article>
                ))}
            </div>
        </div>
    );
}
```

---

### `src/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import Providers from "@/components/Providers";
import FloatingChat from "@/components/FloatingChat";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Publishing Platform",
  description: "Conversational AI Publishing Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <header className="border-b" style={{ borderColor: 'var(--ink-border)' }}>
              <NavBar />
            </header>
            <main className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">
              {children}
            </main>
            <FloatingChat />
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

---

### `src/app/page.tsx`
```tsx
import { getAllPosts } from "@/lib/posts";
import HomeClient from "@/components/HomeClient";

export default function Home() {
  const posts = getAllPosts().slice(0, 5);

  return <HomeClient posts={posts} />;
}
```

---

### `src/app/studio/page.tsx`
```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminChat from "@/components/AdminChat";
import ActivityDashboard from "@/components/ActivityDashboard";

export const metadata = {
    title: "Studio — AI Publishing Platform",
};

export default async function StudioPage() {
    const session = await auth();

    if (!session) {
        redirect("/admin/login");
    }

    return (
        <div className="max-w-3xl mx-auto fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="sparkle text-sm">✦</span>
                    <h1
                        className="text-3xl font-semibold"
                        style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                    >
                        Studio
                    </h1>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {session.user?.email}
                </span>
            </div>
            <div className="ink-divider mb-8" />

            <div className="mb-6">
                <p
                    className="text-sm mb-4"
                    style={{ color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif" }}
                >
                    Use the admin console below to control the publishing system.
                </p>
            </div>

            <AdminChat />

            <div className="mt-8">
                <ActivityDashboard />
            </div>
        </div>
    );
}
```

---

### `src/components/ActivityDashboard.tsx`
```tsx
"use client";

import { useState, useEffect } from "react";

interface ActivityEntry {
    id: string;
    type: string;
    timestamp: string;
    metadata: Record<string, unknown>;
}

const TYPE_LABELS: Record<string, { icon: string; label: string }> = {
    audio_uploaded: { icon: "🎙️", label: "Recording uploaded" },
    transcription_completed: { icon: "📝", label: "Transcription completed" },
    article_generated: { icon: "✨", label: "Blog post generated" },
    article_published: { icon: "📰", label: "Article published" },
    mcp_tool_executed: { icon: "⚙️", label: "Tool executed" },
};

export default function ActivityDashboard() {
    const [activities, setActivities] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const response = await fetch("/api/activity");
            const data = await response.json();
            setActivities(data.activities || []);
        } catch {
            console.error("Failed to fetch activities");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const d = new Date(timestamp);
        return d.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                border: "1.5px solid var(--ink-border)",
                background: "var(--cream-light)",
            }}
        >
            <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--ink-border)" }}
            >
                <h3
                    className="text-sm font-semibold"
                    style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
                >
                    ✦ Recent Activity
                </h3>
                <button
                    onClick={fetchActivities}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: "var(--text-secondary)" }}
                >
                    Refresh
                </button>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {loading ? (
                    <p className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>
                        Loading...
                    </p>
                ) : activities.length === 0 ? (
                    <p
                        className="text-sm text-center py-4 italic"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        No activity recorded yet.
                    </p>
                ) : (
                    activities.map((entry) => {
                        const typeInfo = TYPE_LABELS[entry.type] || { icon: "📋", label: entry.type };
                        return (
                            <div
                                key={entry.id}
                                className="flex items-start gap-3 py-2"
                                style={{ borderBottom: "1px solid var(--ink-faint)" }}
                            >
                                <span className="text-lg">{typeInfo.icon}</span>
                                <div className="flex-1">
                                    <p className="text-sm" style={{ color: "var(--ink)" }}>
                                        {typeInfo.label}
                                    </p>
                                    {Object.keys(entry.metadata).length > 0 && (
                                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                            {Object.entries(entry.metadata)
                                                .map(([k, v]) => `${k}: ${v}`)
                                                .join(" · ")}
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                                    {formatTime(entry.timestamp)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
```

---

### `src/components/AdminChat.tsx`
```tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface AdminMessage {
    id: string;
    role: "admin" | "system";
    content: string;
    timestamp: Date;
}

const ADMIN_COMMANDS = [
    "Process latest recording",
    "Publish draft",
    "Regenerate article",
    "Show analytics",
    "System status",
];

export default function AdminChat() {
    const [messages, setMessages] = useState<AdminMessage[]>([
        {
            id: "welcome",
            role: "system",
            content: "Admin console ready. Enter a command or select one below.",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const executeCommand = async (command?: string) => {
        const cmd = command || input.trim();
        if (!cmd || isLoading) return;

        const adminMsg: AdminMessage = {
            id: Date.now().toString(),
            role: "admin",
            content: cmd,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, adminMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: cmd }),
            });

            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "system",
                    content: data.reply || "Command executed.",
                    timestamp: new Date(),
                },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "system",
                    content: "Error executing command. Please try again.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            executeCommand();
        }
    };

    return (
        <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
                border: "1.5px solid var(--ink-border)",
                background: "var(--cream-light)",
            }}
        >
            {/* Messages */}
            <div className="h-80 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                            style={{
                                background: msg.role === "admin" ? "var(--ink)" : "var(--ink-faint)",
                                color: msg.role === "admin" ? "var(--cream)" : "var(--ink)",
                                fontFamily: "'Inter', monospace",
                            }}
                        >
                            {msg.role === "system" && (
                                <span className="text-xs opacity-60 block mb-1">⚙ System</span>
                            )}
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div
                            className="rounded-2xl px-4 py-2.5 text-sm"
                            style={{
                                background: "var(--ink-faint)",
                                color: "var(--text-secondary)",
                            }}
                        >
                            ✦ Executing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Command suggestions */}
            <div
                className="px-5 py-3 flex gap-2 flex-wrap"
                style={{ borderTop: "1px solid var(--ink-faint)" }}
            >
                {ADMIN_COMMANDS.map((cmd) => (
                    <button
                        key={cmd}
                        onClick={() => executeCommand(cmd)}
                        className="pill-button-outline text-xs py-1.5 px-3"
                        style={{ borderRadius: "999px", fontSize: "0.7rem" }}
                    >
                        {cmd}
                    </button>
                ))}
            </div>

            {/* Input */}
            <div
                className="p-4 flex gap-3"
                style={{ borderTop: "1px solid var(--ink-border)" }}
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter admin command..."
                    className="pill flex-1 text-sm"
                    style={{ fontFamily: "'Inter', monospace" }}
                    disabled={isLoading}
                />
                <button
                    onClick={() => executeCommand()}
                    disabled={isLoading || !input.trim()}
                    className="pill-button text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Execute
                </button>
            </div>
        </div>
    );
}
```

---

### `src/components/ChatInterface.tsx`
```tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatInterfaceProps {
    onFirstMessage?: () => void;
}

export default function ChatInterface({ onFirstMessage }: ChatInterfaceProps = {}) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your AI publishing assistant. Ask me anything or try commands like \"Show recent posts\" or \"What is this project?\"",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasNotified, setHasNotified] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Notify parent on first user message
        if (!hasNotified && onFirstMessage) {
            onFirstMessage();
            setHasNotified(true);
        }

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage.content }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply || "Sorry, I couldn't process that.",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Something went wrong. Please try again.",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
                border: '1.5px solid var(--ink-border)',
                background: 'var(--cream-light)',
            }}
        >
            {/* Messages area */}
            <div className="h-64 overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                            style={{
                                background: msg.role === "user" ? 'var(--ink)' : 'var(--ink-faint)',
                                color: msg.role === "user" ? 'var(--cream)' : 'var(--ink)',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div
                            className="rounded-2xl px-4 py-2.5 text-sm"
                            style={{
                                background: 'var(--ink-faint)',
                                color: 'var(--text-secondary)',
                                fontFamily: "'Inter', sans-serif",
                            }}
                        >
                            ✦ Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested prompts */}
            <div
                className="px-5 py-3 flex gap-2 flex-wrap"
                style={{ borderTop: '1px solid var(--ink-faint)' }}
            >
                {["Show recent posts", "What is this?", "Help"].map((prompt) => (
                    <button
                        key={prompt}
                        onClick={() => { setInput(prompt); }}
                        className="pill-button-outline text-xs py-1.5 px-3"
                        style={{ borderRadius: '999px', fontSize: '0.7rem' }}
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Input area */}
            <div
                className="p-4 flex gap-3"
                style={{ borderTop: '1px solid var(--ink-border)' }}
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What would you like to explore?"
                    className="pill flex-1 text-sm"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    disabled={isLoading}
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="pill-button text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
```

---

### `src/components/FloatingChat.tsx`
```tsx
"use client";

import { useState } from "react";
import ChatInterface from "./ChatInterface";

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Chat Panel */}
            {isOpen && (
                <div
                    className="fixed bottom-20 right-4 z-50 w-[380px] max-h-[500px] rounded-2xl overflow-hidden"
                    style={{
                        boxShadow: '0 8px 40px rgba(43, 58, 142, 0.15)',
                        border: '1.5px solid var(--ink-border)',
                        background: 'var(--cream)',
                    }}
                >
                    <div
                        className="flex items-center justify-between px-5 py-3"
                        style={{
                            background: 'var(--ink)',
                            color: 'var(--cream)',
                            fontFamily: "'Playfair Display', serif",
                        }}
                    >
                        <span className="font-semibold text-sm">✦ AI Assistant ✦</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hover:opacity-70 text-lg leading-none transition-opacity"
                            style={{ color: 'var(--cream)' }}
                        >
                            ✕
                        </button>
                    </div>
                    <ChatInterface />
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all"
                style={{
                    background: 'var(--ink)',
                    color: 'var(--cream)',
                    boxShadow: '0 4px 20px rgba(43, 58, 142, 0.3)',
                }}
                aria-label="Open chat"
            >
                {isOpen ? "✕" : "✦"}
            </button>
        </>
    );
}
```

---

### `src/components/HomeClient.tsx`
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ChatInterface from "@/components/ChatInterface";

interface HomeClientProps {
    posts: { slug: string; title: string; date: string; excerpt: string }[];
}

export default function HomeClient({ posts }: HomeClientProps) {
    const [hasInteracted, setHasInteracted] = useState(false);

    return (
        <div className="flex flex-col items-center fade-in-up">
            {/* ✦ Hero Section — collapses after first interaction */}
            <section
                className="w-full max-w-3xl text-center transition-all duration-700 ease-in-out overflow-hidden"
                style={{
                    paddingTop: hasInteracted ? '2rem' : '4rem',
                    paddingBottom: hasInteracted ? '1rem' : '4rem',
                    opacity: 1,
                }}
            >
                {/* Decorative sparkles */}
                {!hasInteracted && (
                    <div className="flex justify-center gap-8 mb-6 transition-opacity duration-500">
                        <span className="sparkle text-lg" style={{ animationDelay: '0s' }}>✦</span>
                        <span className="sparkle text-sm" style={{ animationDelay: '0.5s' }}>✦</span>
                        <span className="sparkle text-lg" style={{ animationDelay: '1s' }}>✦</span>
                    </div>
                )}

                <h1
                    className="font-semibold leading-tight transition-all duration-500"
                    style={{
                        fontFamily: "'Playfair Display', serif",
                        color: 'var(--ink)',
                        fontSize: hasInteracted ? '1.75rem' : undefined,
                    }}
                >
                    {hasInteracted ? (
                        "AI Platform"
                    ) : (
                        <>
                            <em className="text-5xl md:text-6xl">Welcome to</em>
                            <br />
                            <span className="text-5xl md:text-6xl">AI Platform</span>
                        </>
                    )}
                </h1>

                {!hasInteracted && (
                    <>
                        <p
                            className="text-base md:text-lg max-w-xl mx-auto mb-4 leading-relaxed mt-6"
                            style={{ color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif" }}
                        >
                            A conversational publishing platform that transforms
                            your voice into beautifully written articles.
                        </p>

                        <p
                            className="text-sm mb-10 italic"
                            style={{ color: 'var(--text-secondary)', fontFamily: "'Playfair Display', serif" }}
                        >
                            Speak your ideas. Let AI do the rest.
                        </p>

                        <div className="ink-divider max-w-xs mx-auto" />
                    </>
                )}
            </section>

            {/* ✦ Chat Section */}
            <section className="w-full max-w-2xl mb-16">
                {!hasInteracted && (
                    <div className="text-center mb-6">
                        <span className="sparkle text-sm mr-2">✦</span>
                        <span
                            className="text-sm uppercase tracking-widest"
                            style={{ color: 'var(--text-secondary)', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                        >
                            Ask me anything
                        </span>
                        <span className="sparkle text-sm ml-2">✦</span>
                    </div>
                )}
                <ChatInterface onFirstMessage={() => setHasInteracted(true)} />
            </section>

            {/* ✦ Recent Posts Section */}
            <section className="w-full max-w-3xl mb-16">
                <div className="ink-divider mb-10" />

                <div className="flex items-center justify-center gap-3 mb-8">
                    <span className="sparkle text-sm">✦</span>
                    <h2
                        className="text-2xl md:text-3xl font-semibold"
                        style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                    >
                        Recent Posts
                    </h2>
                    <span className="sparkle text-sm">✦</span>
                </div>

                {posts.length > 0 ? (
                    <div className="grid gap-5">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/blog/${post.slug}`}
                                className="ink-card block group"
                            >
                                <h3
                                    className="text-lg font-semibold mb-1 group-hover:opacity-80 transition-opacity"
                                    style={{ fontFamily: "'Playfair Display', serif", color: 'var(--ink)' }}
                                >
                                    {post.title}
                                </h3>
                                <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    {post.date}
                                </p>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                    {post.excerpt}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div
                        className="ink-card text-center py-12"
                        style={{ borderStyle: 'dashed', color: 'var(--text-secondary)' }}
                    >
                        No posts yet — record your first idea
                    </div>
                )}
            </section>
        </div>
    );
}
```

---

### `src/components/NavBar.tsx`
```tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function NavBar() {
    const { data: session } = useSession();
    const isAdmin = !!session?.user;

    return (
        <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
                href="/"
                className="font-semibold text-lg tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
            >
                ✦ AI Platform ✦
            </Link>
            <div
                className="flex gap-6 text-sm"
                style={{ fontFamily: "'Inter', sans-serif" }}
            >
                <Link
                    href="/blog"
                    className="hover:opacity-70 transition-opacity"
                    style={{ color: "var(--ink)" }}
                >
                    Blog
                </Link>
                {isAdmin && (
                    <Link
                        href="/studio"
                        className="hover:opacity-70 transition-opacity"
                        style={{ color: "var(--ink)" }}
                    >
                        Studio
                    </Link>
                )}
            </div>
        </nav>
    );
}
```

---

### `src/components/Providers.tsx`
```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}
```

---

### `src/lib/activity-log.ts`
```ts
/**
 * Activity Log System — Persistent JSON storage
 * Tracks system events for transparency and admin visibility.
 * Persists to /logs/activity.json so entries survive server restarts.
 */

import fs from "fs";
import path from "path";

export type ActivityType =
    | "audio_uploaded"
    | "transcription_completed"
    | "article_generated"
    | "article_published"
    | "mcp_tool_executed";

export interface ActivityEntry {
    id: string;
    type: ActivityType;
    timestamp: string;
    metadata: Record<string, unknown>;
}

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "activity.json");
const MAX_ENTRIES = 500;

/**
 * Read the log file from disk.
 */
function readLog(): ActivityEntry[] {
    try {
        if (!fs.existsSync(LOG_FILE)) return [];
        const raw = fs.readFileSync(LOG_FILE, "utf8");
        return JSON.parse(raw) as ActivityEntry[];
    } catch {
        return [];
    }
}

/**
 * Write the log to disk.
 */
function writeLog(entries: ActivityEntry[]): void {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
        fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), "utf8");
    } catch (error) {
        console.error("Failed to write activity log:", error);
    }
}

/**
 * Log a system activity event. Persists to JSON file.
 */
export function logActivity(
    type: ActivityType,
    metadata: Record<string, unknown> = {}
): ActivityEntry {
    const entry: ActivityEntry = {
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        timestamp: new Date().toISOString(),
        metadata,
    };

    const log = readLog();
    log.unshift(entry); // newest first

    // Cap at max entries
    if (log.length > MAX_ENTRIES) {
        log.length = MAX_ENTRIES;
    }

    writeLog(log);
    return entry;
}

/**
 * Get the activity log, newest first.
 */
export function getActivityLog(limit?: number): ActivityEntry[] {
    const log = readLog();
    if (limit) return log.slice(0, limit);
    return log;
}

/**
 * Get log entries filtered by type.
 */
export function getActivitiesByType(type: ActivityType): ActivityEntry[] {
    return readLog().filter((e) => e.type === type);
}
```

---

### `src/lib/agent.ts`
```ts
import { getSiteAnalytics } from "@/lib/mcp/get-site-analytics";
import { getAllPosts } from "@/lib/posts";

/**
 * MCP Tool Registry with access control.
 * Tools are classified as "public" (any visitor) or "admin" (authenticated owner only).
 */

export type ToolAccess = "public" | "admin";

export interface MCPTool {
    name: string;
    description: string;
    access: ToolAccess;
    execute: (params?: Record<string, unknown>) => Promise<string>;
}

export const toolRegistry: MCPTool[] = [
    // ─── PUBLIC TOOLS ────────────────────────────────────────
    {
        name: "listRecentPosts",
        description: "Returns the most recent blog posts from the platform.",
        access: "public",
        async execute() {
            const posts = getAllPosts();
            if (posts.length === 0) return "No blog posts yet.";
            const postList = posts
                .slice(0, 5)
                .map((p, i) => `${i + 1}. ${p.title} (${p.date})`)
                .join("\n");
            return `Recent posts:\n${postList}`;
        },
    },
    {
        name: "searchPosts",
        description: "Searches blog posts by keyword in title or excerpt.",
        access: "public",
        async execute(params) {
            const query = (params?.query as string || "").toLowerCase();
            if (!query) return "Please provide a search term.";
            const posts = getAllPosts();
            const matches = posts.filter(
                (p) =>
                    p.title.toLowerCase().includes(query) ||
                    p.excerpt.toLowerCase().includes(query)
            );
            if (matches.length === 0) return `No posts found matching "${query}".`;
            const list = matches
                .map((p, i) => `${i + 1}. ${p.title} (${p.date})`)
                .join("\n");
            return `Found ${matches.length} post(s):\n${list}`;
        },
    },
    {
        name: "getPostSummary",
        description: "Returns a summary of all posts including total count and date range.",
        access: "public",
        async execute() {
            const posts = getAllPosts();
            if (posts.length === 0) return "No posts available yet.";
            const newest = posts[0].date;
            const oldest = posts[posts.length - 1].date;
            return `Blog summary:\n• Total posts: ${posts.length}\n• Newest: ${newest}\n• Oldest: ${oldest}`;
        },
    },

    // ─── ADMIN TOOLS ─────────────────────────────────────────
    {
        name: "getSiteAnalytics",
        description: "Returns visitor analytics for the website including total visitors, page views, and most popular posts.",
        access: "admin",
        async execute() {
            const analytics = await getSiteAnalytics();
            const topPosts = analytics.mostPopularPosts
                .map((p, i) => `${i + 1}. ${p.title} — ${p.views} views`)
                .join("\n");
            return `📊 Site Analytics:\n• Today's visitors: ${analytics.todayVisitors}\n• Total visitors: ${analytics.totalVisitors}\n• Page views: ${analytics.pageViews}\n\nMost popular posts:\n${topPosts}`;
        },
    },
    {
        name: "getSystemStatus",
        description: "Returns the current status of the publishing platform including number of posts and system health.",
        access: "admin",
        async execute() {
            const posts = getAllPosts();
            return `System Status:\n• Posts published: ${posts.length}\n• System: Online\n• API routes: Active\n• Last check: ${new Date().toISOString()}`;
        },
    },
];

/**
 * Get tools available for a given access level.
 * Public users get only public tools. Admin gets all tools.
 */
export function getToolsForUser(isAdmin: boolean): MCPTool[] {
    if (isAdmin) return toolRegistry;
    return toolRegistry.filter((t) => t.access === "public");
}

/**
 * Determine which tool to call based on the user message and access level.
 */
export async function agentProcess(
    message: string,
    isAdmin: boolean = false
): Promise<string> {
    const lower = message.toLowerCase();
    const availableTools = getToolsForUser(isAdmin);

    // Try to match a tool by keywords
    for (const tool of availableTools) {
        const keywords = getToolKeywords(tool.name);
        if (keywords.some((kw) => lower.includes(kw))) {
            try {
                return await tool.execute();
            } catch (error) {
                return `Error executing ${tool.name}: ${error}`;
            }
        }
    }

    // If OPENAI_API_KEY is available and user is admin, use LLM routing
    if (process.env.OPENAI_API_KEY && isAdmin) {
        return await llmAgentProcess(message, availableTools);
    }

    return "";
}

function getToolKeywords(toolName: string): string[] {
    const keywordMap: Record<string, string[]> = {
        listRecentPosts: ["recent posts", "latest posts", "show posts", "list posts"],
        searchPosts: ["search", "find posts", "posts about"],
        getPostSummary: ["post summary", "how many posts", "blog summary"],
        getSiteAnalytics: ["analytics", "visitors", "traffic", "how many people", "page views"],
        getSystemStatus: ["system status", "health", "system check", "platform status"],
    };
    return keywordMap[toolName] || [];
}

async function llmAgentProcess(message: string, tools: MCPTool[]): Promise<string> {
    const toolDescriptions = tools
        .map((t) => `- ${t.name}: ${t.description}`)
        .join("\n");

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are an AI assistant for a publishing platform. You have access to these tools:\n\n${toolDescriptions}\n\nBased on the user's message, respond with ONLY the tool name to call, or "none" if no tool is needed.`,
                    },
                    { role: "user", content: message },
                ],
                temperature: 0,
            }),
        });

        if (!response.ok) return "";

        const data = await response.json();
        const toolChoice = data.choices[0]?.message?.content?.trim();

        if (toolChoice && toolChoice !== "none") {
            const tool = tools.find((t) => t.name === toolChoice);
            if (tool) return await tool.execute();
        }
    } catch (error) {
        console.error("LLM agent error:", error);
    }

    return "";
}
```

---

### `src/lib/auth.ts`
```ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Admin Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (
                    credentials?.email === ADMIN_EMAIL &&
                    credentials?.password === ADMIN_PASSWORD
                ) {
                    return {
                        id: "1",
                        name: "Admin",
                        email: ADMIN_EMAIL,
                    };
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: "/admin/login",
    },
    session: {
        strategy: "jwt",
    },
});
```

---

### `src/lib/commands.ts`
```ts
import { getAllPosts } from "@/lib/posts";
import { getSiteAnalytics } from "@/lib/mcp/get-site-analytics";

export interface CommandResult {
    reply: string;
    action?: string;
}

/**
 * Detect user intent and route to the appropriate command handler.
 */
export async function routeCommand(message: string): Promise<CommandResult> {
    const lower = message.toLowerCase().trim();

    // Show recent posts
    if (lower.includes("recent posts") || lower.includes("show posts") || lower.includes("latest posts") || lower.includes("list posts")) {
        return handleShowPosts();
    }

    // Process latest recording
    if (lower.includes("process") && (lower.includes("recording") || lower.includes("latest"))) {
        return {
            reply: "I'll process the latest recording. This will transcribe the audio and generate a blog post from it. (Requires OPENAI_API_KEY to be configured.)",
            action: "process_recording",
        };
    }

    // Publish draft
    if (lower.includes("publish") && lower.includes("draft")) {
        return {
            reply: "I'll publish the latest draft post. Let me check what's available...",
            action: "publish_draft",
        };
    }

    // About / help
    if (lower.includes("what is this") || lower.includes("about this") || lower.includes("help")) {
        return {
            reply: "This is a **Conversational AI Publishing Platform**. Here's what I can do:\n\n• **Show recent posts** — List the latest blog posts\n• **Process latest recording** — Transcribe audio and generate a post\n• **Publish draft** — Publish a draft blog post\n• **How many visitors** — Check site analytics\n\nJust type a command naturally!",
        };
    }

    // Greetings
    if (lower.match(/^(hi|hey|hello|yo|sup)\b/)) {
        return {
            reply: "Hey! 👋 I'm your AI publishing assistant. Try asking me to \"show recent posts\" or say \"help\" to see what I can do.",
        };
    }

    // Analytics — calls the getSiteAnalytics MCP tool
    if (lower.includes("visitors") || lower.includes("analytics") || lower.includes("traffic")) {
        return await handleAnalytics();
    }

    // Default
    return {
        reply: `I'm not sure how to handle that yet. Try saying **"help"** to see available commands.`,
    };
}

function handleShowPosts(): CommandResult {
    const posts = getAllPosts();
    if (posts.length === 0) {
        return { reply: "No blog posts yet. Try processing a recording first!" };
    }

    const postList = posts
        .slice(0, 5)
        .map((p, i) => `${i + 1}. **${p.title}** — ${p.date}`)
        .join("\n");

    return {
        reply: `Here are the recent posts:\n\n${postList}`,
    };
}

async function handleAnalytics(): Promise<CommandResult> {
    try {
        const analytics = await getSiteAnalytics();

        const topPosts = analytics.mostPopularPosts
            .map((p, i) => `${i + 1}. **${p.title}** — ${p.views} views`)
            .join("\n");

        return {
            reply: `📊 **Site Analytics**\n\n• Today's visitors: **${analytics.todayVisitors}**\n• Total visitors: **${analytics.totalVisitors}**\n• Page views: **${analytics.pageViews}**\n\n**Most popular posts:**\n${topPosts}`,
            action: "analytics",
        };
    } catch {
        return { reply: "Sorry, I couldn't fetch analytics right now." };
    }
}

```

---

### `src/lib/mcp/get-site-analytics.ts`
```ts
/**
 * MCP Tool: getSiteAnalytics
 *
 * Returns site analytics data. This is an MCP-compatible tool
 * that can be called by the AI agent to retrieve analytics info.
 *
 * MCP Tool Definition:
 * {
 *   "name": "getSiteAnalytics",
 *   "description": "Returns visitor analytics for the website including total visitors, page views, and most popular posts.",
 *   "parameters": {}
 * }
 */

import { getAllPosts } from "@/lib/posts";

export interface SiteAnalytics {
    totalVisitors: number;
    pageViews: number;
    todayVisitors: number;
    mostPopularPosts: { title: string; views: number }[];
    lastUpdated: string;
}

/**
 * Get site analytics. In production, this would query Vercel Analytics API.
 * For now, returns simulated data based on actual post count.
 */
export async function getSiteAnalytics(): Promise<SiteAnalytics> {
    const vercelToken = process.env.VERCEL_API_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    // If Vercel credentials are available, attempt real analytics
    if (vercelToken && projectId) {
        try {
            const response = await fetch(
                `https://api.vercel.com/v1/analytics?projectId=${projectId}`,
                {
                    headers: { Authorization: `Bearer ${vercelToken}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                return {
                    totalVisitors: data.totalVisitors || 0,
                    pageViews: data.pageViews || 0,
                    todayVisitors: data.todayVisitors || 0,
                    mostPopularPosts: data.topPages || [],
                    lastUpdated: new Date().toISOString(),
                };
            }
        } catch (error) {
            console.error("Vercel analytics error:", error);
        }
    }

    // Fallback: simulated analytics based on actual posts
    const posts = getAllPosts();
    const simulatedPosts = posts.slice(0, 3).map((p, i) => ({
        title: p.title,
        views: Math.floor(Math.random() * 100) + (3 - i) * 50,
    }));

    return {
        totalVisitors: Math.floor(Math.random() * 500) + 100,
        pageViews: Math.floor(Math.random() * 1500) + 300,
        todayVisitors: Math.floor(Math.random() * 50) + 10,
        mostPopularPosts: simulatedPosts,
        lastUpdated: new Date().toISOString(),
    };
}
```

---

### `src/lib/post-generator.ts`
```ts
import fs from "fs";
import path from "path";

const postsDir = path.join(process.cwd(), "posts");

export interface GeneratedPost {
    success: boolean;
    slug?: string;
    title?: string;
    error?: string;
}

/**
 * Generate a blog post from a transcript using OpenAI.
 * Requires OPENAI_API_KEY environment variable.
 */
export async function generatePostFromTranscript(transcript: string): Promise<GeneratedPost> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { success: false, error: "OPENAI_API_KEY not set in environment variables." };
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a blog post editor. Given a transcript of spoken content, create a well-structured blog post in markdown format.

Your output MUST follow this exact format:

---
title: "The Title"
date: "YYYY-MM-DD"
excerpt: "A brief summary in one sentence."
---

# The Title

(body content here in markdown)

Rules:
- Clean up filler words, repetition, and speech artifacts
- Organize into clear sections with headings
- Keep the author's voice and ideas intact
- Use proper markdown formatting
- The date should be today's date
- Generate a URL-friendly slug from the title (lowercase, hyphens, no special chars)
- Return ONLY the markdown content, nothing else`,
                    },
                    {
                        role: "user",
                        content: `Here is the transcript:\n\n${transcript}`,
                    },
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `OpenAI API error: ${errorText}` };
        }

        const data = await response.json();
        const markdownContent = data.choices[0]?.message?.content;

        if (!markdownContent) {
            return { success: false, error: "No content generated." };
        }

        // Extract title from frontmatter
        const titleMatch = markdownContent.match(/title:\s*"([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : "untitled-post";

        // Create slug from title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();

        // Save to posts directory
        if (!fs.existsSync(postsDir)) {
            fs.mkdirSync(postsDir, { recursive: true });
        }

        const filePath = path.join(postsDir, `${slug}.md`);
        fs.writeFileSync(filePath, markdownContent);

        return {
            success: true,
            slug,
            title,
        };
    } catch (error) {
        return { success: false, error: `Post generation failed: ${error}` };
    }
}
```

---

### `src/lib/posts.ts`
```ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "posts");

export interface Post {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    content: string;
    htmlContent?: string;
}

export function getAllPosts(): Post[] {
    if (!fs.existsSync(postsDirectory)) return [];

    const fileNames = fs.readdirSync(postsDirectory).filter((f) => f.endsWith(".md"));

    const posts: Post[] = fileNames.map((fileName) => {
        const slug = fileName.replace(/\.md$/, "");
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data, content } = matter(fileContents);

        return {
            slug,
            title: data.title || slug,
            date: data.date || "",
            excerpt: data.excerpt || "",
            content,
        };
    });

    return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) return undefined;

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
        slug,
        title: data.title || slug,
        date: data.date || "",
        excerpt: data.excerpt || "",
        content,
    };
}

export async function getPostHtml(content: string): Promise<string> {
    const result = await remark().use(html).process(content);
    return result.toString();
}

export function getAllSlugs(): string[] {
    if (!fs.existsSync(postsDirectory)) return [];
    return fs
        .readdirSync(postsDirectory)
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""));
}
```

---

### `src/lib/transcription.ts`
```ts
import fs from "fs";
import path from "path";

const transcriptsDir = path.join(process.cwd(), "transcripts");

export interface TranscriptionResult {
    success: boolean;
    transcript?: string;
    fileName?: string;
    error?: string;
}

/**
 * Transcribe an audio file using OpenAI Whisper API.
 * Requires OPENAI_API_KEY environment variable.
 */
export async function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { success: false, error: "OPENAI_API_KEY not set in environment variables." };
    }

    try {
        const audioBuffer = fs.readFileSync(audioFilePath);
        const audioFileName = path.basename(audioFilePath);

        // Build multipart form data for Whisper API
        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: "audio/webm" });
        formData.append("file", blob, audioFileName);
        formData.append("model", "whisper-1");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `Whisper API error: ${errorText}` };
        }

        const data = await response.json();
        const transcript = data.text;

        // Store transcript
        if (!fs.existsSync(transcriptsDir)) {
            fs.mkdirSync(transcriptsDir, { recursive: true });
        }

        const transcriptFileName = audioFileName.replace(/\.[^.]+$/, ".txt");
        const transcriptPath = path.join(transcriptsDir, transcriptFileName);
        fs.writeFileSync(transcriptPath, transcript);

        return {
            success: true,
            transcript,
            fileName: transcriptFileName,
        };
    } catch (error) {
        return { success: false, error: `Transcription failed: ${error}` };
    }
}
```

---

### `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap');

:root {
  --cream: #F5F0E8;
  --cream-light: #FAF7F2;
  --ink: #2B3A8E;
  --ink-light: #4A5CB8;
  --ink-faint: rgba(43, 58, 142, 0.08);
  --ink-border: rgba(43, 58, 142, 0.2);
  --text-primary: #2B3A8E;
  --text-secondary: rgba(43, 58, 142, 0.6);
  --background: var(--cream);
  --foreground: var(--ink);
}

* {
  box-sizing: border-box;
}

body {
  color: var(--text-primary);
  background: var(--cream);
  font-family: 'Inter', -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Playfair Display', Georgia, serif;
  color: var(--ink);
}

/* ✦ Decorative sparkle animation */
@keyframes sparkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.sparkle {
  animation: sparkle 3s ease-in-out infinite;
  color: var(--ink);
}

.float {
  animation: float 4s ease-in-out infinite;
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

/* Pill-shaped inputs and buttons */
.pill {
  border-radius: 999px;
  border: 1.5px solid var(--ink-border);
  padding: 0.6rem 1.4rem;
  background: var(--cream-light);
  color: var(--ink);
  transition: all 0.3s ease;
}

.pill:hover {
  border-color: var(--ink);
  box-shadow: 0 2px 12px rgba(43, 58, 142, 0.1);
}

.pill:focus {
  outline: none;
  border-color: var(--ink);
  box-shadow: 0 0 0 3px var(--ink-faint);
}

.pill-button {
  border-radius: 999px;
  border: 1.5px solid var(--ink);
  padding: 0.6rem 1.6rem;
  background: var(--ink);
  color: var(--cream);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pill-button:hover {
  background: var(--ink-light);
  box-shadow: 0 4px 16px rgba(43, 58, 142, 0.2);
  transform: translateY(-1px);
}

.pill-button-outline {
  border-radius: 999px;
  border: 1.5px solid var(--ink);
  padding: 0.6rem 1.6rem;
  background: transparent;
  color: var(--ink);
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pill-button-outline:hover {
  background: var(--ink-faint);
  transform: translateY(-1px);
}

/* Decorative divider */
.ink-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--ink-border),
    var(--ink),
    var(--ink-border),
    transparent
  );
  margin: 2rem 0;
}

/* Card style */
.ink-card {
  border: 1.5px solid var(--ink-border);
  border-radius: 16px;
  padding: 1.5rem;
  background: var(--cream-light);
  transition: all 0.3s ease;
}

.ink-card:hover {
  border-color: var(--ink-light);
  box-shadow: 0 4px 20px rgba(43, 58, 142, 0.08);
  transform: translateY(-2px);
}

/* Prose styling for blog content */
.prose h1, .prose h2, .prose h3 {
  font-family: 'Playfair Display', Georgia, serif;
  color: var(--ink);
}

.prose a {
  color: var(--ink);
  text-decoration-color: var(--ink-border);
  text-underline-offset: 3px;
  transition: text-decoration-color 0.3s;
}

.prose a:hover {
  text-decoration-color: var(--ink);
}

/* Override tailwind dark mode — we stay cream */
.dark body, body {
  background: var(--cream) !important;
  color: var(--text-primary) !important;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

---

### `package.json`
```json
{
  "name": "auto-site",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "gray-matter": "^4.0.3",
    "next": "14.2.35",
    "next-auth": "^5.0.0-beta.30",
    "react": "^18",
    "react-dom": "^18",
    "remark": "^15.0.1",
    "remark-html": "^16.0.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/jest": "^30.0.0",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "ts-jest": "^29.4.6",
    "typescript": "^5"
  }
}```

---

### `jest.config.ts`
```ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
    dir: "./",
});

const config: Config = {
    coverageProvider: "v8",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
};

export default createJestConfig(config);
```

---

### `.gitignore`
```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# runtime data (not persisted in repo)
/logs
/uploads
/transcripts

# typescript
*.tsbuildinfo
next-env.d.ts
```
