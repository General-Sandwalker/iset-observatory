import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import frFR from 'antd/locale/fr_FR';

type ThemeMode = 'light' | 'dark';

type ColorSchemeName = 'ocean' | 'forest' | 'sunset' | 'lavender' | 'crimson';

interface ColorSchemeDefinition {
  name: ColorSchemeName;
  color: string;
  label: string;
}

interface SchemeTokens {
  colorPrimary: string;
  colorInfo: string;
  siderBgDark: string;
  siderBgLight: string;
  light: {
    colorBgLayout: string;
    colorBgContainer: string;
    colorBgElevated: string;
    colorText: string;
    colorTextSecondary: string;
    colorBorder: string;
    colorBorderSecondary: string;
  };
  dark: {
    colorBgLayout: string;
    colorBgContainer: string;
    colorBgElevated: string;
    colorText: string;
    colorTextSecondary: string;
    colorBorder: string;
    colorBorderSecondary: string;
  };
}

const COLOR_SCHEMES: ColorSchemeDefinition[] = [
  { name: 'ocean', color: '#2563eb', label: 'Océan' },
  { name: 'forest', color: '#16a34a', label: 'Forêt' },
  { name: 'sunset', color: '#ea580c', label: 'Couché de soleil' },
  { name: 'lavender', color: '#7c3aed', label: 'Lavande' },
  { name: 'crimson', color: '#dc2626', label: 'Cramoisi' },
];

const SCHEME_TOKENS: Record<ColorSchemeName, SchemeTokens> = {
  ocean: {
    colorPrimary: '#2563eb',
    colorInfo: '#2563eb',
    siderBgDark: '#060a16',
    siderBgLight: 'rgba(15, 23, 42, 0.96)',
    light: {
      colorBgLayout: '#eef3fa',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorText: '#1a2640',
      colorTextSecondary: '#4d6580',
      colorBorder: 'rgba(37, 99, 235, 0.18)',
      colorBorderSecondary: 'rgba(37, 99, 235, 0.10)',
    },
    dark: {
      colorBgLayout: '#090e1a',
      colorBgContainer: '#111b2e',
      colorBgElevated: '#162036',
      colorText: '#dde6f5',
      colorTextSecondary: '#8faac8',
      colorBorder: 'rgba(96, 165, 250, 0.18)',
      colorBorderSecondary: 'rgba(96, 165, 250, 0.10)',
    },
  },
  forest: {
    colorPrimary: '#16a34a',
    colorInfo: '#16a34a',
    siderBgDark: '#060f0a',
    siderBgLight: 'rgba(15, 23, 42, 0.96)',
    light: {
      colorBgLayout: '#eefbf2',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorText: '#14332a',
      colorTextSecondary: '#3d6b52',
      colorBorder: 'rgba(22, 163, 74, 0.18)',
      colorBorderSecondary: 'rgba(22, 163, 74, 0.10)',
    },
    dark: {
      colorBgLayout: '#080f0b',
      colorBgContainer: '#112118',
      colorBgElevated: '#152d1e',
      colorText: '#daf5e3',
      colorTextSecondary: '#86c89a',
      colorBorder: 'rgba(74, 222, 128, 0.18)',
      colorBorderSecondary: 'rgba(74, 222, 128, 0.10)',
    },
  },
  sunset: {
    colorPrimary: '#ea580c',
    colorInfo: '#ea580c',
    siderBgDark: '#0f0906',
    siderBgLight: 'rgba(15, 23, 42, 0.96)',
    light: {
      colorBgLayout: '#fef4ee',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorText: '#3a1f12',
      colorTextSecondary: '#7a4a2e',
      colorBorder: 'rgba(234, 88, 12, 0.18)',
      colorBorderSecondary: 'rgba(234, 88, 12, 0.10)',
    },
    dark: {
      colorBgLayout: '#0e0907',
      colorBgContainer: '#1e120b',
      colorBgElevated: '#2a1a11',
      colorText: '#fde5d4',
      colorTextSecondary: '#c4936e',
      colorBorder: 'rgba(251, 146, 60, 0.18)',
      colorBorderSecondary: 'rgba(251, 146, 60, 0.10)',
    },
  },
  lavender: {
    colorPrimary: '#7c3aed',
    colorInfo: '#7c3aed',
    siderBgDark: '#08060f',
    siderBgLight: 'rgba(15, 23, 42, 0.96)',
    light: {
      colorBgLayout: '#f3eeff',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorText: '#271452',
      colorTextSecondary: '#5e3d94',
      colorBorder: 'rgba(124, 58, 237, 0.18)',
      colorBorderSecondary: 'rgba(124, 58, 237, 0.10)',
    },
    dark: {
      colorBgLayout: '#0a0715',
      colorBgContainer: '#16102a',
      colorBgElevated: '#1e1538',
      colorText: '#e8daff',
      colorTextSecondary: '#a88cda',
      colorBorder: 'rgba(167, 139, 250, 0.18)',
      colorBorderSecondary: 'rgba(167, 139, 250, 0.10)',
    },
  },
  crimson: {
    colorPrimary: '#dc2626',
    colorInfo: '#dc2626',
    siderBgDark: '#0f0606',
    siderBgLight: 'rgba(15, 23, 42, 0.96)',
    light: {
      colorBgLayout: '#feeeee',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorText: '#3a1212',
      colorTextSecondary: '#7a3838',
      colorBorder: 'rgba(220, 38, 38, 0.18)',
      colorBorderSecondary: 'rgba(220, 38, 38, 0.10)',
    },
    dark: {
      colorBgLayout: '#0e0707',
      colorBgContainer: '#1e0f0f',
      colorBgElevated: '#2a1515',
      colorText: '#fddada',
      colorTextSecondary: '#c48a8a',
      colorBorder: 'rgba(248, 113, 113, 0.18)',
      colorBorderSecondary: 'rgba(248, 113, 113, 0.10)',
    },
  },
};

