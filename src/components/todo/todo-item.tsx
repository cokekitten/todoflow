"use client";

import { forwardRef, useState } from "react";

import { CheckIcon, TrashIcon } from "@/components/icons/ui-icons";
import { DatePopover } from "@/components/calendar/date-popover";
import { TodoTagPopover } from "@/components/todo/todo-tag-popover";
import type { Tag, Todo } from "@/types";

export interface TodoItemProps {
  todo: Todo;
  showDate?: boolean;
  hideTags?: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDateChange?: (id: string, date: string | null) => void;
  onTagIdsChange?: (id: string, tagIds: string[]) => void;
  availableTags?: Tag[];
  sortableProps?: Record<string, unknown>;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

export const TodoItem = forwardRef<HTMLDivElement, TodoItemProps>(function TodoItem(
  {
    todo,
    showDate,
    hideTags,
    onToggle,
    onDelete,
    onUpdate,
    onDateChange,
    onTagIdsChange,
    availableTags = [],
    sortableProps,
    style,
    isDragging,
  },
  ref,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [showDateInput, setShowDateInput] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const isCompleted = todo.completed === 1;

  function handleSave() {
    const trimmed = editTitle.trim();

    if (trimmed && trimmed !== todo.title) {
      onUpdate(todo.id, trimmed);
    }

    setIsEditing(false);
  }

  function handleDateSelect(event: React.ChangeEvent<HTMLInputElement>) {
    onDateChange?.(todo.id, event.target.value || null);
    setShowDateInput(false);
  }

  function handleTagToggle(tagId: string) {
    const nextTagIds = todo.tags.some((tag) => tag.id === tagId)
      ? todo.tags.filter((tag) => tag.id !== tagId).map((tag) => tag.id)
      : [...todo.tags.map((tag) => tag.id), tagId];

    onTagIdsChange?.(todo.id, nextTagIds);
  }

  return (
    <div
      ref={ref}
      style={style}
      {...sortableProps}
      className={[
        "group flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2.5 transition-colors hover:border-[var(--accent)]/30",
        isDragging ? "opacity-80 shadow-lg" : "",
      ].join(" ")}
    >
      <button
        type="button"
        data-no-drag="true"
        onClick={() => onToggle(todo.id, !isCompleted)}
        className={[
          "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors",
          isCompleted
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[var(--text-dim)] hover:border-[var(--accent)]",
        ].join(" ")}
      >
        {isCompleted ? <CheckIcon className="h-2.5 w-2.5" /> : null}
      </button>

      {isEditing ? (
        <input
          type="text"
          data-no-drag="true"
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
            "flex-1 text-[13px]",
            isCompleted ? "text-[var(--text-muted)] line-through" : "",
          ].join(" ")}
        >
          {todo.title}
        </span>
      )}

      {showDate && onDateChange ? (
        <div className="relative" data-no-drag="true">
          <button
            type="button"
            onClick={() => setShowDateInput((value) => !value)}
            className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
          >
            {todo.date || "设置日期"}
          </button>
          {showDateInput ? (
            <DatePopover value={todo.date} onSelect={(date) => onDateChange(todo.id, date)} onClose={() => setShowDateInput(false)} />
          ) : null}
        </div>
      ) : null}

      {showDate && !onDateChange && todo.date ? (
        <span className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] text-[var(--text-dim)]">
          {todo.date}
        </span>
      ) : null}

      {!hideTags ? (
        <div className="relative" data-no-drag="true">
          <button
            type="button"
            onClick={() => setShowTagPicker((value) => !value)}
            className="flex flex-wrap items-center gap-1"
          >
            {todo.tags.length > 0 ? (
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
              ))
            ) : (
              <span className="rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] text-[var(--text-dim)]">
                选择标签
              </span>
            )}
          </button>

          {showTagPicker && onTagIdsChange ? (
            <TodoTagPopover
              tags={availableTags}
              selectedTagIds={todo.tags.map((tag) => tag.id)}
              onToggle={handleTagToggle}
              onClose={() => setShowTagPicker(false)}
            />
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        data-no-drag="true"
        onClick={() => onDelete(todo.id)}
        className="text-[var(--text-dim)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--danger)]"
      >
        <TrashIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});
