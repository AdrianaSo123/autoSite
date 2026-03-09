import { NextRequest, NextResponse } from "next/server";
import { routeCommand } from "@/lib/commands";
import { routeToTool } from "@/lib/mcp/tool-router";
import { auth } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ reply: "Please send a message." }, { status: 400 });
        }

        const session = await auth();
        const isAdmin = !!session?.user;

        // 1. Try MCP tool routing (keyword + LLM)
        let toolResult = "";
        try {
            toolResult = await routeToTool(message, isAdmin);
        } catch (error) {
            console.error("Tool routing error:", error);
        }

        if (toolResult) {
            logActivity("mcp_tool_executed", { message, isAdmin });
            return NextResponse.json({
                reply: toolResult,
                action: "agent_tool_call",
            });
        }

        // 2. Fall back to command router (greetings, help, admin, actions)
        const result = await routeCommand(message);

        return NextResponse.json({
            reply: result.reply,
            action: result.action || null,
        });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            { reply: "Something went wrong. Please try again or say \"help\" for available commands." },
            { status: 500 }
        );
    }
}
