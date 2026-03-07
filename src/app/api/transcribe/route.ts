/**
 * ⚠️ DEVELOPMENT / DEMO ROUTE ONLY
 *
 * This endpoint is NOT part of the production pipeline.
 * The canonical pipeline uses an external transcription server.
 * This route exists for local development and demonstration only.
 */

import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/transcription";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Transcription is handled by the external pipeline in production." },
            { status: 403 }
        );
    }

    try {
        const { fileName, transcript } = await request.json();

        if (transcript) {
            return NextResponse.json({ transcript });
        }

        if (!fileName) {
            return NextResponse.json({ error: "fileName is required." }, { status: 400 });
        }

        const result = await transcribeAudio(fileName);
        return NextResponse.json({ transcript: result });
    } catch (error) {
        console.error("Transcription error:", error);
        return NextResponse.json({ error: "Transcription failed." }, { status: 500 });
    }
}
