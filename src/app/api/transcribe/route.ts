import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { transcribeAudio } from "@/lib/transcription";

const uploadsDir = path.join(process.cwd(), "uploads");

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileName } = body;

        if (!fileName) {
            return NextResponse.json(
                { error: "fileName is required." },
                { status: 400 }
            );
        }

        const audioPath = path.join(uploadsDir, fileName);

        if (!fs.existsSync(audioPath)) {
            return NextResponse.json(
                { error: `Audio file not found: ${fileName}` },
                { status: 404 }
            );
        }

        const result = await transcribeAudio(audioPath);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            transcript: result.transcript,
            transcriptFile: result.fileName,
        });
    } catch (error) {
        console.error("Transcription route error:", error);
        return NextResponse.json(
            { error: "Failed to transcribe audio." },
            { status: 500 }
        );
    }
}
