import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  applyTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  applyTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'corporate');
  }, [theme]);

  function toggleTheme() {
    setTheme('light');
  }

  function applyTheme(_t: Theme) {
    setTheme('light');
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
