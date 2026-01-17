import * as React from 'react';
import { useTheme } from '../hooks/useTheme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      root.setAttribute('data-theme', systemTheme);
      return;
    }

    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
};
