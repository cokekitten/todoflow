"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { Calendar } from "@/components/calendar/calendar";
import { MonitorIcon, MoonIcon, SettingsIcon, SunIcon } from "@/components/icons/ui-icons";
import { TagList } from "@/components/sidebar/tag-list";
import { useTheme } from "@/lib/theme";

const THEME_CYCLE: ("dark" | "light" | "system")[] = ["dark", "light", "system"];
const THEME_ICONS: Record<string, typeof MoonIcon> = {
  dark: MoonIcon,
  light: SunIcon,
  system: MonitorIcon,
};
const THEME_LABELS: Record<string, string> = {
  dark: "深色",
  light: "浅色",
  system: "跟随系统",
};

export function LeftSidebar({ onClose }: { onClose?: () => void } = {}) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname && onClose) {
      onClose();
    }
    prevPathRef.current = pathname;
  }, [pathname, onClose]);
  const ThemeIcon = THEME_ICONS[theme];

  function cycleTheme() {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  }

  return (
    <aside className={["flex flex-shrink-0 flex-col gap-4 overflow-y-auto bg-[var(--bg-sidebar-left)] p-4", onClose ? "h-full w-full" : "w-[220px] border-r border-[var(--border-default)]"].join(" ")}>
      <div className="text-base font-bold tracking-tight">TodoFlow_</div>

      <Calendar />

      <div className="border-t border-[var(--border-default)]" />

      <TagList />

      <div className="mt-auto flex items-center justify-between">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
        >
          <SettingsIcon className="h-3.5 w-3.5" />
          设置
        </Link>
        <button
          type="button"
          onClick={cycleTheme}
          className="rounded p-1 text-xs text-[var(--text-dim)] hover:bg-[var(--border-default)] hover:text-[var(--text-secondary)]"
          title={`当前: ${THEME_LABELS[theme]}，点击切换`}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
