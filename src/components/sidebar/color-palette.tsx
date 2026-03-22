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
