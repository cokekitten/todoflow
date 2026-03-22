"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay() - 1;

  if (startWeekday < 0) {
    startWeekday = 6;
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  for (let index = startWeekday - 1; index >= 0; index -= 1) {
    const day = daysInPrevMonth - index;
    const displayMonth = month === 0 ? 12 : month;
    const displayYear = month === 0 ? year - 1 : year;
    days.push({
      date: `${displayYear}-${String(displayMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({
      date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      isCurrentMonth: true,
    });
  }

  const remaining = 42 - days.length;
  for (let day = 1; day <= remaining; day += 1) {
    const displayMonth = month + 2 > 12 ? 1 : month + 2;
    const displayYear = month + 2 > 12 ? year + 1 : year;
    days.push({
      date: `${displayYear}-${String(displayMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      isCurrentMonth: false,
    });
  }

  return days;
}

export function Calendar() {
  const router = useRouter();
  const pathname = usePathname();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const activeDate = pathname.startsWith("/date/") ? pathname.slice(6) : null;
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [datesWithTodos, setDatesWithTodos] = useState<Set<string>>(new Set());

  const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const days = getMonthDays(year, month);

  useEffect(() => {
    fetch(`/api/todos?calendarMonth=${yearMonth}`)
      .then((response) => response.json())
      .then((dates: string[]) => setDatesWithTodos(new Set(dates)))
      .catch(() => undefined);
  }, [yearMonth]);

  function goToPreviousMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
      return;
    }

    setMonth(month - 1);
  }

  function goToNextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
      return;
    }

    setMonth(month + 1);
  }

  function goToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    router.push(`/date/${today}`);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">
          <span className="text-[var(--accent-light)]">{month + 1}月</span>{" "}
          <span className="text-[var(--accent-light)]">{year}</span>
        </span>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="text-[var(--accent-light)] hover:underline"
          >
            今天
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-[var(--text-dim)]">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center text-[11px]">
        {days.map((day) => {
          const isToday = day.date === today;
          const isActive = day.date === activeDate;
          const hasTodos = datesWithTodos.has(day.date);

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => router.push(`/date/${day.date}`)}
              className={[
                "relative rounded-sm py-1 transition-colors hover:bg-[var(--border-default)]",
                day.isCurrentMonth ? "text-[var(--text-secondary)]" : "text-[var(--text-dim)] opacity-40",
                isActive ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]" : "",
                isToday && !isActive ? "font-bold text-[var(--accent-light)]" : "",
              ].join(" ")}
            >
              {day.day}
              {hasTodos && !isActive ? (
                <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
