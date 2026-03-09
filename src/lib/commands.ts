/**
 * Command Router
 *
 * Handles non-tool commands: greetings, help, admin access, and action commands.
 * Tool-based queries (post listing, search, summaries) are handled by the
 * MCP tool router — this module only handles conversational and action intents.
 */

export interface CommandResult {
    reply: string;
    action?: string;
}

export async function routeCommand(message: string): Promise<CommandResult> {
    const lower = message.toLowerCase().trim();

    // Hidden admin access
    if (lower === "/admin" || lower === "/studio") {
        return {
            reply: "Opening admin studio...",
            action: "open_admin_studio",
        };
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

    // Open post by number
    const openMatch = lower.match(/^open\s+(\d+)$/);
    if (openMatch) {
        const index = parseInt(openMatch[1], 10);
        return {
            reply: `Opening post #${index}...`,
            action: `open_post:${index}`,
        };
    }

    // Help
    if (lower.includes("what is this") || lower.includes("about this") || lower.includes("help")) {
        return {
            reply: "This is a **Conversational AI Publishing Platform**. Here's what I can do:\n\n• **Show recent posts** — List the latest blog posts\n• **Process latest recording** — Transcribe audio and generate a post\n• **Publish draft** — Publish a draft blog post\n• **Search posts** — Search blog posts by keyword\n\nJust type a command naturally!",
        };
    }

    // Greetings
    if (lower.match(/^(hi|hey|hello|yo|sup)\b/)) {
        return {
            reply: "Hey! 👋 I'm your AI publishing assistant. Try asking me to \"show recent posts\" or say \"help\" to see what I can do.",
        };
    }

    // Default
    return {
        reply: `I'm not sure how to handle that yet. Try saying **"help"** to see available commands.`,
    };
}
