"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
type Theme = "light" | "dark";
const ThemeContext = createContext({
  theme: "light" as Theme,
  ready: false,
  toggle: () => {},
});
const key = "shopassist-theme";
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(key);
      } catch {}
      const next: Theme =
        saved === "dark" || saved === "light"
          ? saved
          : media.matches
            ? "dark"
            : "light";
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    sync();
    setReady(true);
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(key, next);
    } catch {}
  }
  return (
    <ThemeContext.Provider value={{ theme, ready, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function ThemeToggle() {
  const { theme, ready, toggle } = useContext(ThemeContext);
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      disabled={!ready}
      aria-label={label}
      title={label}
      aria-pressed={theme === "dark"}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
