import React, { createContext, useContext, useEffect } from 'react';

export type Theme = 'dark';

interface ThemeContextType {
  theme: 'dark';
  isDark: true;
  setTheme: (theme?: any) => void;
  toggleTheme: () => void;
}

const defaultValue: ThemeContextType = {
  theme: 'dark',
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
      try {
        localStorage.removeItem('mzansi_app_theme');
      } catch (e) {}
    }
  }, []);

  return (
    <ThemeContext.Provider value={defaultValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  return useContext(ThemeContext) || defaultValue;
};
