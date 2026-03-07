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

    // Hidden admin access
    if (lower === "/admin" || lower === "/studio") {
        return {
            reply: "Opening admin studio...",
            action: "open_admin_studio"
        };
    }

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

