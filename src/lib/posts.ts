import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "posts");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Post {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    content: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a markdown file's frontmatter into a Post object. */
function parsePostFile(slug: string, raw: string): Post {
    const { data, content } = matter(raw);
    return {
        slug,
        title: data.title || slug,
        date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : (data.date || ""),
        excerpt: data.excerpt || "",
        content,
    };
}

/** Read a single .md file and parse it, or return undefined if missing. */
function readPostFile(slug: string): Post | undefined {
    const filePath = path.join(postsDirectory, `${slug}.md`);
    if (!fs.existsSync(filePath)) return undefined;
    return parsePostFile(slug, fs.readFileSync(filePath, "utf8"));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAllPosts(): Post[] {
    if (!fs.existsSync(postsDirectory)) return [];

    return fs
        .readdirSync(postsDirectory)
        .filter((f) => f.endsWith(".md"))
        .map((f) => readPostFile(f.replace(/\.md$/, ""))!)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | undefined {
    return readPostFile(slug);
}

export async function getPostHtml(content: string): Promise<string> {
    const result = await remark().use(html).process(content);
    return result.toString();
}

export function getAllSlugs(): string[] {
    if (!fs.existsSync(postsDirectory)) return [];
    return fs
        .readdirSync(postsDirectory)
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""));
}