const DARK_PRIMARY_MAP: Record<ColorSchemeName, string> = {
  ocean: '#60a5fa',
  forest: '#4ade80',
  sunset: '#fb923c',
  lavender: '#a78bfa',
  crimson: '#f87171',
};

const COMMON_TOKENS = {
  colorSuccess: '#10b981',
  colorWarning: '#f59e0b',
  colorError: '#ef4444',
  borderRadius: 10,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const DARK_SUCCESS = '#34d399';
const DARK_WARNING = '#fbbf24';
const DARK_ERROR = '#f87171';

interface ThemeContextValue {
  theme: ThemeMode;
  colorScheme: string;
  toggleTheme: () => void;
  applyTheme: (t: ThemeMode) => void;
  applyColorScheme: (scheme: string) => void;
  availableSchemes: ColorSchemeDefinition[];
  siderTheme: {
    colorPrimary: string;
    colorBg: string;
    colorText: string;
    colorTextSecondary: string;
    colorTextTertiary: string;
    colorBorder: string;
    colorBorderSecondary: string;
  };
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colorScheme: 'ocean',
  toggleTheme: () => {},
  applyTheme: () => {},
  applyColorScheme: () => {},
  availableSchemes: COLOR_SCHEMES,
  siderTheme: {
    colorPrimary: DARK_PRIMARY_MAP.ocean,
    colorBg: SCHEME_TOKENS.ocean.siderBgDark,
    colorText: SCHEME_TOKENS.ocean.dark.colorText,
    colorTextSecondary: SCHEME_TOKENS.ocean.dark.colorTextSecondary,
    colorTextTertiary: SCHEME_TOKENS.ocean.dark.colorTextSecondary,
    colorBorder: SCHEME_TOKENS.ocean.dark.colorBorder,
    colorBorderSecondary: SCHEME_TOKENS.ocean.dark.colorBorderSecondary,
  },
});

