import type { CSSProperties, ReactNode } from "react";

interface TodoChipProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function TodoChip({ children, className = "", style }: TodoChipProps) {
  return (
    <span
      className={[
        "inline-flex h-7 items-center rounded px-2.5 text-[10px] leading-none transition-colors duration-75",
        className,
      ].join(" ")}
      style={style}
    >
      {children}
    </span>
  );
}
