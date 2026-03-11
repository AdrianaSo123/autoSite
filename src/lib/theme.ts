export type ThemeName = "studio" | "midnight" | "forest" | "rose" | "minimal" | "sand" | "bauhaus" | "noir" | "deco" | "swiss" | "memphis" | "nordic" | "japanese";

export const THEMES: Record<ThemeName, { label: string; description: string }> = {
    studio:   { label: "Studio",   description: "Cream & blue — the default" },
    midnight: { label: "Midnight", description: "Dark navy, soft lavender ink" },
    forest:   { label: "Forest",   description: "Soft sage green, deep moss ink" },
    rose:     { label: "Rose",     description: "Blush background, deep rose ink" },
    minimal:  { label: "Minimal",  description: "Pure white, near-black ink" },
    sand:     { label: "Sand",     description: "Warm sand, golden brown ink" },
    bauhaus:  { label: "Bauhaus",  description: "White + bold primary red — geometric, stark" },
    noir:     { label: "Noir",     description: "Deep black, warm cream text — cinematic" },
    deco:     { label: "Deco",     description: "Champagne gold on near-black — art deco" },
    swiss:    { label: "Swiss",    description: "Pure white, precise Swiss red — International Style" },
    memphis:  { label: "Memphis",  description: "Warm yellow, vivid teal ink — bold 80s geometry" },
    nordic:   { label: "Nordic",   description: "Cool blue-grey, dark slate — Scandinavian minimal" },
    japanese: { label: "Japanese", description: "Washi white, deep indigo — quiet Japanese aesthetic" },
};

const THEME_STORAGE_KEY = "so_studio_theme";

export function applyTheme(theme: ThemeName): void {
    if (typeof document === "undefined") return;
    if (theme === "studio") {
        document.documentElement.removeAttribute("data-theme");
    } else {
        document.documentElement.setAttribute("data-theme", theme);
    }
    // Sync background-color on body too so the browser chrome matches
    document.body.style.background = "var(--background)";
    localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function loadSavedTheme(): void {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null;
    if (saved && saved in THEMES) {
        applyTheme(saved);
    }
}

export function parseThemeFromCommand(message: string): ThemeName | null {
    const lower = message.toLowerCase().trim();
    // e.g. "set style to midnight", "change theme to forest", "use rose", "make it minimal"
    const match = lower.match(
        /(?:set\s+(?:style|theme)|change\s+(?:style|theme)|use\s+theme|use|make\s+(?:it|style|the\s+style)|apply\s+(?:the\s+)?(?:style|theme)?)\s+(?:to\s+)?(\w+)/
    );
    if (match) {
        const candidate = match[1] as ThemeName;
        if (candidate in THEMES) return candidate;
    }
    // Also match just the theme name directly if it's alone
    if (lower in THEMES) return lower as ThemeName;
    return null;
}
