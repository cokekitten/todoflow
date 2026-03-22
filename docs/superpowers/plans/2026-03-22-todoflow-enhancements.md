# TodoFlow Enhancements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add light/dark/system theme switching, cursor-pointer fixes, tag editing (rename/color/delete via right-click menu), drag-and-drop sorting (tags + todos via dnd-kit), enhanced right sidebar with detailed todo lists, improved calendar navigation, and tag-view optimizations (hide tags, inline date picker).

**Architecture:** All changes are frontend-focused. Theme uses CSS variables + `data-theme` attribute on `<html>`. Drag-and-drop uses `@dnd-kit/core` + `@dnd-kit/sortable`. New API endpoint `PATCH /api/todos/reorder` for batch sort-order updates. The backend already supports all needed CRUD operations (todo date/sortOrder updates, tag name/color/sortOrder updates). A batch reorder endpoint is added for efficiency.

**Tech Stack:** @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (new deps). All other changes use existing stack.

---

## File Structure

```
src/
  app/
    globals.css                        # Modify: add light theme variables, cursor-pointer global rule
    layout.tsx                         # Modify: add ThemeProvider, inline script for flash prevention
  lib/
    theme.tsx                          # Create: ThemeProvider context + useTheme hook
    use-todo-actions.ts                # Modify: add handleDateChange action
  components/
    calendar/
      calendar.tsx                     # Modify: bigger nav buttons, clickable month/year pickers
      month-picker.tsx                 # Create: month grid popup (1-12)
      year-picker.tsx                  # Create: year selector popup
    sidebar/
      left-sidebar.tsx                 # Modify: add theme toggle button
      right-sidebar.tsx                # Rewrite: detailed todo lists grouped by date/tag
      right-sidebar-todo-item.tsx      # Create: compact todo row for right sidebar
      tag-list.tsx                     # Modify: add right-click context menu, dnd-kit sortable
      tag-context-menu.tsx             # Create: right-click menu (rename/color/delete)
      color-palette.tsx                # Create: preset color picker (12 colors)
    todo/
      todo-item.tsx                    # Modify: add drag handle, optional date picker, hide tags in tag-view
      todo-list.tsx                    # Modify: wrap items with dnd-kit sortable
      todo-date-picker.tsx             # Create: inline date picker popover for tag view
  app/
    (main)/
      tag/[tagId]/page.tsx             # Modify: pass hideTags + onDateChange props
    api/
      todos/
        reorder/route.ts              # Create: batch sort-order update endpoint
      tags/
        reorder/route.ts              # Create: batch tag sort-order update endpoint
```

---

## Chunk 1: Theme System + Global Cursor Fix

### Task 1: Install No New Dependencies (Theme uses CSS only)

No dependencies needed for this chunk.

- [ ] **Step 1: Verify current project builds**

```bash
cd /Users/cokekitten/dev/todoflow
npx tsc --noEmit
```

Expected: No type errors.

---

### Task 2: Add Light Theme CSS Variables + Global Cursor Fix

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update globals.css with theme system and cursor fix**

Replace the entire content of `/Users/cokekitten/dev/todoflow/src/app/globals.css` with:

```css
@import "tailwindcss";

/* Dark theme (default) */
:root,
[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --bg-sidebar-left: #111111;
  --bg-sidebar-right: #0f0f0f;
  --bg-card: #161616;
  --border-default: #222222;
  --accent: #7c3aed;
  --accent-light: #a78bfa;
  --text-primary: #eeeeee;
  --text-secondary: #aaaaaa;
  --text-muted: #666666;
  --text-dim: #555555;
  --danger: #f87171;
  --danger-bg: #1a1015;
  --danger-border: #3b1a2a;
  --success: #4ade80;
  color-scheme: dark;
}

/* Light theme */
[data-theme="light"] {
  --bg-primary: #f8f8f8;
  --bg-sidebar-left: #f0f0f0;
  --bg-sidebar-right: #f2f2f2;
  --bg-card: #ffffff;
  --border-default: #e0e0e0;
  --accent: #7c3aed;
  --accent-light: #6d28d9;
  --text-primary: #1a1a1a;
  --text-secondary: #555555;
  --text-muted: #888888;
  --text-dim: #aaaaaa;
  --danger: #dc2626;
  --danger-bg: #fef2f2;
  --danger-border: #fecaca;
  --success: #16a34a;
  color-scheme: light;
}

/* System theme: follows prefers-color-scheme */
[data-theme="system"] {
  --bg-primary: #0a0a0a;
  --bg-sidebar-left: #111111;
  --bg-sidebar-right: #0f0f0f;
  --bg-card: #161616;
  --border-default: #222222;
  --accent: #7c3aed;
  --accent-light: #a78bfa;
  --text-primary: #eeeeee;
  --text-secondary: #aaaaaa;
  --text-muted: #666666;
  --text-dim: #555555;
  --danger: #f87171;
  --danger-bg: #1a1015;
  --danger-border: #3b1a2a;
  --success: #4ade80;
  color-scheme: dark;
}

@media (prefers-color-scheme: light) {
  [data-theme="system"] {
    --bg-primary: #f8f8f8;
    --bg-sidebar-left: #f0f0f0;
    --bg-sidebar-right: #f2f2f2;
    --bg-card: #ffffff;
    --border-default: #e0e0e0;
    --accent: #7c3aed;
    --accent-light: #6d28d9;
    --text-primary: #1a1a1a;
    --text-secondary: #555555;
    --text-muted: #888888;
    --text-dim: #aaaaaa;
    --danger: #dc2626;
    --danger-bg: #fef2f2;
    --danger-border: #fecaca;
    --success: #16a34a;
    color-scheme: light;
  }
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Global cursor fix for all interactive elements */
button,
a,
[role="button"],
select,
summary,
input[type="checkbox"],
input[type="radio"],
input[type="submit"],
input[type="button"],
input[type="reset"],
label[for] {
  cursor: pointer;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors (CSS-only change).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add light theme CSS variables and global cursor-pointer fix"
```

