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
    | "mcp_tool_executed"
    | "command_routed"
    | "llm_fallback_used"
    | "tool_response_summarized";

export interface ActivityEntry {
    id: string;
    type: ActivityType;
    timestamp: string;
    metadata: Record<string, unknown>;
}

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "activity.json");
const MAX_ENTRIES = 500;

const REDACTED_METADATA_KEYS = [
    "message",
    "content",
    "query",
    "prompt",
    "input",
    "text",
];

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const output: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
        const lowerKey = key.toLowerCase();
        if (REDACTED_METADATA_KEYS.some((k) => lowerKey.includes(k))) {
            output[key] = "[redacted]";
            continue;
        }

        if (typeof value === "string") {
            output[key] = value.slice(0, 120);
        } else if (
            typeof value === "number" ||
            typeof value === "boolean" ||
            value === null
        ) {
            output[key] = value;
        } else if (Array.isArray(value)) {
            output[key] = `[array:${value.length}]`;
        } else if (typeof value === "object") {
            output[key] = "[object]";
        }
    }

    return output;
}

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
        metadata: sanitizeMetadata(metadata),
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
