export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

interface GenerateOptions {
  frequency: Frequency;
  startDate: string;
  endDate?: string | null;
}

const DEFAULT_HORIZON_YEARS = 20;

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseDate(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split("-").map(Number);
  return [y, m, d];
}

export function generateOccurrences(options: GenerateOptions): string[] {
  const { frequency, startDate, endDate } = options;
  const [startYear, startMonth, startDay] = parseDate(startDate);

  const horizonDate = new Date(startYear + DEFAULT_HORIZON_YEARS, startMonth - 1, startDay);
  const effectiveEnd = endDate
    ? new Date(Math.min(new Date(`${endDate}T00:00:00`).getTime(), horizonDate.getTime()))
    : horizonDate;

  const dates: string[] = [];
  let current = new Date(`${startDate}T00:00:00`);

  while (current <= effectiveEnd) {
    dates.push(formatDate(current.getFullYear(), current.getMonth() + 1, current.getDate()));

    switch (frequency) {
      case "daily":
        current.setDate(current.getDate() + 1);
        break;
      case "weekly":
        current.setDate(current.getDate() + 7);
        break;
      case "monthly": {
        const nextMonth = current.getMonth() + 2;
        const nextYear = current.getFullYear() + (nextMonth > 12 ? 1 : 0);
        const normalizedMonth = nextMonth > 12 ? nextMonth - 12 : nextMonth;
        const maxDay = daysInMonth(nextYear, normalizedMonth);
        const day = Math.min(startDay, maxDay);
        current = new Date(`${formatDate(nextYear, normalizedMonth, day)}T00:00:00`);
        break;
      }
      case "yearly": {
        const ny = current.getFullYear() + 1;
        const maxDay = daysInMonth(ny, startMonth);
        const day = Math.min(startDay, maxDay);
        current = new Date(`${formatDate(ny, startMonth, day)}T00:00:00`);
        break;
      }
    }
  }

  return dates;
}
