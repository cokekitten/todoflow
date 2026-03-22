"use client";

import type { Todo } from "@/types";
import { CheckIcon } from "@/components/icons/ui-icons";

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
        {isCompleted ? <CheckIcon className="h-2 w-2" /> : null}
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
