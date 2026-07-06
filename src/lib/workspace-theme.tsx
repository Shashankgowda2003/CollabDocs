"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface WorkspaceTheme {
  accentColor: string;
  logo?: string;
}

const DEFAULT_THEME: WorkspaceTheme = {
  accentColor: "#3b82f6",
};

interface WorkspaceThemeContextValue {
  theme: WorkspaceTheme;
  updateTheme: (t: Partial<WorkspaceTheme>) => void;
  resetTheme: () => void;
}

const WorkspaceThemeContext = createContext<WorkspaceThemeContextValue>({
  theme: DEFAULT_THEME,
  updateTheme: () => {},
  resetTheme: () => {},
});

export function useWorkspaceTheme() {
  return useContext(WorkspaceThemeContext);
}

export function WorkspaceThemeProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<WorkspaceTheme>(DEFAULT_THEME);

  useEffect(() => {
    const saved = localStorage.getItem(`workspace-theme-${workspaceId}`);
    if (saved) {
      try {
        setTheme({ ...DEFAULT_THEME, ...JSON.parse(saved) });
      } catch {
        setTheme(DEFAULT_THEME);
      }
    }
  }, [workspaceId]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", theme.accentColor);
    document.documentElement.style.setProperty("--accent-light", theme.accentColor + "20");
    return () => {
      document.documentElement.style.removeProperty("--accent");
      document.documentElement.style.removeProperty("--accent-light");
    };
  }, [theme.accentColor]);

  function updateTheme(partial: Partial<WorkspaceTheme>) {
    const next = { ...theme, ...partial };
    setTheme(next);
    localStorage.setItem(`workspace-theme-${workspaceId}`, JSON.stringify(next));
  }

  function resetTheme() {
    setTheme(DEFAULT_THEME);
    localStorage.removeItem(`workspace-theme-${workspaceId}`);
  }

  return (
    <WorkspaceThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </WorkspaceThemeContext.Provider>
  );
}
