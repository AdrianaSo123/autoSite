import { NextRequest, NextResponse } from "next/server";
import { routeCommand } from "@/lib/commands";
import { agentProcess } from "@/lib/agent";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ reply: "Please send a message." }, { status: 400 });
        }

        // Determine if user is admin
        const session = await auth();
        const isAdmin = !!session?.user;

        // Try the AI agent first (respects tool permissions)
        const agentResult = await agentProcess(message, isAdmin);
        if (agentResult) {
            logActivity("mcp_tool_executed", { message, isAdmin });
            return NextResponse.json({
                reply: agentResult,
                action: "agent_tool_call",
            });
        }

        // Fall back to command router
        const result = await routeCommand(message);

        return NextResponse.json({
            reply: result.reply,
            action: result.action || null,
        });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json({ reply: "Something went wrong." }, { status: 500 });
    }
}
