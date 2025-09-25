import { isAfterTime } from './time';
import type { SeasonalTheme, ActiveTheme, ThemeFlags, Event } from './types';

const NIGHT_START_HOUR = 18;

export function isNightEvent(event: Event): boolean {
  if (!event.fecha || !event.hora) {
    return false;
  }

  return isAfterTime(event.fecha, event.hora, NIGHT_START_HOUR);
}

export function getSeasonalTheme(now: Date, flags: ThemeFlags): SeasonalTheme {
  if (!flags.enabled) {
    return 'none';
  }

  const currentISOString = now.toISOString();

  // Primero checkear rangos de fechas (mayor prioridad)
  for (const range of flags.dateRanges) {
    if (currentISOString >= range.start && currentISOString <= range.end) {
      return range.theme;
    }
  }

  // Si no hay rango activo, usar tema manual como fallback
  if (flags.activeSeasonalTheme !== 'none') {
    return flags.activeSeasonalTheme;
  }

  return 'none';
}

export function resolveActiveTheme(options: {
  now: Date;
  flags: ThemeFlags;
  event?: Event;
  forceNight?: boolean;
}): ActiveTheme {
  const { now, flags, event, forceNight } = options;

  if (forceNight || (event && isNightEvent(event))) {
    return 'night';
  }

  const seasonal = getSeasonalTheme(now, flags);
  return seasonal === 'none' ? 'base' : seasonal;
}

export function getThemeDataAttribute(theme: ActiveTheme): string | undefined {
  return theme === 'base' ? undefined : theme;
}

export * from './types';
export * from './time';