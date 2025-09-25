'use client';

import React, { createContext, useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSeasonalTheme, resolveActiveTheme } from '@/lib/theme';
import type { ThemeContextValue, ActiveTheme, SeasonalTheme, ThemeFlags } from '@/lib/theme/types';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

async function fetchThemeFlags(): Promise<ThemeFlags> {
  try {
    const response = await fetch('/api/themes/global');
    if (!response.ok) {
      throw new Error('Failed to fetch theme flags');
    }
    return response.json();
  } catch (error) {
    const fallback = await import('../../config/themes.json');
    return fallback.default as ThemeFlags;
  }
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeOverride, setThemeOverride] = useState<ActiveTheme | null>(null);

  const { data: flags } = useQuery({
    queryKey: ['theme-flags'],
    queryFn: fetchThemeFlags,
    staleTime: 5 * 60 * 1000,
  });

  const contextValue = useMemo(() => {
    const now = new Date();
    const currentFlags = flags || {
      activeSeasonalTheme: 'none' as SeasonalTheme,
      enabled: false,
      dateRanges: [],
    };

    const seasonalTheme = getSeasonalTheme(now, currentFlags);
    const baseActiveTheme = resolveActiveTheme({ now, flags: currentFlags });
    const activeTheme = themeOverride || baseActiveTheme;

    return {
      activeTheme,
      seasonalTheme,
      isNightMode: activeTheme === 'night',
      setThemeOverride,
      themeOverride,
    };
  }, [flags, themeOverride]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const themeDataAttribute = contextValue.activeTheme === 'base'
      ? null
      : contextValue.activeTheme;

    if (themeDataAttribute) {
      htmlElement.setAttribute('data-theme', themeDataAttribute);
    } else {
      htmlElement.removeAttribute('data-theme');
    }

    return () => {
      htmlElement.removeAttribute('data-theme');
    };
  }, [contextValue.activeTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}