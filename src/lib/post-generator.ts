import fs from "fs";
import path from "path";

const postsDir = path.join(process.cwd(), "posts");

export interface GeneratedPost {
    success: boolean;
    slug?: string;
    title?: string;
    error?: string;
}

/**
 * Generate a blog post from a transcript using OpenAI.
 * Requires OPENAI_API_KEY environment variable.
 */
export async function generatePostFromTranscript(transcript: string): Promise<GeneratedPost> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { success: false, error: "OPENAI_API_KEY not set in environment variables." };
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `You are a blog post editor. Given a transcript of spoken content, create a well-structured blog post in markdown format.

Your output MUST follow this exact format:

---
title: "The Title"
date: "YYYY-MM-DD"
excerpt: "A brief summary in one sentence."
---

# The Title

(body content here in markdown)

Rules:
- Clean up filler words, repetition, and speech artifacts
- Organize into clear sections with headings
- Keep the author's voice and ideas intact
- Use proper markdown formatting
- The date should be today's date
- Generate a URL-friendly slug from the title (lowercase, hyphens, no special chars)
- Return ONLY the markdown content, nothing else`,
                    },
                    {
                        role: "user",
                        content: `Here is the transcript:\n\n${transcript}`,
                    },
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { success: false, error: `OpenAI API error: ${errorText}` };
        }

        const data = await response.json();
        const markdownContent = data.choices[0]?.message?.content;

        if (!markdownContent) {
            return { success: false, error: "No content generated." };
        }

        // Ensure the frontmatter title is always quoted to prevent YAML parse errors
        // (e.g. titles containing colons break unquoted YAML values)
        const sanitizedContent = markdownContent.replace(
            /^(title:\s*)(?!")(.*?)(\s*)$/m,
            (_match: string, key: string, value: string, trailing: string) => `${key}"${value.replace(/"/g, '\\"')}"${trailing}`
        );

        // Extract title from frontmatter
        const titleMatch = sanitizedContent.match(/title:\s*"([^"]+)"/);
        const title = titleMatch ? titleMatch[1] : "untitled-post";

        // Create slug from title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();

        // Save to posts directory
        if (!fs.existsSync(postsDir)) {
            fs.mkdirSync(postsDir, { recursive: true });
        }

        const filePath = path.join(postsDir, `${slug}.md`);
        fs.writeFileSync(filePath, sanitizedContent);

        return {
            success: true,
            slug,
            title,
        };
    } catch (error) {
        return { success: false, error: `Post generation failed: ${error}` };
    }
}
