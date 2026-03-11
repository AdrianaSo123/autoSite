export type ThemeName = "studio" | "bauhaus" | "swiss" | "japanese" | "noir";

export const THEMES: Record<ThemeName, { label: string; description: string }> = {
    studio:   { label: "Studio",   description: "Cream & blue — the default, Playfair headings" },
    bauhaus:  { label: "Bauhaus",  description: "Geometric, primary red, sharp corners — Bauhaus movement" },
    swiss:    { label: "Swiss",    description: "Helvetica, tight grid, Swiss red — International Style" },
    japanese: { label: "Japanese", description: "Noto Serif, generous spacing, quiet indigo" },
    noir:     { label: "Noir",     description: "Deep black, warm cream, cinematic — dark mode" },
};

const THEME_STORAGE_KEY = "so_studio_theme";

export function applyTheme(theme: ThemeName): void {
    if (typeof document === "undefined") return;
    if (theme === "studio") {
        document.documentElement.removeAttribute("data-theme");
    } else {
        document.documentElement.setAttribute("data-theme", theme);
    }
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
