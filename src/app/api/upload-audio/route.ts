/**
 * ⚠️ DEVELOPMENT / DEMO ROUTE ONLY
 *
 * This endpoint is NOT part of the production pipeline.
 * The canonical audio publishing pipeline is:
 *   Recording App → External Server → Whisper → AI Formatting → Git Commit → Vercel Redeploy
 *
 * Next.js should NOT handle persistent file storage in production (serverless).
 * This route exists for local development and demonstration purposes only.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Audio upload is handled by the external recording pipeline in production." },
            { status: 403 }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("audio") as File;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
        }

        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(uploadsDir, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({ success: true, fileName });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}
