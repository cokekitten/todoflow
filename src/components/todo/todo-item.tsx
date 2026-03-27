"use client";

import { forwardRef, useRef, useState } from "react";

import { CheckIcon, CloseIcon } from "@/components/icons/ui-icons";
import { DatePopover } from "@/components/calendar/date-popover";
import { TodoChip } from "@/components/todo/todo-chip";
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
  onTagIdChange?: (id: string, tagId: string | null) => void;
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
    onTagIdChange,
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
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  function handleTagSelect(tagId: string | null) {
    onTagIdChange?.(todo.id, tagId);
  }

  return (
    <div
      ref={ref}
      style={style}
      {...sortableProps}
      className={[
        "group flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2.5 transition-colors hover:border-[var(--accent)]/30",
        isDragging ? "opacity-80 shadow-lg" : "",
      ].join(" ")}
    >
      <button
        type="button"
        data-no-drag="true"
        onClick={() => onToggle(todo.id, !isCompleted)}
        className="relative flex-shrink-0 p-1.5"
      >
        <span
          className={[
            "flex h-4 w-4 items-center justify-center rounded border-2 transition-[border-color,background-color,color] duration-75",
            isCompleted
              ? "border-[var(--accent)] bg-[var(--accent)] text-white"
              : "border-[var(--text-dim)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/8",
          ].join(" ")}
        >
          {isCompleted ? <CheckIcon className="h-2.5 w-2.5" /> : null}
        </span>
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
          onClick={() => {
            if (window.matchMedia("(max-width: 767px)").matches) {
              setIsEditing(true);
              setEditTitle(todo.title);
            }
          }}
          onDoubleClick={() => {
            if (clickTimerRef.current) {
              clearTimeout(clickTimerRef.current);
              clickTimerRef.current = null;
            }
            setIsEditing(true);
            setEditTitle(todo.title);
          }}
          className={[
            "flex-1 cursor-text text-[13px]",
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
            className="rounded"
          >
            <TodoChip className={["bg-[var(--bg-primary)] hover:bg-[var(--border-default)]", dateTone.className].join(" ")} style={dateTone.style}>
              {todo.date || "设置日期"}
            </TodoChip>
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
        <TodoChip className={["bg-[var(--bg-primary)]", dateTone.className].join(" ")} style={dateTone.style}>
          {todo.date}
        </TodoChip>
      ) : null}

      {!hideTags ? (
        <div className="relative flex-shrink-0" data-no-drag="true">
          <button
            ref={tagButtonRef}
            type="button"
            onClick={() => setShowTagPicker((value) => !value)}
            className="inline-flex h-7 items-center gap-1 rounded text-[10px] leading-none"
          >
            {todo.tags[0] ? (
              (() => {
                const tag = todo.tags[0];
                return (
                <TodoChip
                  key={tag.id}
                  className="bg-[color:var(--tag-bg)] text-[color:var(--tag-fg)] hover:bg-[color:var(--tag-bg-hover)] hover:text-white"
                  style={{
                    ["--tag-bg" as string]: `${tag.color || "#7c3aed"}24`,
                    ["--tag-bg-hover" as string]: `${tag.color || "#7c3aed"}cc`,
                    ["--tag-fg" as string]: tag.color || "#7c3aed",
                    boxShadow: `inset 0 0 0 1px ${tag.color || "#7c3aed"}55`,
                  }}
                >
                  {tag.name}
                </TodoChip>
                );
              })()
            ) : (
              <TodoChip className="bg-[var(--bg-primary)] text-[var(--text-dim)] hover:bg-[var(--border-default)] hover:text-[var(--text-secondary)]">
                选择标签
              </TodoChip>
            )}
          </button>

          {showTagPicker && onTagIdChange ? (
            <TodoTagPopover
              tags={availableTags}
              selectedTagId={todo.tags[0]?.id ?? null}
              onSelect={handleTagSelect}
              onClose={() => setShowTagPicker(false)}
              anchorRef={tagButtonRef}
            />
          ) : null}
        </div>
      ) : null}

        <span className="relative flex h-4 w-4 flex-shrink-0 items-center justify-center text-transparent">
          <button
            type="button"
            data-no-drag="true"
            onClick={() => onDelete(todo.id)}
            className="absolute inset-0 text-[var(--text-dim)] transition-[opacity,color,visibility] duration-100 md:invisible md:opacity-0 md:group-hover:visible md:group-hover:opacity-100 hover:text-[var(--danger)]"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
    </div>
  );
});
