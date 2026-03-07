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
