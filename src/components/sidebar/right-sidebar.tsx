"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface UpcomingDate {
  date: string;
  count: number;
}

interface OverdueTodo {
  id: string;
  title: string;
  date: string | null;
}

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function RightSidebar() {
  const [upcoming, setUpcoming] = useState<UpcomingDate[]>([]);
  const [overdue, setOverdue] = useState<OverdueTodo[]>([]);
  const [unscheduledCount, setUnscheduledCount] = useState(0);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch(`/api/todos?upcoming=${today}`)
      .then((response) => response.json())
      .then((data: UpcomingDate[]) => setUpcoming(data))
      .catch(() => undefined);

    fetch(`/api/todos?overdue=${today}`)
      .then((response) => response.json())
      .then((data: OverdueTodo[]) => setOverdue(data))
      .catch(() => undefined);

    fetch("/api/todos?unscheduled=true")
      .then((response) => response.json())
      .then((data: OverdueTodo[]) => setUnscheduledCount(data.length))
      .catch(() => undefined);
  }, [today]);

  function formatDate(dateStr: string) {
    const date = new Date(`${dateStr}T00:00:00`);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS[date.getDay()]}`;
  }

  function daysOverdue(dateStr: string) {
    const date = new Date(`${dateStr}T00:00:00`);
    const current = new Date(`${today}T00:00:00`);
    return Math.floor((current.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  const overdueDates = Array.from(
    new Set(overdue.map((todo) => todo.date).filter((date): date is string => Boolean(date))),
  );

  return (
    <aside className="w-[260px] flex-shrink-0 overflow-y-auto border-l border-[var(--border-default)] bg-[var(--bg-sidebar-right)] p-5">
      <section className="mb-6">
        <h3 className="mb-3 text-sm font-semibold">即将提醒</h3>
        {upcoming.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">暂无</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map((item) => (
              <Link
                key={item.date}
                href={`/date/${item.date}`}
                className="block rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-3 transition-colors hover:border-[var(--accent)]"
              >
                <div className="text-xs font-semibold text-[var(--accent-light)]">
                  {formatDate(item.date)}
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.count} 项待办</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h3 className="mb-3 text-sm font-semibold">已逾期</h3>
        {overdueDates.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">无逾期项</p>
        ) : (
          <div className="flex flex-col gap-2">
            {overdueDates.map((date) => (
              <Link
                key={date}
                href={`/date/${date}`}
                className="block rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] p-3 transition-opacity hover:opacity-90"
              >
                <div className="text-xs font-semibold text-[var(--danger)]">
                  {formatDate(date)} · 逾期{daysOverdue(date)}天
                </div>
                <div className="mt-1 text-xs text-[var(--text-secondary)]">
                  {overdue.filter((todo) => todo.date === date).length} 项未完成
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold">未安排</h3>
        <Link
          href="/unscheduled"
          className="block rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-3 transition-colors hover:border-[var(--accent)]"
        >
          <div className="text-xs text-[var(--text-secondary)]">{unscheduledCount} 项无日期待办</div>
          <div className="mt-1 text-[11px] text-[var(--text-dim)]">点击查看或安排日期</div>
        </Link>
      </section>
    </aside>
  );
}
