/**
 * Command Router
 *
 * Handles non-tool commands: greetings, help, admin access, and action commands.
 * Tool-based queries (post listing, search, summaries) are handled by the
 * MCP tool router — this module only handles conversational and action intents.
 */

import { sessionState } from "@/lib/mcp/session";
import { parseThemeFromCommand, THEMES } from "@/lib/theme";

export interface CommandResult {
    reply: string;
    action?: string;
}

const PROCESS_COMMAND_PREFIXES = [
    "process latest recording",
    "process recording",
    "process the latest recording",
];

const PUBLISH_COMMAND_PREFIXES = [
    "publish draft",
    "publish the draft",
    "publish latest draft",
];

const HELP_COMMAND_PREFIXES = [
    "help",
    "what is this",
    "about this",
    "what can you do",
];

const GREETING_PREFIXES = ["hi", "hey", "hello", "yo", "sup"];

function startsWithAny(input: string, prefixes: string[]): boolean {
    return prefixes.some((prefix) => input.startsWith(prefix));
}

export async function routeCommand(message: string): Promise<CommandResult | null> {
    const lower = message.toLowerCase().trim();

    // Hidden admin access
    if (lower === "/admin" || lower === "/studio") {
        return {
            reply: "Opening admin studio...",
            action: "open_admin_studio",
        };
    }

    // Theme switching (admin only — action handled client-side)
    if (/(?:set|change|use|apply|make)\s+(?:the\s+)?(?:style|theme|it)|^(?:studio|midnight|forest|rose|minimal|sand|bauhaus|noir|deco|swiss|memphis|nordic|japanese)$/.test(lower)) {
        const theme = parseThemeFromCommand(lower);
        if (theme) {
            const info = THEMES[theme];
            return {
                reply: `Switching to **${info.label}** — ${info.description}.`,
                action: `set_theme:${theme}`,
            };
        }
        // They asked about themes but didn't name one
        const themeList = Object.entries(THEMES)
            .map(([key, val]) => `• **${val.label}** — ${val.description}`)
            .join("\n");
        return {
            reply: `Here are the available styles:\n\n${themeList}\n\nSay **"set style to midnight"** (or any name above) to apply it.`,
        };
    }

    // Process latest recording
    if (startsWithAny(lower, PROCESS_COMMAND_PREFIXES)) {
        return {
            reply: "I'll process the latest recording. This will transcribe the audio and generate a blog post from it. (Requires OPENAI_API_KEY to be configured.)",
            action: "process_recording",
        };
    }

    // Publish draft
    if (startsWithAny(lower, PUBLISH_COMMAND_PREFIXES)) {
        return {
            reply: "I'll publish the latest draft post. Let me check what's available...",
            action: "publish_draft",
        };
    }

    // Open post by reference (number or natural phrase)
    const openMatch = lower.match(/^open\s+(?:post\s*)?(?:#\s*)?(\d+)[\s.!?]*$/);
    if (openMatch) {
        const index = parseInt(openMatch[1], 10);
        const post = sessionState.lastPostResults[index - 1];

        if (post) {
            return {
                reply: `Opening: ${post.title}`,
                action: `open_post:/blog/${post.slug}`,
            };
        } else {
            return {
                reply: `I couldn't find that post number. Try "show recent posts".`,
            };
        }
    }

    // Open post by title (e.g. Open "Some Post Title")
    const openTitleMatch = lower.match(/^open\s+"(.+)"[\s.!?]*$/);
    if (openTitleMatch) {
        const titleQuery = openTitleMatch[1].toLowerCase();
        const post = sessionState.lastPostResults.find(
            (p) => p.title.toLowerCase() === titleQuery
        );
        if (post) {
            return {
                reply: `Opening: ${post.title}`,
                action: `open_post:/blog/${post.slug}`,
            };
        } else {
            return {
                reply: `I couldn't find a post matching that title. Try "show recent posts" to see what's available.`,
            };
        }
    }

    // Natural references to latest item in current results context
    if (/^open\s+(?:the\s+)?(?:latest|newest|first|that|this)\s+post[\s.!?]*$/.test(lower)) {
        const post = sessionState.lastPostResults[0];
        if (post) {
            return {
                reply: `Opening: ${post.title}`,
                action: `open_post:/blog/${post.slug}`,
            };
        }

        return {
            reply: `I don't have a recent post list yet. Try "show recent blog posts" first.`,
        };
    }

    // Related AI topics — conversational overview, not a blog search
    if (/related\s+ai\s+topics?|show\s+related\s+topics?/.test(lower)) {
        return {
            reply:
                "Here are some core AI topics worth exploring:\n\n" +
                "• **Agentic AI** — systems that plan and take multi-step actions autonomously\n" +
                "• **Large Language Models (LLMs)** — foundation models like GPT that power conversational AI\n" +
                "• **Retrieval-Augmented Generation (RAG)** — grounding AI responses with real documents\n" +
                "• **Model Evaluation** — benchmarking reasoning, accuracy, and safety\n" +
                "• **AI Agents & Tool Use** — AI that calls APIs and uses external tools\n\n" +
                "Want me to search for blog posts on any of these?",
        };
    }

    // Help
    if (startsWithAny(lower, HELP_COMMAND_PREFIXES)) {
        return {
            reply: "This is a **Conversational AI Publishing Platform**. Here's what I can do:\n\n• **Show recent posts** — List the latest blog posts\n• **Search posts** — Search blog posts by keyword\n• **Blog summary** — Overview of all published posts\n\nJust type a command naturally!",
        };
    }

    // Greetings
    if (startsWithAny(lower, GREETING_PREFIXES)) {
        return {
            reply: "Hey! 👋 I'm your AI publishing assistant. Try asking me to \"show recent posts\" or say \"help\" to see what I can do.",
        };
    }

    // Let conversational requests flow to the LLM.
    return null;
}