function isValidScheme(value: string): value is ColorSchemeName {
  return Object.keys(SCHEME_TOKENS).includes(value);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('obs-theme');
    return stored === 'light' || stored === 'dark' ? stored : 'dark';
  });

  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(() => {
    const stored = localStorage.getItem('obs-color-scheme');
    return stored && isValidScheme(stored) ? stored : 'ocean';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    localStorage.setItem('obs-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('obs-color-scheme', colorScheme);
  }, [colorScheme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function applyTheme(t: ThemeMode) {
    setTheme(t);
  }

  function applyColorScheme(scheme: string) {
    if (isValidScheme(scheme)) {
      setColorScheme(scheme);
    }
  }

  const isDark = theme === 'dark';
  const schemeTokens = SCHEME_TOKENS[colorScheme];
  const modeTokens = isDark ? schemeTokens.dark : schemeTokens.light;

  const siderBg = isDark ? schemeTokens.siderBgDark : 'rgba(10, 15, 30, 0.98)';
  const siderPrimary = isDark ? DARK_PRIMARY_MAP[colorScheme] : schemeTokens.colorPrimary;
  const siderText = 'rgba(255, 255, 255, 0.92)';
  const siderTextSecondary = 'rgba(255, 255, 255, 0.58)';
  const siderTextTertiary = 'rgba(255, 255, 255, 0.38)';
  const siderBorder = 'rgba(255, 255, 255, 0.08)';
  const siderBorderSecondary = 'rgba(255, 255, 255, 0.05)';

  const siderTheme = useMemo(() => ({
    colorPrimary: siderPrimary,
    colorBg: siderBg,
    colorText: siderText,
    colorTextSecondary: siderTextSecondary,
    colorTextTertiary: siderTextTertiary,
    colorBorder: siderBorder,
    colorBorderSecondary: siderBorderSecondary,
  }), [siderPrimary, siderBg, siderText, siderTextSecondary, siderTextTertiary, siderBorder, siderBorderSecondary]);

  const antdTheme = useMemo(
    () => ({
      algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      token: {
        colorPrimary: isDark ? DARK_PRIMARY_MAP[colorScheme] : schemeTokens.colorPrimary,
        colorInfo: isDark ? DARK_PRIMARY_MAP[colorScheme] : schemeTokens.colorInfo,
        colorSuccess: isDark ? DARK_SUCCESS : COMMON_TOKENS.colorSuccess,
        colorWarning: isDark ? DARK_WARNING : COMMON_TOKENS.colorWarning,
        colorError: isDark ? DARK_ERROR : COMMON_TOKENS.colorError,
        colorBgLayout: modeTokens.colorBgLayout,
        colorBgContainer: modeTokens.colorBgContainer,
        colorBgElevated: modeTokens.colorBgElevated,
        colorText: modeTokens.colorText,
        colorTextSecondary: modeTokens.colorTextSecondary,
        colorBorder: modeTokens.colorBorder,
        colorBorderSecondary: modeTokens.colorBorderSecondary,
        borderRadius: COMMON_TOKENS.borderRadius,
        fontFamily: COMMON_TOKENS.fontFamily,
      },
      components: {
        Layout: {
          siderBg: isDark ? schemeTokens.siderBgDark : schemeTokens.siderBgLight,
          headerBg: 'transparent',
        },
        Menu: {
          darkItemBg: 'transparent',
          darkSubMenuItemBg: 'transparent',
        },
        Card: {
          colorBorderSecondary: modeTokens.colorBorderSecondary,
        },
        Button: {
          colorPrimary: isDark ? DARK_PRIMARY_MAP[colorScheme] : schemeTokens.colorPrimary,
          algorithm: true,
        },
      },
    }),
    [isDark, colorScheme, schemeTokens, modeTokens],
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        toggleTheme,
        applyTheme,
        applyColorScheme,
        availableSchemes: COLOR_SCHEMES,
        siderTheme,
      }}
    >
      <ConfigProvider locale={frFR} theme={antdTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
