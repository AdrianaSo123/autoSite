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
