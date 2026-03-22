"use client";

import Link from "next/link";

import { Calendar } from "@/components/calendar/calendar";
import { TagList } from "@/components/sidebar/tag-list";
import { useTheme } from "@/lib/theme";

const THEME_CYCLE: ("dark" | "light" | "system")[] = ["dark", "light", "system"];
const THEME_ICONS: Record<string, string> = {
  dark: "🌙",
  light: "☀️",
  system: "💻",
};
const THEME_LABELS: Record<string, string> = {
  dark: "深色",
  light: "浅色",
  system: "跟随系统",
};

export function LeftSidebar() {
  const { theme, setTheme } = useTheme();

  function cycleTheme() {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  }

  return (
    <aside className="flex w-[220px] flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--border-default)] bg-[var(--bg-sidebar-left)] p-4">
      <div className="text-base font-bold tracking-tight">TodoFlow_</div>

      <Calendar />

      <div className="border-t border-[var(--border-default)]" />

      <TagList />

      <div className="mt-auto flex items-center justify-between">
        <Link
          href="/settings"
          className="text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
        >
          ⚙ 设置
        </Link>
        <button
          type="button"
          onClick={cycleTheme}
          className="rounded px-1.5 py-1 text-xs text-[var(--text-dim)] hover:bg-[var(--border-default)] hover:text-[var(--text-secondary)]"
          title={`当前: ${THEME_LABELS[theme]}，点击切换`}
        >
          {THEME_ICONS[theme]}
        </button>
      </div>
    </aside>
  );
}
