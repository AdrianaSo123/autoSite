import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { generatePostFromTranscript } from "@/lib/post-generator";

const transcriptsDir = path.join(process.cwd(), "transcripts");

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { transcriptFile, transcript } = body;

        let transcriptText = transcript;

        // If a transcriptFile is provided, read from disk
        if (transcriptFile && !transcriptText) {
            const transcriptPath = path.join(transcriptsDir, transcriptFile);
            if (!fs.existsSync(transcriptPath)) {
                return NextResponse.json(
                    { error: `Transcript file not found: ${transcriptFile}` },
                    { status: 404 }
                );
            }
            transcriptText = fs.readFileSync(transcriptPath, "utf8");
        }

        if (!transcriptText) {
            return NextResponse.json(
                { error: "Either 'transcript' or 'transcriptFile' is required." },
                { status: 400 }
            );
        }

        const result = await generatePostFromTranscript(transcriptText);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            slug: result.slug,
            title: result.title,
            url: `/blog/${result.slug}`,
        });
    } catch (error) {
        console.error("Generate post error:", error);
        return NextResponse.json(
            { error: "Failed to generate post." },
            { status: 500 }
        );
    }
}
