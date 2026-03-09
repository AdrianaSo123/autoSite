"use client";

import { useState, useEffect } from "react";

interface ActivityEntry {
    id: string;
    type: string;
    timestamp: string;
    metadata: Record<string, unknown>;
}

interface Metrics {
    totalEvents: number;
    toolsExecuted: number;
    postsGenerated: number;
    recordingsProcessed: number;
    articlesPublished: number;
}

const TYPE_LABELS: Record<string, { icon: string; label: string }> = {
    audio_uploaded: { icon: "🎙️", label: "Recording uploaded" },
    transcription_completed: { icon: "📝", label: "Transcription completed" },
    article_generated: { icon: "✨", label: "Blog post generated" },
    article_published: { icon: "📰", label: "Article published" },
    mcp_tool_executed: { icon: "⚙️", label: "Tool executed" },
};

function computeMetrics(activities: ActivityEntry[]): Metrics {
    return {
        totalEvents: activities.length,
        toolsExecuted: activities.filter((a) => a.type === "mcp_tool_executed").length,
        postsGenerated: activities.filter((a) => a.type === "article_generated").length,
        recordingsProcessed: activities.filter((a) => a.type === "audio_uploaded").length,
        articlesPublished: activities.filter((a) => a.type === "article_published").length,
    };
}

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

    const metrics = computeMetrics(activities);

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
                    ✦ Platform Activity
                </h3>
                <button
                    onClick={fetchActivities}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: "var(--text-secondary)" }}
                >
                    Refresh
                </button>
            </div>

            {/* Metrics summary */}
            {!loading && activities.length > 0 && (
                <div
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-4"
                    style={{ borderBottom: "1px solid var(--ink-border)" }}
                >
                    <MetricCard label="Tools Executed" value={metrics.toolsExecuted} icon="⚙️" />
                    <MetricCard label="Posts Generated" value={metrics.postsGenerated} icon="✨" />
                    <MetricCard label="Recordings" value={metrics.recordingsProcessed} icon="🎙️" />
                    <MetricCard label="Published" value={metrics.articlesPublished} icon="📰" />
                </div>
            )}

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

function MetricCard({ label, value, icon }: { label: string; value: number; icon: string }) {
    return (
        <div className="text-center py-2">
            <span className="text-xl">{icon}</span>
            <p
                className="text-2xl font-semibold mt-1"
                style={{ fontFamily: "'Playfair Display', serif", color: "var(--ink)" }}
            >
                {value}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {label}
            </p>
        </div>
    );
}
