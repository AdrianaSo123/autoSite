/**
 * Command Router
 *
 * Handles non-tool commands: greetings, help, admin access, and action commands.
 * Tool-based queries (post listing, search, summaries) are handled by the
 * MCP tool router — this module only handles conversational and action intents.
 */

import { sessionState } from "@/lib/mcp/session";

export interface CommandResult {
    reply: string;
    action?: string;
    handled: boolean;
}

export async function routeCommand(message: string): Promise<CommandResult> {
    const lower = message.toLowerCase().trim();

    // Hidden admin access
    if (lower === "/admin" || lower === "/studio") {
        return {
            reply: "Opening admin studio...",
            action: "open_admin_studio",
            handled: true,
        };
    }

    // Process latest recording
    if (lower.includes("process") && (lower.includes("recording") || lower.includes("latest"))) {
        return {
            reply: "I'll process the latest recording. This will transcribe the audio and generate a blog post from it. (Requires OPENAI_API_KEY to be configured.)",
            action: "process_recording",
            handled: true,
        };
    }

    // Publish draft
    if (lower.includes("publish") && lower.includes("draft")) {
        return {
            reply: "I'll publish the latest draft post. Let me check what's available...",
            action: "publish_draft",
            handled: true,
        };
    }

    // Open post by number
    const openMatch = lower.match(/^open\s+(?:post\s+)?(\d+)$/);
    if (openMatch) {
        const index = parseInt(openMatch[1], 10);
        const post = sessionState.lastPostResults[index - 1];

        if (post) {
            return {
                reply: `Opening: ${post.title}\n/blog/${post.slug}`,
                action: `open_post:/blog/${post.slug}`,
                handled: true,
            };
        } else {
            return {
                reply: `I couldn't find that post number. Try "show recent posts".`,
                handled: true,
            };
        }
    }

    // Help
    if (lower.includes("what is this") || lower.includes("about this") || lower.includes("help")) {
        return {
            reply: "This is a **Conversational AI Publishing Platform**. Here's what I can do:\n\n• **Show recent posts** — List the latest blog posts\n• **Process latest recording** — Transcribe audio and generate a post\n• **Publish draft** — Publish a draft blog post\n• **Search posts** — Search blog posts by keyword\n\nJust type a command naturally!",
            handled: true,
        };
    }

    // Greetings
    if (lower.match(/^(hi|hey|hello|yo|sup)\b/)) {
        return {
            reply: "Hey! 👋 I'm your AI publishing assistant. Try asking me to \"show recent posts\" or say \"help\" to see what I can do.",
            handled: true,
        };
    }

    // Default
    return {
        reply: `I'm not quite sure how to handle a command like that yet. But I'm great at these things:\n\n• **Show recent posts**\n• **Search posts**\n• **Publish draft**\n\nSay **help** to see available commands, or tell me what you'd like to explore.`,
        handled: false,
    };
}
