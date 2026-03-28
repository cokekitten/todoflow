"use client";

import { useEffect, useRef, useState } from "react";

export type RecurringScope = "this" | "thisAndFuture" | "all";

interface RecurringScopeDialogProps {
  mode: "delete" | "edit";
  onConfirm: (scope: RecurringScope) => void;
  onCancel: () => void;
}

const DELETE_LABELS: Record<RecurringScope, string> = {
  this: "仅删除此天",
  thisAndFuture: "删除此天及未来所有",
  all: "删除整个重复",
};

const EDIT_LABELS: Record<RecurringScope, string> = {
  this: "仅修改此天",
  thisAndFuture: "修改此天及未来所有",
  all: "修改所有",
};

export function RecurringScopeDialog({ mode, onConfirm, onCancel }: RecurringScopeDialogProps) {
  const [selected, setSelected] = useState<RecurringScope>("this");
  const dialogRef = useRef<HTMLDivElement>(null);
  const labels = mode === "delete" ? DELETE_LABELS : EDIT_LABELS;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onCancel();
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={dialogRef}
        className="w-72 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-4 shadow-xl"
      >
        <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
          {mode === "delete" ? "删除重复待办" : "修改重复待办"}
        </p>

        <div className="mb-4 flex flex-col gap-2">
          {(Object.entries(labels) as [RecurringScope, string][]).map(([scope, label]) => (
            <label
              key={scope}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
            >
              <input
                type="radio"
                name="scope"
                value={scope}
                checked={selected === scope}
                onChange={() => setSelected(scope)}
                className="accent-[var(--accent)]"
              />
              {label}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs text-white",
              mode === "delete"
                ? "bg-[var(--danger)] hover:bg-[var(--danger)]/80"
                : "bg-[var(--accent)] hover:bg-[var(--accent)]/80",
            ].join(" ")}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
