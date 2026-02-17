import { useEffect } from "react";
import type { Theme } from "../lib/types";

/**
 * Applies the correct `dark` class on `<html>` based on the user's theme
 * preference. When set to "system", listens to the OS-level
 * `prefers-color-scheme` media query and reacts to changes in real time.
 */
export function useTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement;

    const apply = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (theme === "dark") {
      apply(true);
      return;
    }

    if (theme === "light") {
      apply(false);
      return;
    }

    // "system" — follow the OS preference and listen for changes.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    apply(mq.matches);

    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);
}
