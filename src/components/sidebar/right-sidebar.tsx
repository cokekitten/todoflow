"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ChevronDownIcon } from "@/components/icons/ui-icons";
import { notifyTodosChanged, TAGS_CHANGED_EVENT, TODOS_CHANGED_EVENT } from "@/lib/todo-events";
import type { Todo, Tag } from "@/types";
import { RightSidebarTodoItem } from "./right-sidebar-todo-item";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const MAX_DATES = 5;
const MAX_TODOS_PER_GROUP = 10;
const SECTION_STATE_KEY = "todoflow:right-sidebar-sections";

type SectionKey = "upcoming" | "overdue" | "unscheduled";

function SectionCard({
  children,
  danger = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-3",
        danger
          ? "border-[var(--danger-border)] bg-[var(--danger-bg)]"
          : "border-[var(--border-default)] bg-[var(--bg-card)]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function RightSidebar() {
  const [upcomingTodos, setUpcomingTodos] = useState<Todo[]>([]);
  const [overdueTodos, setOverdueTodos] = useState<Todo[]>([]);
  const [unscheduledTodos, setUnscheduledTodos] = useState<Todo[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    upcoming: false,
    overdue: false,
    unscheduled: false,
  });
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const raw = localStorage.getItem(SECTION_STATE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<Record<SectionKey, boolean>>;
      setCollapsed({
        upcoming: parsed.upcoming ?? false,
        overdue: parsed.overdue ?? false,
        unscheduled: parsed.unscheduled ?? false,
      });
    } catch {}
  }, []);

  function toggleSection(section: SectionKey) {
    setCollapsed((current) => {
      const next = { ...current, [section]: !current[section] };
      localStorage.setItem(SECTION_STATE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const refreshSidebarData = useCallback(() => {
    // Fetch upcoming todos (we need full todo data now)
    fetch(`/api/todos?upcoming=${today}`)
      .then((response) => response.json())
      .then((dates: { date: string; count: number }[]) => {
        // Fetch todos for up to MAX_DATES upcoming dates
        const datesToFetch = dates.slice(0, MAX_DATES);
        return Promise.all(
          datesToFetch.map((d) =>
            fetch(`/api/todos?date=${d.date}`)
              .then((r) => r.json())
              .then((todos: Todo[]) => todos.filter((t) => t.completed === 0)),
          ),
        );
      })
      .then((todoGroups) => setUpcomingTodos(todoGroups.flat()))
      .catch(() => undefined);

    fetch(`/api/todos?overdue=${today}`)
      .then((response) => response.json())
      .then((data: Todo[]) => setOverdueTodos(data))
      .catch(() => undefined);

    fetch("/api/todos?unscheduled=true")
      .then((response) => response.json())
      .then((data: Todo[]) => setUnscheduledTodos(data.filter((t) => t.completed === 0)))
      .catch(() => undefined);

    fetch("/api/tags")
      .then((response) => response.json())
      .then((data: Tag[]) => setAllTags(data))
      .catch(() => undefined);
  }, [today]);

  useEffect(() => {
    refreshSidebarData();
    function handleTodosChanged() { refreshSidebarData(); }
    function handleTagsChanged() { refreshSidebarData(); }
    window.addEventListener(TODOS_CHANGED_EVENT, handleTodosChanged);
    window.addEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
    return () => {
      window.removeEventListener(TODOS_CHANGED_EVENT, handleTodosChanged);
      window.removeEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
    };
  }, [refreshSidebarData]);

  async function handleToggle(id: string, completed: boolean) {
    await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    notifyTodosChanged();
  }

  function formatDate(dateStr: string) {
    const date = new Date(`${dateStr}T00:00:00`);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS[date.getDay()]}`;
  }

  function daysOverdue(dateStr: string) {
    const date = new Date(`${dateStr}T00:00:00`);
    const current = new Date(`${today}T00:00:00`);
    return Math.floor((current.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Group upcoming todos by date (near to far)
  const upcomingByDate = new Map<string, Todo[]>();
  for (const todo of upcomingTodos) {
    if (!todo.date) continue;
    if (!upcomingByDate.has(todo.date)) upcomingByDate.set(todo.date, []);
    upcomingByDate.get(todo.date)!.push(todo);
  }
  const upcomingDates = Array.from(upcomingByDate.keys()).sort();

  // Group overdue todos by date (near to far, most recent overdue first)
  const overdueByDate = new Map<string, Todo[]>();
  for (const todo of overdueTodos) {
    if (!todo.date) continue;
    if (!overdueByDate.has(todo.date)) overdueByDate.set(todo.date, []);
    overdueByDate.get(todo.date)!.push(todo);
  }
  const overdueDates = Array.from(overdueByDate.keys()).sort().reverse();

  // Group unscheduled by tag (follow tag sortOrder)
  const unscheduledByTag = new Map<string, { tag: Tag | null; todos: Todo[] }>();
  const unscheduledUntagged: Todo[] = [];
  for (const todo of unscheduledTodos) {
    if (todo.tags.length === 0) {
      unscheduledUntagged.push(todo);
    } else {
      const primaryTag = todo.tags[0];
      if (!unscheduledByTag.has(primaryTag.id)) {
        unscheduledByTag.set(primaryTag.id, { tag: primaryTag, todos: [] });
      }
      unscheduledByTag.get(primaryTag.id)!.todos.push(todo);
    }
  }
  // Sort tag groups by the tag's position in allTags
  const tagIdOrder = new Map(allTags.map((t, i) => [t.id, i]));
  const sortedUnscheduledGroups = Array.from(unscheduledByTag.values()).sort(
    (a, b) => (tagIdOrder.get(a.tag?.id ?? "") ?? 999) - (tagIdOrder.get(b.tag?.id ?? "") ?? 999),
  );

  function renderTodoGroup(todos: Todo[], maxItems: number = MAX_TODOS_PER_GROUP) {
    const visible = todos.slice(0, maxItems);
    const remaining = todos.length - visible.length;
    return (
      <>
        {visible.map((todo) => (
          <RightSidebarTodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
        ))}
        {remaining > 0 && (
          <div className="py-0.5 text-[10px] text-[var(--text-dim)]">
            还有 {remaining} 项...
          </div>
        )}
      </>
    );
  }

  return (
    <aside className="w-[260px] flex-shrink-0 overflow-y-auto border-l border-[var(--border-default)] bg-[var(--bg-sidebar-right)] p-5">
      {/* Upcoming */}
      <section className="mb-6">
        <button
          type="button"
          onClick={() => toggleSection("upcoming")}
          className="mb-3 flex w-full items-center justify-between text-left text-sm font-semibold"
        >
          <span>近期待办</span>
          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
            <ChevronDownIcon className={[
              "h-4 w-4 text-[var(--text-dim)] transition-transform duration-150 ease-out will-change-transform motion-reduce:transition-none",
              collapsed.upcoming ? "-rotate-90" : "rotate-0",
            ].join(" ")} />
          </span>
        </button>
        {collapsed.upcoming ? null : upcomingDates.length === 0 ? (
          <SectionCard>
            <p className="text-xs text-[var(--text-muted)]">暂无</p>
          </SectionCard>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingDates.map((date) => (
              <SectionCard key={date}>
                <Link
                  href={`/date/${date}`}
                  className="mb-2 block text-xs font-semibold text-[var(--accent-light)] hover:underline"
                >
                  {formatDate(date)}
                </Link>
                {renderTodoGroup(upcomingByDate.get(date) ?? [])}
              </SectionCard>
            ))}
          </div>
        )}
      </section>

      {/* Overdue */}
      <section className="mb-6">
        <button
          type="button"
          onClick={() => toggleSection("overdue")}
          className="mb-3 flex w-full items-center justify-between text-left text-sm font-semibold"
        >
          <span>已逾期</span>
          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
            <ChevronDownIcon className={[
              "h-4 w-4 text-[var(--text-dim)] transition-transform duration-150 ease-out will-change-transform motion-reduce:transition-none",
              collapsed.overdue ? "-rotate-90" : "rotate-0",
            ].join(" ")} />
          </span>
        </button>
        {collapsed.overdue ? null : overdueDates.length === 0 ? (
          <SectionCard danger>
            <p className="text-xs text-[var(--text-muted)]">无逾期项</p>
          </SectionCard>
        ) : (
          <div className="flex flex-col gap-3">
            {overdueDates.map((date) => (
              <SectionCard key={date} danger>
                <Link
                  href={`/date/${date}`}
                  className="mb-2 block text-xs font-semibold text-[var(--danger)] hover:underline"
                >
                  {formatDate(date)} · 逾期{daysOverdue(date)}天
                </Link>
                {renderTodoGroup(overdueByDate.get(date) ?? [])}
              </SectionCard>
            ))}
          </div>
        )}
      </section>

      {/* Unscheduled */}
      <section>
        <button
          type="button"
          onClick={() => toggleSection("unscheduled")}
          className="mb-3 flex w-full items-center justify-between text-left text-sm font-semibold"
        >
          <span>
            <Link href="/unscheduled" className="hover:underline" onClick={(event) => event.stopPropagation()}>
              未安排
            </Link>
            <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
              {unscheduledTodos.length} 项
            </span>
          </span>
          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
            <ChevronDownIcon className={[
              "h-4 w-4 text-[var(--text-dim)] transition-transform duration-150 ease-out will-change-transform motion-reduce:transition-none",
              collapsed.unscheduled ? "-rotate-90" : "rotate-0",
            ].join(" ")} />
          </span>
        </button>
        {collapsed.unscheduled ? null : unscheduledTodos.length === 0 ? (
          <SectionCard>
            <p className="text-xs text-[var(--text-muted)]">暂无</p>
          </SectionCard>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedUnscheduledGroups.map(({ tag, todos }) => (
              <SectionCard key={tag?.id ?? "untagged"}>
                <div
                  className="mb-2 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: tag?.color || "var(--text-muted)" }}
                >
                  {tag?.name ?? "未分类"}
                </div>
                {renderTodoGroup(todos)}
              </SectionCard>
            ))}
            {unscheduledUntagged.length > 0 && (
              <SectionCard>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  未分类
                </div>
                {renderTodoGroup(unscheduledUntagged)}
              </SectionCard>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
