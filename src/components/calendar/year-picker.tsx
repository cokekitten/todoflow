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
    <div className="absolute left-0 top-full z-20 mt-2 min-w-[182px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-2 shadow-2xl">
      <div className="grid grid-cols-3 gap-1.5">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => {
              onSelect(year);
              onClose();
            }}
            className={[
              "rounded px-2 py-2 text-xs transition-colors",
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
