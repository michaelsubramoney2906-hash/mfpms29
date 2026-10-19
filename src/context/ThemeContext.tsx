import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme: Theme = 'dark';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'light-theme');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    if (document.body) {
      document.body.classList.remove('light', 'light-theme');
      document.body.classList.add('dark');
      document.body.setAttribute('data-theme', 'dark');
    }
    try {
      localStorage.removeItem('mzansi_theme_mode');
      localStorage.removeItem('mzansi_theme_preference');
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleTheme = () => {
    // Locked to Dark Mode
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