---

### Task 3: Create Theme Provider

**Files:**
- Create: `src/lib/theme.tsx`

- [ ] **Step 1: Create ThemeProvider context and hook**

Create `/Users/cokekitten/dev/todoflow/src/lib/theme.tsx`:

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => undefined,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && ["dark", "light", "system"].includes(saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme.tsx
git commit -m "feat: add ThemeProvider context with localStorage persistence"
```

---

### Task 4: Wire ThemeProvider into Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout with ThemeProvider and flash-prevention script**

Replace `/Users/cokekitten/dev/todoflow/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";

import { ThemeProvider } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  title: "TodoFlow",
  description: "Personal todo list with Telegram reminders",
};

// Inline script to prevent flash of wrong theme on load
const themeScript = `
(function() {
  var t = localStorage.getItem('theme') || 'system';
  document.documentElement.setAttribute('data-theme', t);
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-theme="system" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wire ThemeProvider into root layout with flash prevention"
```

---

### Task 5: Add Theme Toggle to Left Sidebar

**Files:**
- Modify: `src/components/sidebar/left-sidebar.tsx`

- [ ] **Step 1: Update left sidebar with theme toggle**

Replace `/Users/cokekitten/dev/todoflow/src/components/sidebar/left-sidebar.tsx`:

```tsx
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
```

> **Note:** This changes left-sidebar from a server component to a client component because it needs `useTheme`. This is acceptable since the children (Calendar, TagList) are already client components.

- [ ] **Step 2: Verify TypeScript compiles and dev server works**

```bash
npx tsc --noEmit
```

Expected: No type errors. The sidebar should show a theme toggle button next to the settings link.

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/left-sidebar.tsx
git commit -m "feat: add theme toggle button to left sidebar"
```

---

## Chunk 2: Calendar Navigation Enhancement

### Task 6: Improve Calendar Navigation Buttons + Month/Year Quick Pickers

**Files:**
- Modify: `src/components/calendar/calendar.tsx`
- Create: `src/components/calendar/month-picker.tsx`
- Create: `src/components/calendar/year-picker.tsx`

- [ ] **Step 1: Create month picker component**

Create `/Users/cokekitten/dev/todoflow/src/components/calendar/month-picker.tsx`:

```tsx
"use client";

