"use client";

import { forwardRef, useRef, useState } from "react";

import { CheckIcon, CloseIcon } from "@/components/icons/ui-icons";
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
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);

  function getDateTone(date: string | null) {
    if (!date || isCompleted) {
      return {
        className: "text-[var(--text-dim)] hover:text-[var(--text-secondary)]",
        style: undefined,
      };
    }

    const today = new Date();
    const current = new Date(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T00:00:00`);
    const target = new Date(`${date}T00:00:00`);
    const diffDays = Math.floor((current.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 3) {
      return {
        className: "hover:text-[#dc2626]",
        style: { color: "#dc2626" },
      };
    }

    if (diffDays > 0) {
      return {
        className: "hover:text-[#ea580c]",
        style: { color: "#ea580c" },
      };
    }

    return {
      className: "text-[var(--text-dim)] hover:text-[var(--text-secondary)]",
      style: undefined,
    };
  }

  const dateTone = getDateTone(todo.date);

  function handleSave() {
    const trimmed = editTitle.trim();

    if (trimmed && trimmed !== todo.title) {
      onUpdate(todo.id, trimmed);
    }

    setIsEditing(false);
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

      <div className="ml-auto flex items-center gap-2">
      {showDate && onDateChange ? (
        <div className="relative flex-shrink-0" data-no-drag="true">
          <button
            ref={dateButtonRef}
            type="button"
            onClick={() => setShowDateInput((value) => !value)}
            className={[
              "inline-flex h-7 items-center rounded bg-[var(--bg-primary)] px-2.5 text-[10px] leading-none",
              dateTone.className,
            ].join(" ")}
            style={dateTone.style}
          >
            {todo.date || "设置日期"}
          </button>
          {showDateInput ? (
            <DatePopover
              value={todo.date}
              onSelect={(date) => onDateChange(todo.id, date)}
              onClose={() => setShowDateInput(false)}
              anchorRef={dateButtonRef}
            />
          ) : null}
        </div>
      ) : null}

      {showDate && !onDateChange && todo.date ? (
        <span
          className={["rounded bg-[var(--bg-primary)] px-2 py-0.5 text-[10px]", dateTone.className].join(" ")}
          style={dateTone.style}
        >
          {todo.date}
        </span>
      ) : null}

      {!hideTags ? (
        <div className="relative flex-shrink-0" data-no-drag="true">
          <button
            ref={tagButtonRef}
            type="button"
            onClick={() => setShowTagPicker((value) => !value)}
            className="inline-flex min-h-7 items-center gap-1 rounded bg-[var(--bg-primary)] px-2.5 py-1 text-[10px] leading-none text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
          >
            {todo.tags.length > 0 ? (
              todo.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded px-2 py-0.5 text-[10px] leading-none"
                  style={{
                    backgroundColor: `${tag.color || "#7c3aed"}20`,
                    color: tag.color || "#7c3aed",
                  }}
                >
                  {tag.name}
                </span>
              ))
            ) : (
              <span className="text-[10px] leading-none text-[var(--text-dim)]">
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
              anchorRef={tagButtonRef}
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
        <CloseIcon className="h-3.5 w-3.5" />
      </button>
      </div>
    </div>
  );
});
