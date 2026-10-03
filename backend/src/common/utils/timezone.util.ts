/**
 * Timezone and Date Utility for Multi-Tenant Gym Operations
 * Handles IANA timezones, half-open date boundaries [startUtc, endUtc),
 * and local hour calculations.
 */

export function isValidTimezone(tz: string): boolean {
  if (!tz) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function getLocalDayBoundsUtc(
  timezone: string,
  referenceDate: Date = new Date(),
): { start: Date; end: Date; dateStr: string } {
  const safeTz = isValidTimezone(timezone) ? timezone : 'Asia/Karachi';

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(referenceDate); // "YYYY-MM-DD"
  const [year, month, day] = dateStr.split('-').map(Number);

  const approxUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(approxUtc);

  let localHour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  if (localHour === 24) localHour = 0;
  const localMinute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);

  let diffMinutes = localHour * 60 + localMinute;
  if (diffMinutes > 720) diffMinutes -= 1440;

  const startUtc = new Date(approxUtc.getTime() - diffMinutes * 60 * 1000);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

  return { start: startUtc, end: endUtc, dateStr };
}

export function getLocalHourOfDay(date: Date, timezone: string): number {
  const safeTz = isValidTimezone(timezone) ? timezone : 'Asia/Karachi';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);

  let hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  if (hour === 24) hour = 0;
  return hour;
}

export function formatLocalDate(date: Date, timezone: string): string {
  const safeTz = isValidTimezone(timezone) ? timezone : 'Asia/Karachi';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