interface MonthPickerProps {
  currentMonth: number; // 0-indexed
  onSelect: (month: number) => void;
  onClose: () => void;
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function MonthPicker({ currentMonth, onSelect, onClose }: MonthPickerProps) {
  return (
    <div className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-2 shadow-lg">
      <div className="grid grid-cols-4 gap-1">
        {MONTHS.map((label, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              onSelect(index);
              onClose();
            }}
            className={[
              "rounded px-2 py-1.5 text-xs transition-colors",
              index === currentMonth
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--border-default)]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create year picker component**

Create `/Users/cokekitten/dev/todoflow/src/components/calendar/year-picker.tsx`:

```tsx
"use client";

interface YearPickerProps {
  currentYear: number;
  onSelect: (year: number) => void;
  onClose: () => void;
}

export function YearPicker({ currentYear, onSelect, onClose }: YearPickerProps) {
  const startYear = currentYear - 4;
  const years = Array.from({ length: 9 }, (_, i) => startYear + i);

  return (
    <div className="absolute left-0 top-full z-20 mt-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-2 shadow-lg">
      <div className="grid grid-cols-3 gap-1">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => {
              onSelect(year);
              onClose();
            }}
            className={[
              "rounded px-2 py-1.5 text-xs transition-colors",
              year === currentYear
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--border-default)]",
            ].join(" ")}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update calendar component with bigger nav buttons and clickable month/year**

Replace `/Users/cokekitten/dev/todoflow/src/components/calendar/calendar.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { TODOS_CHANGED_EVENT } from "@/lib/todo-events";
import { MonthPicker } from "./month-picker";
import { YearPicker } from "./year-picker";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

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
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const yearMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const days = getMonthDays(year, month);

  const refreshDatesWithTodos = useCallback(() => {
    fetch(`/api/todos?calendarMonth=${yearMonth}`)
      .then((response) => response.json())
      .then((dates: string[]) => setDatesWithTodos(new Set(dates)))
      .catch(() => undefined);
  }, [yearMonth]);

  useEffect(() => {
    refreshDatesWithTodos();
    function handleTodosChanged() { refreshDatesWithTodos(); }
    window.addEventListener(TODOS_CHANGED_EVENT, handleTodosChanged);
    return () => { window.removeEventListener(TODOS_CHANGED_EVENT, handleTodosChanged); };
  }, [refreshDatesWithTodos]);

  // Close pickers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToPreviousMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); return; }
    setMonth(month - 1);
  }

  function goToNextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); return; }
    setMonth(month + 1);
  }

  function goToToday() {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    router.push(`/date/${today}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between" ref={headerRef}>
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
            className="rounded px-1 py-0.5 text-sm font-semibold text-[var(--accent-light)] hover:bg-[var(--border-default)]"
          >
            {month + 1}月
          </button>
          <button
            type="button"
            onClick={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
            className="rounded px-1 py-0.5 text-sm font-semibold text-[var(--accent-light)] hover:bg-[var(--border-default)]"
          >
            {year}
          </button>
          {showMonthPicker && (
            <MonthPicker
              currentMonth={month}
              onSelect={(m) => setMonth(m)}
              onClose={() => setShowMonthPicker(false)}
            />
          )}
          {showYearPicker && (
            <YearPicker
              currentYear={year}
              onSelect={(y) => setYear(y)}
              onClose={() => setShowYearPicker(false)}
            />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="flex h-7 w-7 items-center justify-center rounded text-sm text-[var(--text-muted)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded px-2 py-1 text-xs text-[var(--accent-light)] hover:bg-[var(--border-default)]"
          >
            今天
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="flex h-7 w-7 items-center justify-center rounded text-sm text-[var(--text-muted)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-[var(--text-dim)]">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">{label}</div>
        ))}
      </div>

      {/* Days grid */}
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
```

Key changes from current:
- Month/year text is now clickable buttons that toggle MonthPicker/YearPicker popups
- Prev/next month buttons have `h-7 w-7` (28px) minimum click area with hover background
- "今天" button also has larger click area with hover background
- Click-outside handler to dismiss pickers

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/
git commit -m "feat: improve calendar navigation with bigger buttons and month/year pickers"
```

---

## Chunk 3: Tag Editing — Context Menu, Rename, Color, Delete

### Task 7: Create Color Palette Component

**Files:**
- Create: `src/components/sidebar/color-palette.tsx`

- [ ] **Step 1: Create color palette component**

Create `/Users/cokekitten/dev/todoflow/src/components/sidebar/color-palette.tsx`:

```tsx
"use client";

const PRESET_COLORS = [
  "#7c3aed", // purple
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#84cc16", // lime
  "#eab308", // yellow
  "#f97316", // orange
  "#ef4444", // red
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#6b7280", // gray
  "#a16207", // amber-dark/brown
];

interface ColorPaletteProps {
  currentColor: string | null;
  onSelect: (color: string) => void;
}

export function ColorPalette({ currentColor, onSelect }: ColorPaletteProps) {
  return (
    <div className="grid grid-cols-6 gap-1.5 p-1">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className={[
            "h-5 w-5 rounded-full transition-transform hover:scale-125",
            currentColor === color ? "ring-2 ring-white ring-offset-1 ring-offset-[var(--bg-card)]" : "",
          ].join(" ")}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sidebar/color-palette.tsx
git commit -m "feat: add preset color palette component"
```

---

### Task 8: Create Tag Context Menu Component

**Files:**
- Create: `src/components/sidebar/tag-context-menu.tsx`

- [ ] **Step 1: Create tag context menu**

Create `/Users/cokekitten/dev/todoflow/src/components/sidebar/tag-context-menu.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

import type { Tag } from "@/types";
import { ColorPalette } from "./color-palette";

interface TagContextMenuProps {
  tag: Tag;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}

export function TagContextMenu({
  tag,
  position,
  onClose,
  onRename,
  onChangeColor,
  onDelete,
}: TagContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"menu" | "rename" | "color">("menu");
  const [renameValue, setRenameValue] = useState(tag.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus input when entering rename mode
  useEffect(() => {
    if (mode === "rename") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [mode]);

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== tag.name) {
      onRename(tag.id, trimmed);
    }
    onClose();
  }

  function handleColorSelect(color: string) {
    onChangeColor(tag.id, color);
    onClose();
  }

  function handleDelete() {
    if (window.confirm(`确定删除标签「${tag.name}」吗？相关待办不会被删除。`)) {
      onDelete(tag.id);
    }
    onClose();
  }

  // Adjust position to stay within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: position.x,
    top: position.y,
    zIndex: 50,
  };

  return (
    <div ref={menuRef} style={style}>
      <div className="min-w-[160px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-1 shadow-xl">
        {mode === "menu" && (
          <>
            <button
              type="button"
              onClick={() => setMode("rename")}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
            >
              ✏️ 重命名
            </button>
            <button
              type="button"
              onClick={() => setMode("color")}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
            >
              🎨 更改颜色
            </button>
            <div className="my-1 border-t border-[var(--border-default)]" />
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger-bg)]"
            >
              🗑️ 删除
            </button>
          </>
        )}

        {mode === "rename" && (
          <div className="px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") onClose();
              }}
              className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xs focus:border-[var(--accent)] focus:outline-none"
            />
            <div className="mt-2 flex justify-end gap-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded px-2 py-1 text-[10px] text-[var(--text-muted)] hover:bg-[var(--border-default)]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleRenameSubmit}
                className="rounded bg-[var(--accent)] px-2 py-1 text-[10px] text-white hover:opacity-90"
              >
                确定
              </button>
            </div>
          </div>
        )}

        {mode === "color" && (
          <div className="px-3 py-2">
            <div className="mb-2 text-[10px] text-[var(--text-muted)]">选择颜色</div>
            <ColorPalette currentColor={tag.color} onSelect={handleColorSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/tag-context-menu.tsx
git commit -m "feat: add tag context menu with rename, color, and delete options"
```

---

### Task 9: Wire Context Menu into Tag List

**Files:**
- Modify: `src/components/sidebar/tag-list.tsx`

- [ ] **Step 1: Update tag list with context menu support**

Replace `/Users/cokekitten/dev/todoflow/src/components/sidebar/tag-list.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { Tag } from "@/types";
import { TagContextMenu } from "./tag-context-menu";

interface ContextMenuState {
  tag: Tag;
  x: number;
  y: number;
}

export function TagList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const activeTagId = pathname.startsWith("/tag/") ? pathname.slice(5) : null;

  useEffect(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((data: Tag[]) => setTags(data))
      .catch(() => undefined);
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!response.ok) return;
    const tag = (await response.json()) as Tag;
    setTags((current) => [...current, tag]);
    setNewName("");
    setIsCreating(false);
  }

  async function handleRename(id: string, name: string) {
    const response = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as Tag;
    setTags((current) => current.map((t) => (t.id === id ? updated : t)));
  }

  async function handleChangeColor(id: string, color: string) {
    const response = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as Tag;
    setTags((current) => current.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setTags((current) => current.filter((t) => t.id !== id));
    // If we're on the deleted tag's page, navigate away
    if (activeTagId === id) {
      router.push(`/date/${new Date().toISOString().split("T")[0]}`);
    }
  }

  function handleContextMenu(event: React.MouseEvent, tag: Tag) {
    event.preventDefault();
    setContextMenu({ tag, x: event.clientX, y: event.clientY });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">标签</span>
        <button
          type="button"
          onClick={() => setIsCreating((value) => !value)}
          className="text-sm text-[var(--text-dim)] hover:text-[var(--text-primary)]"
        >
          +
        </button>
      </div>

      {isCreating ? (
        <div className="mb-2">
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreate();
              if (event.key === "Escape") setIsCreating(false);
            }}
            placeholder="标签名称"
            autoFocus
            className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xs focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => router.push(`/tag/${tag.id}`)}
            onContextMenu={(e) => handleContextMenu(e, tag)}
            className={[
              "rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
              activeTagId === tag.id
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--border-default)]",
            ].join(" ")}
          >
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: tag.color || "#7c3aed" }}
            />
            {tag.name}
          </button>
        ))}
      </div>

      {contextMenu && (
        <TagContextMenu
          tag={contextMenu.tag}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onChangeColor={handleChangeColor}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
```

Key changes:
- Added `onContextMenu` handler to each tag button
- Added state for context menu (tag + position)
- Added `handleRename`, `handleChangeColor`, `handleDelete` functions that call existing API endpoints
- Renders `TagContextMenu` as a portal-like fixed-position overlay when context menu is active
- On delete of active tag, navigates back to today

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/tag-list.tsx src/components/sidebar/tag-context-menu.tsx src/components/sidebar/color-palette.tsx
git commit -m "feat: add tag editing via right-click context menu (rename, color, delete)"
```

---

## Chunk 4: Drag-and-Drop Sorting (Tags + Todos)

### Task 10: Install dnd-kit Dependencies

- [ ] **Step 1: Install @dnd-kit packages**

```bash
cd /Users/cokekitten/dev/todoflow
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: Packages install successfully.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities"
```

---

### Task 11: Create Batch Reorder API Endpoints

**Files:**
- Create: `src/app/api/tags/reorder/route.ts`
- Create: `src/app/api/todos/reorder/route.ts`

- [ ] **Step 1: Create tag reorder endpoint**

Create `/Users/cokekitten/dev/todoflow/src/app/api/tags/reorder/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

import { updateTag } from "@/server/tags";

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { ids: string[] };

  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  for (let i = 0; i < body.ids.length; i++) {
    updateTag(body.ids[i], { sortOrder: i });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create todo reorder endpoint**

Create `/Users/cokekitten/dev/todoflow/src/app/api/todos/reorder/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

import { updateTodo } from "@/server/todos";

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { ids: string[] };

  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  for (let i = 0; i < body.ids.length; i++) {
    updateTodo(body.ids[i], { sortOrder: i });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/tags/reorder/ src/app/api/todos/reorder/
git commit -m "feat: add batch reorder API endpoints for tags and todos"
```

---

### Task 12: Add Drag-and-Drop to Tag List

**Files:**
- Modify: `src/components/sidebar/tag-list.tsx`

- [ ] **Step 1: Update tag list with dnd-kit sortable**

Replace `/Users/cokekitten/dev/todoflow/src/components/sidebar/tag-list.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Tag } from "@/types";
import { TagContextMenu } from "./tag-context-menu";

interface ContextMenuState {
  tag: Tag;
  x: number;
  y: number;
}

function SortableTagItem({
  tag,
  isActive,
  onClick,
  onContextMenu,
}: {
  tag: Tag;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tag.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="mr-1 flex h-6 w-4 flex-shrink-0 items-center justify-center text-[10px] text-[var(--text-dim)] opacity-0 transition-opacity group-hover/taglist:opacity-100 hover:text-[var(--text-secondary)]"
        title="拖拽排序"
      >
        ⠿
      </span>
      <button
        type="button"
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={[
          "flex-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
          isActive
            ? "bg-[var(--accent)] text-white"
            : "text-[var(--text-secondary)] hover:bg-[var(--border-default)]",
        ].join(" ")}
      >
        <span
          className="mr-2 inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: tag.color || "#7c3aed" }}
        />
        {tag.name}
      </button>
    </div>
  );
}

export function TagList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const activeTagId = pathname.startsWith("/tag/") ? pathname.slice(5) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((data: Tag[]) => setTags(data))
      .catch(() => undefined);
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!response.ok) return;
    const tag = (await response.json()) as Tag;
    setTags((current) => [...current, tag]);
    setNewName("");
    setIsCreating(false);
  }

  async function handleRename(id: string, name: string) {
    const response = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as Tag;
    setTags((current) => current.map((t) => (t.id === id ? updated : t)));
  }

  async function handleChangeColor(id: string, color: string) {
    const response = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as Tag;
    setTags((current) => current.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setTags((current) => current.filter((t) => t.id !== id));
    if (activeTagId === id) {
      router.push(`/date/${new Date().toISOString().split("T")[0]}`);
    }
  }

  function handleContextMenu(event: React.MouseEvent, tag: Tag) {
    event.preventDefault();
    setContextMenu({ tag, x: event.clientX, y: event.clientY });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tags.findIndex((t) => t.id === active.id);
    const newIndex = tags.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tags, oldIndex, newIndex);
    setTags(reordered);

    // Persist to server
    await fetch("/api/tags/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((t) => t.id) }),
    });
  }

  return (
    <div className="group/taglist">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">标签</span>
        <button
          type="button"
          onClick={() => setIsCreating((value) => !value)}
          className="text-sm text-[var(--text-dim)] hover:text-[var(--text-primary)]"
        >
          +
        </button>
      </div>

      {isCreating ? (
        <div className="mb-2">
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreate();
              if (event.key === "Escape") setIsCreating(false);
            }}
            placeholder="标签名称"
            autoFocus
            className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xs focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tags.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {tags.map((tag) => (
              <SortableTagItem
                key={tag.id}
                tag={tag}
                isActive={activeTagId === tag.id}
                onClick={() => router.push(`/tag/${tag.id}`)}
                onContextMenu={(e) => handleContextMenu(e, tag)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {contextMenu && (
        <TagContextMenu
          tag={contextMenu.tag}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onChangeColor={handleChangeColor}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
```

Key changes from Task 9 version:
- Added `DndContext` + `SortableContext` wrapping the tag list
- Each tag is now a `SortableTagItem` with a drag handle (`⠿` grip icon)
- Drag handle only shows on hover of the tag list area (`group/taglist`)
- `handleDragEnd` reorders local state optimistically, then calls `/api/tags/reorder`
- `PointerSensor` with 5px distance activation to avoid accidental drags on click

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/tag-list.tsx
git commit -m "feat: add drag-and-drop sorting to tag list"
```

---

### Task 13: Add Drag-and-Drop to Todo List

**Files:**
- Modify: `src/components/todo/todo-item.tsx`
- Modify: `src/components/todo/todo-list.tsx`

- [ ] **Step 1: Update todo-item with drag handle and new props**

Replace `/Users/cokekitten/dev/todoflow/src/components/todo/todo-item.tsx`:

```tsx
"use client";

import { forwardRef, useState } from "react";

import type { Todo } from "@/types";

export interface TodoItemProps {
  todo: Todo;
  showDate?: boolean;
  hideTags?: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDateChange?: (id: string, date: string | null) => void;
  dragHandleProps?: Record<string, unknown>;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

export const TodoItem = forwardRef<HTMLDivElement, TodoItemProps>(function TodoItem(
  { todo, showDate, hideTags, onToggle, onDelete, onUpdate, onDateChange, dragHandleProps, style, isDragging },
  ref,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showDateInput, setShowDateInput] = useState(false);
  const isCompleted = todo.completed === 1;

  function handleSave() {
    if (editTitle.trim() && editTitle.trim() !== todo.title) {
      onUpdate(todo.id, editTitle.trim());
    }
    setIsEditing(false);
  }

  function handleDateSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value || null;
    onDateChange?.(todo.id, newDate);
    setShowDateInput(false);
  }

  return (
    <div
      ref={ref}
      style={style}
      className={[
        "group flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2.5 transition-colors hover:border-[var(--accent)]/30",
        isDragging ? "shadow-lg opacity-80" : "",
      ].join(" ")}
    >
      {/* Drag handle */}
      {dragHandleProps && (
        <span
          {...dragHandleProps}
          className="flex h-5 w-4 flex-shrink-0 items-center justify-center text-[10px] text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--text-secondary)]"
          title="拖拽排序"
        >
          ⠿
        </span>
      )}

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(todo.id, !isCompleted)}
        className={[
          "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
          isCompleted
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--text-dim)] hover:border-[var(--accent)]",
        ].join(" ")}
      >
        {isCompleted ? <span className="text-[10px]">✓</span> : null}
      </button>

      {/* Title */}
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(event) => setEditTitle(event.target.value)}
          onBlur={handleSave}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSave();
            if (event.key === "Escape") { setEditTitle(todo.title); setIsEditing(false); }
          }}
          autoFocus
          className="flex-1 bg-transparent text-[13px] focus:outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setIsEditing(true)}
          className={[
            "flex-1 cursor-default text-[13px]",
            isCompleted ? "text-[var(--text-muted)] line-through" : "",
          ].join(" ")}
        >
          {todo.title}
        </span>
      )}

      {/* Date display / picker for tag view */}
      {showDate && onDateChange && (
        <div className="relative">
          {showDateInput ? (
            <input
              type="date"
              defaultValue={todo.date || ""}
              onChange={handleDateSelect}
              onBlur={() => setShowDateInput(false)}
              autoFocus
              className="rounded bg-[var(--bg-primary)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowDateInput(true)}
              className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
            >
              {todo.date || "设置日期"}
            </button>
          )}
        </div>
      )}

      {/* Date badge (read-only, for non-tag views that just show date) */}
      {showDate && !onDateChange && todo.date ? (
        <span className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] text-[var(--text-dim)]">
          {todo.date}
        </span>
      ) : null}

      {/* Tag badges (hidden in tag view) */}
      {!hideTags &&
        todo.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded px-2 py-0.5 text-[10px]"
            style={{
              backgroundColor: `${tag.color || "#7c3aed"}20`,
              color: tag.color || "#7c3aed",
            }}
          >
            {tag.name}
          </span>
        ))}

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        className="text-xs text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--danger)]"
      >
        ✕
      </button>
    </div>
  );
});
```

Key changes:
- Converted to `forwardRef` to support dnd-kit ref passing
- Added `dragHandleProps` for the grip handle (only renders if provided)
- Added `hideTags` prop to suppress tag badges in tag view
- Added `onDateChange` prop + inline date picker for tag view
- When `showDate && onDateChange`, clicking the date area opens a native date input
- Added `style` and `isDragging` props for dnd-kit visual feedback

- [ ] **Step 2: Update todo-list with dnd-kit sortable wrapper**

Replace `/Users/cokekitten/dev/todoflow/src/components/todo/todo-list.tsx`:

```tsx
"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { Tag, Todo } from "@/types";
import { TodoItem, type TodoItemProps } from "./todo-item";

interface TodoListProps {
  todos: Todo[];
  groupByTag?: boolean;
  showDate?: boolean;
  hideTags?: boolean;
  enableDragSort?: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDateChange?: (id: string, date: string | null) => void;
  onReorder?: (ids: string[]) => void;
}

function SortableTodoItem(
  props: Omit<TodoItemProps, "dragHandleProps" | "style" | "isDragging"> & { id: string },
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TodoItem
      ref={setNodeRef}
      {...props}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

export function TodoList({
  todos,
  groupByTag = false,
  showDate = false,
  hideTags = false,
  enableDragSort = false,
  onToggle,
  onDelete,
  onUpdate,
  onDateChange,
  onReorder,
}: TodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  if (todos.length === 0) {
    return <div className="py-12 text-center text-sm text-[var(--text-muted)]">暂无待办事项</div>;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);
    onReorder?.(reordered.map((t) => t.id));
  }

  const itemProps = {
    showDate,
    hideTags,
    onToggle,
    onDelete,
    onUpdate,
    onDateChange,
  };

  // Flat list mode (no grouping)
  if (!groupByTag) {
    if (enableDragSort) {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              {todos.map((todo) => (
                <SortableTodoItem key={todo.id} id={todo.id} todo={todo} {...itemProps} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      );
    }

    return (
      <div className="flex flex-col gap-1.5">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} {...itemProps} />
        ))}
      </div>
    );
  }

  // Grouped by tag mode
  const grouped = new Map<string, { tag: Tag | null; todos: Todo[] }>();
  const ungrouped: Todo[] = [];

  for (const todo of todos) {
    if (todo.tags.length === 0) {
      ungrouped.push(todo);
      continue;
    }
    const primaryTag = todo.tags[0];
    if (!grouped.has(primaryTag.id)) {
      grouped.set(primaryTag.id, { tag: primaryTag, todos: [] });
    }
    grouped.get(primaryTag.id)?.todos.push(todo);
  }

  // When groupByTag, drag-sort is within groups (not across groups for simplicity)
  // We use a single DndContext; the SortableContext per-group ensures items stay in their group.
  function renderGroup(groupTodos: Todo[], key: string) {
    if (enableDragSort) {
      return (
        <SortableContext items={groupTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {groupTodos.map((todo) => (
              <SortableTodoItem key={todo.id} id={todo.id} todo={todo} {...itemProps} />
            ))}
          </div>
        </SortableContext>
      );
    }
    return (
      <div className="flex flex-col gap-1.5">
        {groupTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} {...itemProps} />
        ))}
      </div>
    );
  }

  const content = (
    <div className="flex flex-col gap-5">
      {Array.from(grouped.values()).map(({ tag, todos: groupTodos }) => (
        <div key={tag?.id ?? "ungrouped"}>
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: tag?.color || "var(--accent-light)" }}
          >
            {tag?.name}
          </div>
          {renderGroup(groupTodos, tag?.id ?? "ungrouped")}
        </div>
      ))}

      {ungrouped.length > 0 ? (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            未分类
          </div>
          {renderGroup(ungrouped, "uncategorized")}
        </div>
      ) : null}
    </div>
  );

  if (enableDragSort) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {content}
      </DndContext>
    );
  }

  return content;
}
```

Key changes:
- Added `enableDragSort`, `hideTags`, `onDateChange`, `onReorder` props
- When `enableDragSort=true`, wraps items in `DndContext` + `SortableContext`
- Uses `SortableTodoItem` wrapper that passes drag handle props to `TodoItem`
- `handleDragEnd` calls `onReorder` with the new ID order
- In grouped mode, each group gets its own `SortableContext`

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/todo/todo-item.tsx src/components/todo/todo-list.tsx
git commit -m "feat: add drag-and-drop sorting to todo list and todo item"
```

---

### Task 14: Wire Drag-Sort and New Props into View Pages

**Files:**
- Modify: `src/lib/use-todo-actions.ts`
- Modify: `src/app/(main)/date/[date]/page.tsx`
- Modify: `src/app/(main)/tag/[tagId]/page.tsx`
- Modify: `src/app/(main)/unscheduled/page.tsx`

- [ ] **Step 1: Add handleDateChange and handleReorder to useTodoActions**

Replace `/Users/cokekitten/dev/todoflow/src/lib/use-todo-actions.ts`:

```typescript
"use client";

import { useCallback } from "react";

import { notifyTodosChanged } from "./todo-events";

export function useTodoActions(onMutate: () => void) {
  const handleToggle = useCallback(
    async (id: string, completed: boolean) => {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      notifyTodosChanged();
      onMutate();
    },
    [onMutate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      notifyTodosChanged();
      onMutate();
    },
    [onMutate],
  );

  const handleUpdate = useCallback(
    async (id: string, title: string) => {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      notifyTodosChanged();
      onMutate();
    },
    [onMutate],
  );

  const handleDateChange = useCallback(
    async (id: string, date: string | null) => {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      notifyTodosChanged();
      onMutate();
    },
    [onMutate],
  );

  const handleReorder = useCallback(
    async (ids: string[]) => {
      await fetch("/api/todos/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      // Don't call onMutate here — the parent already updated local state optimistically
      notifyTodosChanged();
    },
    [],
  );

  return { handleToggle, handleDelete, handleUpdate, handleDateChange, handleReorder };
}
```

- [ ] **Step 2: Update date view page**

Replace `/Users/cokekitten/dev/todoflow/src/app/(main)/date/[date]/page.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { TodoCreate } from "@/components/todo/todo-create";
import { TodoList } from "@/components/todo/todo-list";
import { useTodoActions } from "@/lib/use-todo-actions";
import type { Todo } from "@/types";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function DatePage() {
  const params = useParams<{ date: string }>();
  const date = params.date;
  const [todos, setTodos] = useState<Todo[]>([]);
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;
  const currentDate = new Date(`${date}T00:00:00`);
  const dateLabel = `${currentDate.getMonth() + 1}月${currentDate.getDate()}日 ${WEEKDAYS[currentDate.getDay()]}`;

  const fetchTodos = useCallback(() => {
    fetch(`/api/todos?date=${date}`)
      .then((response) => response.json())
      .then((data: Todo[]) => setTodos(data))
      .catch(() => undefined);
  }, [date]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const { handleToggle, handleDelete, handleUpdate, handleReorder } = useTodoActions(fetchTodos);
  const pendingCount = todos.filter((todo) => todo.completed === 0).length;

  function onReorder(ids: string[]) {
    // Optimistic update
    const idIndexMap = new Map(ids.map((id, i) => [id, i]));
    setTodos((prev) => [...prev].sort((a, b) => (idIndexMap.get(a.id) ?? 0) - (idIndexMap.get(b.id) ?? 0)));
    void handleReorder(ids);
  }

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold">{dateLabel}</h1>
          <span className="text-xs text-[var(--text-muted)]">
            {isToday ? "今天 · " : ""}{pendingCount} 项待办
          </span>
        </div>
      </div>
      <TodoCreate date={date} onCreated={fetchTodos} />
      <TodoList
        todos={todos}
        groupByTag
        enableDragSort
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onReorder={onReorder}
      />
    </div>
  );
}
```

- [ ] **Step 3: Update tag view page**

Replace `/Users/cokekitten/dev/todoflow/src/app/(main)/tag/[tagId]/page.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { TodoCreate } from "@/components/todo/todo-create";
import { TodoList } from "@/components/todo/todo-list";
import { useTodoActions } from "@/lib/use-todo-actions";
import type { Tag, Todo } from "@/types";

export default function TagPage() {
  const params = useParams<{ tagId: string }>();
  const tagId = params.tagId;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tagInfo, setTagInfo] = useState<Tag | null>(null);

  const fetchTodos = useCallback(() => {
    fetch(`/api/todos?tagId=${tagId}`)
      .then((response) => response.json())
      .then((data: Todo[]) => setTodos(data))
      .catch(() => undefined);
  }, [tagId]);

  useEffect(() => {
    fetchTodos();
    fetch("/api/tags")
      .then((response) => response.json())
      .then((tags: Tag[]) => {
        const found = tags.find((tag) => tag.id === tagId) || null;
        setTagInfo(found);
      })
      .catch(() => undefined);
  }, [fetchTodos, tagId]);

  const { handleToggle, handleDelete, handleUpdate, handleDateChange, handleReorder } =
    useTodoActions(fetchTodos);
  const pendingCount = todos.filter((todo) => todo.completed === 0).length;

  function onReorder(ids: string[]) {
    const idIndexMap = new Map(ids.map((id, i) => [id, i]));
    setTodos((prev) => [...prev].sort((a, b) => (idIndexMap.get(a.id) ?? 0) - (idIndexMap.get(b.id) ?? 0)));
    void handleReorder(ids);
  }

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {tagInfo ? (
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: tagInfo.color || "#7c3aed" }}
              />
            ) : null}
            {tagInfo?.name || "标签"}
          </h1>
          <span className="text-xs text-[var(--text-muted)]">{pendingCount} 项待办</span>
        </div>
      </div>
      <TodoCreate defaultTagId={tagId} onCreated={fetchTodos} />
      <TodoList
        todos={todos}
        showDate
        hideTags
        enableDragSort
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onDateChange={handleDateChange}
        onReorder={onReorder}
      />
    </div>
  );
}
```

Key changes from current:
- Added `hideTags` to hide tag badges (already in tag context)
- Added `onDateChange={handleDateChange}` to enable inline date editing
- Added `enableDragSort` and `onReorder`

- [ ] **Step 4: Update unscheduled view page**

Replace `/Users/cokekitten/dev/todoflow/src/app/(main)/unscheduled/page.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";

import { TodoCreate } from "@/components/todo/todo-create";
import { TodoList } from "@/components/todo/todo-list";
import { useTodoActions } from "@/lib/use-todo-actions";
import type { Todo } from "@/types";

export default function UnscheduledPage() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const fetchTodos = useCallback(() => {
    fetch("/api/todos?unscheduled=true")
      .then((response) => response.json())
      .then((data: Todo[]) => setTodos(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const { handleToggle, handleDelete, handleUpdate, handleReorder } = useTodoActions(fetchTodos);

  function onReorder(ids: string[]) {
    const idIndexMap = new Map(ids.map((id, i) => [id, i]));
    setTodos((prev) => [...prev].sort((a, b) => (idIndexMap.get(a.id) ?? 0) - (idIndexMap.get(b.id) ?? 0)));
    void handleReorder(ids);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">未安排</h1>
        <span className="text-xs text-[var(--text-muted)]">
          {todos.length} 项无日期待办
        </span>
      </div>
      <TodoCreate onCreated={fetchTodos} />
      <TodoList
        todos={todos}
        groupByTag
        enableDragSort
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onReorder={onReorder}
      />
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/use-todo-actions.ts src/app/\(main\)/date/ src/app/\(main\)/tag/ src/app/\(main\)/unscheduled/
git commit -m "feat: wire drag-sort, date change, and new props into all view pages"
```

---

## Chunk 5: Enhanced Right Sidebar

### Task 15: Create Compact Right Sidebar Todo Item

**Files:**
- Create: `src/components/sidebar/right-sidebar-todo-item.tsx`

- [ ] **Step 1: Create compact todo item for right sidebar**

Create `/Users/cokekitten/dev/todoflow/src/components/sidebar/right-sidebar-todo-item.tsx`:

```tsx
"use client";

import type { Todo } from "@/types";

interface RightSidebarTodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
}

export function RightSidebarTodoItem({ todo, onToggle }: RightSidebarTodoItemProps) {
  const isCompleted = todo.completed === 1;

  return (
    <div className="flex items-center gap-2 py-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(todo.id, !isCompleted);
        }}
        className={[
          "flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
          isCompleted
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--text-dim)] hover:border-[var(--accent)]",
        ].join(" ")}
      >
        {isCompleted ? <span className="text-[8px]">✓</span> : null}
      </button>
      <span
        className={[
          "flex-1 truncate text-[11px]",
          isCompleted ? "text-[var(--text-muted)] line-through" : "text-[var(--text-secondary)]",
        ].join(" ")}
      >
        {todo.title}
      </span>
      {/* Show tag dots (compact) */}
      {todo.tags.slice(0, 2).map((tag) => (
        <span
          key={tag.id}
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: tag.color || "#7c3aed" }}
          title={tag.name}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sidebar/right-sidebar-todo-item.tsx
git commit -m "feat: add compact todo item component for right sidebar"
```

---

### Task 16: Rewrite Right Sidebar with Detailed Todo Lists

**Files:**
- Modify: `src/components/sidebar/right-sidebar.tsx`

- [ ] **Step 1: Rewrite right sidebar**

Replace `/Users/cokekitten/dev/todoflow/src/components/sidebar/right-sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { TODOS_CHANGED_EVENT } from "@/lib/todo-events";
import { notifyTodosChanged } from "@/lib/todo-events";
import type { Todo, Tag } from "@/types";
import { RightSidebarTodoItem } from "./right-sidebar-todo-item";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const MAX_DATES = 5;
const MAX_TODOS_PER_GROUP = 10;

export function RightSidebar() {
  const [upcomingTodos, setUpcomingTodos] = useState<Todo[]>([]);
  const [overdueTodos, setOverdueTodos] = useState<Todo[]>([]);
  const [unscheduledTodos, setUnscheduledTodos] = useState<Todo[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const today = new Date().toISOString().split("T")[0];

  const refreshSidebarData = useCallback(() => {
    // Fetch upcoming todos (we need full todo data now)
    // We'll use the upcoming dates API first, then fetch todos for each date
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
    window.addEventListener(TODOS_CHANGED_EVENT, handleTodosChanged);
    return () => { window.removeEventListener(TODOS_CHANGED_EVENT, handleTodosChanged); };
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
        <h3 className="mb-3 text-sm font-semibold">即将提醒</h3>
        {upcomingDates.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">暂无</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingDates.map((date) => (
              <div key={date}>
                <Link
                  href={`/date/${date}`}
                  className="mb-1 block text-xs font-semibold text-[var(--accent-light)] hover:underline"
                >
                  {formatDate(date)}
                </Link>
                {renderTodoGroup(upcomingByDate.get(date) ?? [])}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Overdue */}
      <section className="mb-6">
        <h3 className="mb-3 text-sm font-semibold">已逾期</h3>
        {overdueDates.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">无逾期项</p>
        ) : (
          <div className="flex flex-col gap-3">
            {overdueDates.map((date) => (
              <div key={date} className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] p-2.5">
                <Link
                  href={`/date/${date}`}
                  className="mb-1 block text-xs font-semibold text-[var(--danger)] hover:underline"
                >
                  {formatDate(date)} · 逾期{daysOverdue(date)}天
                </Link>
                {renderTodoGroup(overdueByDate.get(date) ?? [])}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Unscheduled */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">
          <Link href="/unscheduled" className="hover:underline">
            未安排
          </Link>
          <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
            {unscheduledTodos.length} 项
          </span>
        </h3>
        {unscheduledTodos.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">暂无</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedUnscheduledGroups.map(({ tag, todos }) => (
              <div key={tag?.id ?? "untagged"}>
                <div
                  className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: tag?.color || "var(--text-muted)" }}
                >
                  {tag?.name ?? "未分类"}
                </div>
                {renderTodoGroup(todos)}
              </div>
            ))}
            {unscheduledUntagged.length > 0 && (
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  未分类
                </div>
                {renderTodoGroup(unscheduledUntagged)}
              </div>
            )}
          </div>
        )}
      </section>
    </aside>
  );
}
```

Key changes from current:
- **Upcoming**: Now fetches actual todo data for each upcoming date and displays them grouped by date (near to far), each todo with checkbox + title + tag dots
- **Overdue**: Now shows actual todo items grouped by date (most recent first), with danger styling and days-overdue label
- **Unscheduled**: Now shows actual todo items grouped by tag (following tag sortOrder), with untagged items in "未分类"
- All sections support inline checkbox toggling (calls `handleToggle` directly)
- Each date group links to the corresponding date page
- Max 10 items per group with "还有 X 项..." overflow indicator

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/right-sidebar.tsx src/components/sidebar/right-sidebar-todo-item.tsx
git commit -m "feat: enhance right sidebar with detailed todo lists grouped by date/tag"
```

---

## Chunk 6: Final Build Verification

### Task 17: Build Verification and Type Check

- [ ] **Step 1: Run TypeScript type check**

```bash
cd /Users/cokekitten/dev/todoflow
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 3: Run dev server and verify key features**

```bash
npm run dev
```

Test checklist:
1. Theme toggle works (dark → light → system → dark cycle)
2. No flash of wrong theme on page load
3. All buttons show pointer cursor on hover
4. Right-click a tag → context menu appears with rename/color/delete
5. Rename a tag → name updates in sidebar
6. Change tag color → color dot updates
7. Delete a tag → tag removed from sidebar
8. Drag a tag up/down → order persists after refresh
9. Drag a todo up/down → order persists after refresh
10. Calendar prev/next buttons have adequate click area
11. Click month in calendar → month picker grid appears
12. Click year in calendar → year picker grid appears
13. Tag view: todo rows don't show tag badges
14. Tag view: date area shows "设置日期" for dateless todos
15. Tag view: click "设置日期" → date input appears, select date → saved
16. Right sidebar upcoming section shows grouped todos by date
17. Right sidebar overdue section shows grouped todos with danger styling
18. Right sidebar unscheduled section shows todos grouped by tag
19. Right sidebar checkboxes work (toggle completes todo, sidebar refreshes)

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: build verification after enhancements"
```
