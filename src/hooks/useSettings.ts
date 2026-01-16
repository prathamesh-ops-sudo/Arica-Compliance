import { useState, useEffect, useCallback } from "react";

export type ColorScheme = "Blue" | "Green" | "Purple";
export type DashboardLayout = "default" | "compact" | "expanded";

interface Settings {
  colorScheme: ColorScheme;
  dashboardLayout: DashboardLayout;
  isDark: boolean;
}

const COLOR_SCHEMES: Record<ColorScheme, { primary: string; gradientStart: string; gradientEnd: string }> = {
  Blue: {
    primary: "214 100% 41%",
    gradientStart: "214 100% 41%",
    gradientEnd: "220 90% 56%",
  },
  Green: {
    primary: "160 84% 39%",
    gradientStart: "160 84% 39%",
    gradientEnd: "142 71% 45%",
  },
  Purple: {
    primary: "263 70% 50%",
    gradientStart: "263 70% 50%",
    gradientEnd: "280 65% 60%",
  },
};

const DARK_COLOR_SCHEMES: Record<ColorScheme, { primary: string; gradientStart: string; gradientEnd: string }> = {
  Blue: {
    primary: "214 100% 59%",
    gradientStart: "214 100% 50%",
    gradientEnd: "220 90% 65%",
  },
  Green: {
    primary: "160 84% 45%",
    gradientStart: "160 84% 45%",
    gradientEnd: "142 71% 50%",
  },
  Purple: {
    primary: "263 70% 58%",
    gradientStart: "263 70% 58%",
    gradientEnd: "280 65% 65%",
  },
};

const STORAGE_KEY = "arica-settings";

const getDefaultSettings = (): Settings => ({
  colorScheme: "Blue",
  dashboardLayout: "default",
  isDark: document.documentElement.classList.contains("dark"),
});

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...getDefaultSettings(), ...parsed };
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
    return getDefaultSettings();
  });

  // Apply color scheme to CSS variables
  const applyColorScheme = useCallback((scheme: ColorScheme, isDark: boolean) => {
    const colors = isDark ? DARK_COLOR_SCHEMES[scheme] : COLOR_SCHEMES[scheme];
    const root = document.documentElement;
    
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--gradient-start", colors.gradientStart);
    root.style.setProperty("--gradient-end", colors.gradientEnd);
    root.style.setProperty("--ring", colors.primary);
    root.style.setProperty("--sidebar-primary", colors.primary);
    root.style.setProperty("--sidebar-ring", colors.primary);
  }, []);

  // Apply dark mode
  const applyDarkMode = useCallback((isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Apply layout class to body
  const applyLayout = useCallback((layout: DashboardLayout) => {
    document.body.dataset.layout = layout;
  }, []);

  // Initialize settings on mount
  useEffect(() => {
    applyColorScheme(settings.colorScheme, settings.isDark);
    applyDarkMode(settings.isDark);
    applyLayout(settings.dashboardLayout);
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  }, [settings]);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setSettings((prev) => {
      applyColorScheme(scheme, prev.isDark);
      return { ...prev, colorScheme: scheme };
    });
  }, [applyColorScheme]);

  const setDashboardLayout = useCallback((layout: DashboardLayout) => {
    setSettings((prev) => {
      applyLayout(layout);
      return { ...prev, dashboardLayout: layout };
    });
  }, [applyLayout]);

  const toggleDarkMode = useCallback(() => {
    setSettings((prev) => {
      const newIsDark = !prev.isDark;
      applyDarkMode(newIsDark);
      applyColorScheme(prev.colorScheme, newIsDark);
      return { ...prev, isDark: newIsDark };
    });
  }, [applyDarkMode, applyColorScheme]);

  return {
    colorScheme: settings.colorScheme,
    dashboardLayout: settings.dashboardLayout,
    isDark: settings.isDark,
    setColorScheme,
    setDashboardLayout,
    toggleDarkMode,
  };
}
