import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const uploadsDir = path.join(process.cwd(), "uploads");

export async function POST(request: NextRequest) {
    try {
        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const formData = await request.formData();
        const file = formData.get("audio") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No audio file provided. Use the 'audio' field." },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name || "recording.webm";
        const fileName = `${timestamp}-${originalName}`;
        const filePath = path.join(uploadsDir, fileName);

        // Write file to disk
        const bytes = await file.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(bytes));

        return NextResponse.json({
            success: true,
            message: "Audio file uploaded successfully.",
            fileName,
            size: file.size,
            type: file.type,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload audio file." },
            { status: 500 }
        );
    }
}
