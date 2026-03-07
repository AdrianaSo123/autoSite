/**
 * Activity Log System
 * Tracks system events for transparency and admin visibility.
 */

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

// In-memory activity log (in production, would be stored in a database)
const activityLog: ActivityEntry[] = [];

/**
 * Log a system activity event.
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

    activityLog.unshift(entry); // newest first

    // Keep log to a reasonable size
    if (activityLog.length > 500) {
        activityLog.length = 500;
    }

    return entry;
}

/**
 * Get the activity log, newest first.
 */
export function getActivityLog(limit?: number): ActivityEntry[] {
    if (limit) {
        return activityLog.slice(0, limit);
    }
    return activityLog;
}

/**
 * Get log entries filtered by type.
 */
export function getActivitiesByType(type: ActivityType): ActivityEntry[] {
    return activityLog.filter((e) => e.type === type);
}
