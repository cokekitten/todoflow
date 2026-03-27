"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/icons/ui-icons";

interface DatePopoverProps {
  value: string | null;
  onSelect: (date: string | null) => void;
  onClose: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
  align?: "left" | "right";
}

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];
const POPOVER_WIDTH = 260;

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay() - 1;

  if (startWeekday < 0) startWeekday = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  for (let index = startWeekday - 1; index >= 0; index -= 1) {
    const day = daysInPrevMonth - index;
    const displayMonth = month === 0 ? 11 : month - 1;
    const displayYear = month === 0 ? year - 1 : year;
    days.push({ date: formatDate(displayYear, displayMonth, day), day, isCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ date: formatDate(year, month, day), day, isCurrentMonth: true });
  }

  const remaining = 42 - days.length;
  for (let day = 1; day <= remaining; day += 1) {
    const displayMonth = month === 11 ? 0 : month + 1;
    const displayYear = month === 11 ? year + 1 : year;
    days.push({ date: formatDate(displayYear, displayMonth, day), day, isCurrentMonth: false });
  }

  return days;
}

export function DatePopover({ value, onSelect, onClose, anchorRef, align = "right" }: DatePopoverProps) {
  const initialDate = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef?.current;

    if (!anchor) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const nextLeft = align === "right" ? rect.right - POPOVER_WIDTH : rect.left;
    const popoverHeight = 320;
    let top = rect.bottom + 8;
    if (top + popoverHeight > window.innerHeight - 12) {
      top = rect.top - popoverHeight - 8;
    }
    setPosition({
      top: Math.max(12, top),
      left: Math.max(12, Math.min(nextLeft, window.innerWidth - POPOVER_WIDTH - 12)),
    });
  }, [align, anchorRef]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const anchor = anchorRef?.current;

      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node) &&
        (!anchor || !anchor.contains(event.target as Node))
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handleReposition() {
      const anchor = anchorRef?.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const nextLeft = align === "right" ? rect.right - POPOVER_WIDTH : rect.left;
      const popoverHeight = 320;
      let top = rect.bottom + 8;
      if (top + popoverHeight > window.innerHeight - 12) {
        top = rect.top - popoverHeight - 8;
      }
      setPosition({
        top: Math.max(12, top),
        left: Math.max(12, Math.min(nextLeft, window.innerWidth - POPOVER_WIDTH - 12)),
      });
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [align, anchorRef, onClose]);

  const days = useMemo(() => getMonthDays(viewYear, viewMonth), [viewMonth, viewYear]);

  function goToPreviousMonth() {
    if (viewMonth === 0) {
      setViewYear((current) => current - 1);
      setViewMonth(11);
      return;
    }

    setViewMonth((current) => current - 1);
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewYear((current) => current + 1);
      setViewMonth(0);
      return;
    }

    setViewMonth((current) => current + 1);
  }

  return createPortal(
    <div
      ref={rootRef}
      className="fixed z-[120] w-[260px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-3 shadow-2xl"
      style={position}
      data-no-drag="true"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            {viewYear}年 {viewMonth + 1}月
          </div>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[var(--text-dim)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-[var(--text-dim)]">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
        {days.map((day) => {
          const isSelected = value === day.date;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => {
                onSelect(day.date);
                onClose();
              }}
              className={[
                "rounded-md py-2 transition-colors",
                day.isCurrentMonth ? "text-[var(--text-secondary)]" : "text-[var(--text-dim)] opacity-40",
                isSelected ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]" : "hover:bg-[var(--border-default)]",
              ].join(" ")}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          className="rounded px-2 py-1 text-[var(--text-muted)] hover:bg-[var(--border-default)] hover:text-[var(--text-primary)]"
        >
          清空日期
        </button>
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            onSelect(formatDate(now.getFullYear(), now.getMonth(), now.getDate()));
            onClose();
          }}
          className="rounded px-2 py-1 text-[var(--accent-light)] hover:bg-[var(--border-default)]"
        >
          选择今天
        </button>
      </div>
    </div>,
    document.body,
  );
}
