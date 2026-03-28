"use client";

import { useRef, useState, useEffect } from "react";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

interface RecurringSelectProps {
  value: Frequency | null;
  onChange: (frequency: Frequency | null) => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  none: "不重复",
  daily: "每天",
  weekly: "每周",
  monthly: "每月",
  yearly: "每年",
};

export function RecurringSelect({ value, onChange }: RecurringSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref} data-no-drag="true">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] leading-none",
          value
            ? "bg-[var(--accent)]/15 text-[var(--accent-light)]"
            : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        ].join(" ")}
        title="重复"
      >
        <span className="text-sm">↻</span>
        <span className="hidden md:inline">
          {value ? FREQUENCY_LABELS[value] : "重复"}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-1 w-28 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-1 shadow-lg">
          {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key === "none" ? null : (key as Frequency));
                setOpen(false);
              }}
              className={[
                "w-full px-3 py-1.5 text-left text-[12px]",
                (key === "none" && !value) || key === value
                  ? "bg-[var(--accent)]/10 text-[var(--accent-light)]"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-primary)]",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
