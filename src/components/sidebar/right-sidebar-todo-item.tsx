"use client";

import { useRef, useState } from "react";
import type { Todo } from "@/types";
import { CheckIcon } from "@/components/icons/ui-icons";

interface RightSidebarTodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
}

export function RightSidebarTodoItem({ todo, onToggle }: RightSidebarTodoItemProps) {
  const isCompleted = todo.completed === 1;
  const textRef = useRef<HTMLSpanElement>(null);
  const [showTip, setShowTip] = useState(false);

  function handleMouseEnter() {
    const el = textRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      setShowTip(true);
    }
  }

  function handleMouseLeave() {
    setShowTip(false);
  }

  return (
    <div
      className="group/item relative flex items-center gap-2 py-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(todo.id, !isCompleted);
        }}
        className="relative flex-shrink-0 p-1"
      >
        <span
          className={[
            "flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors",
            isCompleted
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--text-dim)] hover:border-[var(--accent)]",
          ].join(" ")}
        >
          {isCompleted ? <CheckIcon className="h-2 w-2" /> : null}
        </span>
      </button>
      <span
        ref={textRef}
        className={[
          "flex-1 cursor-default select-none truncate text-[11px]",
          isCompleted ? "text-[var(--text-muted)] line-through" : "text-[var(--text-secondary)]",
        ].join(" ")}
      >
        {todo.title}
      </span>
      {/* Tooltip — only when text overflows */}
      {showTip && (
        <span className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 max-w-[220px] break-all rounded bg-[var(--bg-primary)] px-2 py-1 text-[10px] leading-tight text-[var(--text-primary)] shadow-lg ring-1 ring-[var(--border-default)]">
          {todo.title}
        </span>
      )}
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
