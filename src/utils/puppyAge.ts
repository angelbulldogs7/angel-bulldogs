/** Shared litter age helpers. Months are completed calendar months, not fixed 30-day blocks. */

export const AGE_TIMEZONE = "America/Chicago";

export interface CalendarYmd {
  year: number;
  month: number;
  day: number;
}

export interface CalendarAge {
  months: number;
  days: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDateParts(iso: string): CalendarYmd | null {
  const match = ISO_DATE.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function getZonedYmd(date: Date, timeZone: string = AGE_TIMEZONE): CalendarYmd {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return { year, month, day };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

function ymdToOrdinal({ year, month, day }: CalendarYmd): number {
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * Completed calendar months from birth to `now`, plus remaining calendar days
 * after the latest anniversary at or before the zoned “today.”
 */
export function calendarAgeMonthsDays(
  birthIso: string,
  now: Date = new Date(),
  timeZone: string = AGE_TIMEZONE,
): CalendarAge | null {
  const birth = parseIsoDateParts(birthIso);
  if (!birth) return null;
  const today = getZonedYmd(now, timeZone);
  const birthOrd = ymdToOrdinal(birth);
  const todayOrd = ymdToOrdinal(today);
  if (todayOrd < birthOrd) return null;

  let months =
    (today.year - birth.year) * 12 + (today.month - birth.month);
  let anniversaryYear = birth.year + Math.floor((birth.month - 1 + months) / 12);
  let anniversaryMonth = ((birth.month - 1 + months) % 12) + 1;
  let anniversaryDay = clampDay(anniversaryYear, anniversaryMonth, birth.day);
  let anniversary: CalendarYmd = {
    year: anniversaryYear,
    month: anniversaryMonth,
    day: anniversaryDay,
  };

  if (ymdToOrdinal(anniversary) > todayOrd) {
    months -= 1;
    anniversaryYear = birth.year + Math.floor((birth.month - 1 + months) / 12);
    anniversaryMonth = ((birth.month - 1 + months) % 12) + 1;
    anniversaryDay = clampDay(anniversaryYear, anniversaryMonth, birth.day);
    anniversary = {
      year: anniversaryYear,
      month: anniversaryMonth,
      day: anniversaryDay,
    };
  }

  const days = todayOrd - ymdToOrdinal(anniversary);
  return { months: Math.max(0, months), days: Math.max(0, days) };
}

export function formatCalendarAge(age: CalendarAge): string {
  const { months, days } = age;
  if (months === 0) {
    if (days === 0) return "0 days old";
    return days === 1 ? "1 day old" : `${days} days old`;
  }
  if (days === 0) {
    return months === 1 ? "1 month old" : `${months} months old`;
  }
  const monthPart = months === 1 ? "1 month" : `${months} months`;
  const dayPart = days === 1 ? "1 day" : `${days} days`;
  return `${monthPart}, ${dayPart} old`;
}

export function formatBirthDateLong(iso: string): string {
  const parts = parseIsoDateParts(iso);
  if (!parts) return iso;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
