import { NextResponse } from "next/server";
import { getActivityLog } from "@/lib/activity-log";
import { auth } from "@/lib/auth";

export async function GET() {
    // Activity log contains system events and admin actions; restrict to admin only.
    const session = await auth();
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const log = getActivityLog(50);
        return NextResponse.json({ activities: log });
    } catch (error) {
        console.error("Activity log error:", error);
        return NextResponse.json({ error: "Failed to get activity log." }, { status: 500 });
    }
}
