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
