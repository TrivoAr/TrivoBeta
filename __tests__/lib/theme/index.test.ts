import { isNightEvent, getSeasonalTheme, resolveActiveTheme } from '@/lib/theme';
import type { Event, ThemeFlags } from '@/lib/theme/types';

describe('Theme utilities', () => {
  describe('isNightEvent', () => {
    it('should return true for events starting at or after 18:00', () => {
      const nightEvent: Event = {
        _id: '1',
        fecha: '2024-12-25',
        hora: '18:30',
        nombre: 'Night Event',
      };

      expect(isNightEvent(nightEvent)).toBe(true);
    });

    it('should return false for events starting before 18:00', () => {
      const dayEvent: Event = {
        _id: '1',
        fecha: '2024-12-25',
        hora: '17:30',
        nombre: 'Day Event',
      };

      expect(isNightEvent(dayEvent)).toBe(false);
    });

    it('should return false for events with missing date or time', () => {
      const incompleteEvent: Event = {
        _id: '1',
        fecha: '',
        hora: '18:30',
        nombre: 'Incomplete Event',
      };

      expect(isNightEvent(incompleteEvent)).toBe(false);
    });

    it('should handle edge case at exactly 18:00', () => {
      const edgeCaseEvent: Event = {
        _id: '1',
        fecha: '2024-12-25',
        hora: '18:00',
        nombre: 'Edge Case Event',
      };

      expect(isNightEvent(edgeCaseEvent)).toBe(true);
    });
  });

  describe('getSeasonalTheme', () => {
    it('should return none when disabled', () => {
      const flags: ThemeFlags = {
        activeSeasonalTheme: 'christmas',
        enabled: false,
        dateRanges: [],
      };

      const result = getSeasonalTheme(new Date(), flags);
      expect(result).toBe('none');
    });

    it('should return active seasonal theme when set', () => {
      const flags: ThemeFlags = {
        activeSeasonalTheme: 'halloween',
        enabled: true,
        dateRanges: [],
      };

      const result = getSeasonalTheme(new Date(), flags);
      expect(result).toBe('halloween');
    });

    it('should return theme from date range when in range', () => {
      const now = new Date('2024-12-24T12:00:00.000Z');
      const flags: ThemeFlags = {
        activeSeasonalTheme: 'none',
        enabled: true,
        dateRanges: [
          {
            theme: 'christmas',
            start: '2024-12-20T00:00:00.000Z',
            end: '2024-12-26T23:59:59.999Z',
          },
        ],
      };

      const result = getSeasonalTheme(now, flags);
      expect(result).toBe('christmas');
    });

    it('should return none when outside date ranges', () => {
      const now = new Date('2024-12-27T12:00:00.000Z');
      const flags: ThemeFlags = {
        activeSeasonalTheme: 'none',
        enabled: true,
        dateRanges: [
          {
            theme: 'christmas',
            start: '2024-12-20T00:00:00.000Z',
            end: '2024-12-26T23:59:59.999Z',
          },
        ],
      };

      const result = getSeasonalTheme(now, flags);
      expect(result).toBe('none');
    });
  });

  describe('resolveActiveTheme', () => {
    const baseFlags: ThemeFlags = {
      activeSeasonalTheme: 'none',
      enabled: true,
      dateRanges: [],
    };

    it('should return night for night events', () => {
      const nightEvent: Event = {
        _id: '1',
        fecha: '2024-12-25',
        hora: '19:00',
        nombre: 'Night Event',
      };

      const result = resolveActiveTheme({
        now: new Date(),
        flags: baseFlags,
        event: nightEvent,
      });

      expect(result).toBe('night');
    });

    it('should return night when forceNight is true', () => {
      const result = resolveActiveTheme({
        now: new Date(),
        flags: baseFlags,
        forceNight: true,
      });

      expect(result).toBe('night');
    });

    it('should return seasonal theme when active', () => {
      const flags: ThemeFlags = {
        ...baseFlags,
        activeSeasonalTheme: 'christmas',
      };

      const result = resolveActiveTheme({
        now: new Date(),
        flags,
      });

      expect(result).toBe('christmas');
    });

    it('should prioritize night over seasonal for night events', () => {
      const flags: ThemeFlags = {
        ...baseFlags,
        activeSeasonalTheme: 'christmas',
      };

      const nightEvent: Event = {
        _id: '1',
        fecha: '2024-12-25',
        hora: '19:00',
        nombre: 'Night Event',
      };

      const result = resolveActiveTheme({
        now: new Date(),
        flags,
        event: nightEvent,
      });

      expect(result).toBe('night');
    });

    it('should return base when no special themes apply', () => {
      const result = resolveActiveTheme({
        now: new Date(),
        flags: baseFlags,
      });

      expect(result).toBe('base');
    });
  });
});