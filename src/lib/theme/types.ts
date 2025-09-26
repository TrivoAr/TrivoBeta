export type SeasonalTheme = "none" | "halloween" | "christmas" | "newyear";

export type ActiveTheme = "base" | "night" | SeasonalTheme;

export interface ThemeFlags {
  activeSeasonalTheme: SeasonalTheme;
  enabled: boolean;
  dateRanges: ThemeDateRange[];
}

export interface ThemeDateRange {
  theme: SeasonalTheme;
  start: string;
  end: string;
}

export interface Event {
  _id: string;
  fecha: string;
  hora: string;
  nombre: string;
  [key: string]: any;
}

export interface ThemeContextValue {
  activeTheme: ActiveTheme;
  seasonalTheme: SeasonalTheme;
  isNightMode: boolean;
  setThemeOverride: (theme: ActiveTheme | null) => void;
  themeOverride: ActiveTheme | null;
}
