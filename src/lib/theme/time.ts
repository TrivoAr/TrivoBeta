import { fromZonedTime, toZonedTime, format } from "date-fns-tz";

export const TUCUMAN_TIMEZONE = "America/Argentina/Tucuman";

export function parseEventDateTime(date: string, time: string): Date {
  if (!date || !time) {
    throw new Error("Date and time are required");
  }

  const dateTimeString = `${date}T${time}:00`;
  const localDateTime = new Date(dateTimeString);

  return fromZonedTime(localDateTime, TUCUMAN_TIMEZONE);
}

export function getEventTimeInTucuman(date: string, time: string): Date {
  const utcDate = parseEventDateTime(date, time);
  return toZonedTime(utcDate, TUCUMAN_TIMEZONE);
}

export function isAfterTime(
  eventDate: string,
  eventTime: string,
  targetHour: number
): boolean {
  try {
    const eventDateTime = getEventTimeInTucuman(eventDate, eventTime);
    return eventDateTime.getHours() >= targetHour;
  } catch {
    return false;
  }
}

export function formatEventTime(date: string, time: string): string {
  try {
    const eventDateTime = getEventTimeInTucuman(date, time);
    return format(eventDateTime, "HH:mm", { timeZone: TUCUMAN_TIMEZONE });
  } catch {
    return time;
  }
}
