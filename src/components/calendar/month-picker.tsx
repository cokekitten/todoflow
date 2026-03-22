"use client";

interface MonthPickerProps {
  currentMonth: number; // 0-indexed
  onSelect: (month: number) => void;
  onClose: () => void;
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function MonthPicker({ currentMonth, onSelect, onClose }: MonthPickerProps) {
  return (
    <div className="absolute left-0 top-full z-20 mt-2 min-w-[182px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-2 shadow-2xl">
      <div className="grid grid-cols-4 gap-1.5">
        {MONTHS.map((label, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              onSelect(index);
              onClose();
            }}
            className={[
              "min-w-0 rounded px-2 py-2 text-xs transition-colors",
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
