import { NextRequest, NextResponse } from "next/server";
import { routeCommand } from "@/lib/commands";
import { agentProcess } from "@/lib/agent";

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        if (!message) {
            return NextResponse.json({ reply: "Please send a message." }, { status: 400 });
        }

        // First, try the AI agent to see if a tool should be called
        const agentResult = await agentProcess(message);
        if (agentResult) {
            return NextResponse.json({
                reply: agentResult,
                action: "agent_tool_call",
            });
        }

        // Fall back to the command router
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
