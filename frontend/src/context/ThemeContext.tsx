import React, { createContext, useContext, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: Theme = "light";

  useEffect(() => {
    const root = window.document.documentElement;
    
   
    // Ensure the document always uses the light theme
    root.classList.remove("dark");
    root.classList.add("light");

    // Persist the enforced theme for completeness
    localStorage.setItem("theme", "light");
  }, []);

  const toggleTheme = useCallback(() => {
    // Intentionally left blank: theme is locked to light.
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
