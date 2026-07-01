import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("expense-tracker-theme");
    return (saved as "light" | "dark") || "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("expense-tracker-theme", theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
  };
}
