"use client";

import { useEffect } from "react";
import { loadSavedTheme } from "@/lib/theme";

export default function ThemeRestorer() {
    useEffect(() => {
        loadSavedTheme();
    }, []);
    return null;
}
