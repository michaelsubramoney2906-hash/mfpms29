import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'mzansi_app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    }
    return 'dark'; // Default to dark theme for executive dashboard aesthetics
  });

  const applyThemeToDOM = (activeTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;

      if (activeTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.setAttribute('data-theme', 'dark');
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
      }
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyThemeToDOM(newTheme);
    window.dispatchEvent(new CustomEvent('mzansi_theme_changed', { detail: { theme: newTheme } }));
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    const isDarkDefault = typeof document !== 'undefined' 
      ? (document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light'))
      : true;
    return {
      theme: isDarkDefault ? 'dark' : 'light',
      isDark: isDarkDefault,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
};
