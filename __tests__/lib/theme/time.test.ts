import { parseEventDateTime, getEventTimeInTucuman, isAfterTime, formatEventTime } from '@/lib/theme/time';

describe('Time utilities', () => {
  describe('isAfterTime', () => {
    it('should return true for times at or after target hour', () => {
      expect(isAfterTime('2024-12-25', '18:30', 18)).toBe(true);
      expect(isAfterTime('2024-12-25', '18:00', 18)).toBe(true);
      expect(isAfterTime('2024-12-25', '19:15', 18)).toBe(true);
    });

    it('should return false for times before target hour', () => {
      expect(isAfterTime('2024-12-25', '17:30', 18)).toBe(false);
      expect(isAfterTime('2024-12-25', '08:00', 18)).toBe(false);
    });

    it('should handle invalid dates gracefully', () => {
      expect(isAfterTime('invalid-date', '20:30', 20)).toBe(false);
      expect(isAfterTime('2024-12-25', 'invalid-time', 20)).toBe(false);
      expect(isAfterTime('', '20:30', 20)).toBe(false);
    });

    it('should handle edge cases around midnight', () => {
      expect(isAfterTime('2024-12-25', '23:59', 18)).toBe(true);
      expect(isAfterTime('2024-12-25', '00:01', 18)).toBe(false);
    });
  });

  describe('parseEventDateTime', () => {
    it('should parse valid date and time', () => {
      const result = parseEventDateTime('2024-12-25', '20:30');
      expect(result).toBeInstanceOf(Date);
    });

    it('should throw error for missing date or time', () => {
      expect(() => parseEventDateTime('', '20:30')).toThrow();
      expect(() => parseEventDateTime('2024-12-25', '')).toThrow();
    });
  });

  describe('getEventTimeInTucuman', () => {
    it('should return date object for valid input', () => {
      const result = getEventTimeInTucuman('2024-12-25', '20:30');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('formatEventTime', () => {
    it('should format time correctly', () => {
      const result = formatEventTime('2024-12-25', '20:30');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should return original time for invalid input', () => {
      const result = formatEventTime('invalid-date', '20:30');
      expect(result).toBe('20:30');
    });
  });
});