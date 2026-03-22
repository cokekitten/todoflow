"use client";

import { useState } from "react";

import type { Todo } from "@/types";

interface TodoItemProps {
  todo: Todo;
  showDate?: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
}

export function TodoItem({ todo, showDate, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const isCompleted = todo.completed === 1;

  function handleSave() {
    if (editTitle.trim() && editTitle.trim() !== todo.title) {
      onUpdate(todo.id, editTitle.trim());
    }

    setIsEditing(false);
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3.5 py-2.5 transition-colors hover:border-[var(--accent)]/30">
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

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(event) => setEditTitle(event.target.value)}
          onBlur={handleSave}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSave();
            }

            if (event.key === "Escape") {
              setEditTitle(todo.title);
              setIsEditing(false);
            }
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

      {showDate && todo.date ? (
        <span className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] text-[var(--text-dim)]">
          {todo.date}
        </span>
      ) : null}

      {todo.tags.map((tag) => (
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

      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        className="text-xs text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--danger)]"
      >
        ✕
      </button>
    </div>
  );
}
