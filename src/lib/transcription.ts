import fs from "fs";
import path from "path";

const transcriptsDir = path.join(process.cwd(), "transcripts");

export interface TranscriptionResult {
    success: boolean;
    transcript?: string;
    fileName?: string;
    error?: string;
}

/**
 * Transcribe an audio file using OpenAI Whisper API.
 * Requires OPENAI_API_KEY environment variable.
 */
export async function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { success: false, error: "OPENAI_API_KEY not set in environment variables." };
    }

    try {
        const audioBuffer = fs.readFileSync(audioFilePath);
        const audioFileName = path.basename(audioFilePath);

        // Build multipart form data for Whisper API
        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: "audio/webm" });
        formData.append("file", blob, audioFileName);
        formData.append("model", "whisper-1");

        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `Whisper API error: ${errorText}` };
        }

        const data = await response.json();
        const transcript = data.text;

        // Store transcript
        if (!fs.existsSync(transcriptsDir)) {
            fs.mkdirSync(transcriptsDir, { recursive: true });
        }

        const transcriptFileName = audioFileName.replace(/\.[^.]+$/, ".txt");
        const transcriptPath = path.join(transcriptsDir, transcriptFileName);
        fs.writeFileSync(transcriptPath, transcript);

        return {
            success: true,
            transcript,
            fileName: transcriptFileName,
        };
    } catch (error) {
        return { success: false, error: `Transcription failed: ${error}` };
    }
}
