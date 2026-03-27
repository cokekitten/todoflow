"use client";

import { useEffect, useRef, useState } from "react";

import { PaletteIcon, RenameIcon, TrashIcon } from "@/components/icons/ui-icons";
import type { Tag } from "@/types";
import { ColorPalette } from "./color-palette";

interface TagContextMenuProps {
  tag: Tag;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}

export function TagContextMenu({
  tag,
  position,
  onClose,
  onRename,
  onChangeColor,
  onDelete,
}: TagContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"menu" | "rename" | "color">("menu");
  const [renameValue, setRenameValue] = useState(tag.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Focus input when entering rename mode
  useEffect(() => {
    if (mode === "rename") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [mode]);

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== tag.name) {
      onRename(tag.id, trimmed);
    }
    onClose();
  }

  function handleColorSelect(color: string) {
    onChangeColor(tag.id, color);
    onClose();
  }

  function handleDelete() {
    if (window.confirm(`确定删除标签「${tag.name}」吗？相关待办不会被删除。`)) {
      onDelete(tag.id);
    }
    onClose();
  }

  // Adjust position to stay within viewport
  const isMobileView = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  const style: React.CSSProperties = isMobileView
    ? {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 50,
      }
    : {
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 50,
      };

  return (
    <div ref={menuRef} style={style}>
      <div className="min-w-[160px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] py-1 shadow-xl">
        {mode === "menu" && (
          <>
            <button
              type="button"
              onClick={() => setMode("rename")}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
            >
              <RenameIcon className="h-3.5 w-3.5" />
              重命名
            </button>
            <button
              type="button"
              onClick={() => setMode("color")}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--border-default)]"
            >
              <PaletteIcon className="h-3.5 w-3.5" />
              更改颜色
            </button>
            <div className="my-1 border-t border-[var(--border-default)]" />
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-xs text-[var(--danger)] hover:bg-[var(--danger-bg)]"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              删除
            </button>
          </>
        )}

        {mode === "rename" && (
          <div className="px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") onClose();
              }}
              className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xs focus:border-[var(--accent)] focus:outline-none"
            />
            <div className="mt-2 flex justify-end gap-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded px-2 py-1 text-[10px] text-[var(--text-muted)] hover:bg-[var(--border-default)]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleRenameSubmit}
                className="rounded bg-[var(--accent)] px-2 py-1 text-[10px] text-white hover:opacity-90"
              >
                确定
              </button>
            </div>
          </div>
        )}

        {mode === "color" && (
          <div className="px-3 py-2">
            <div className="mb-2 text-[10px] text-[var(--text-muted)]">选择颜色</div>
            <ColorPalette currentColor={tag.color} onSelect={handleColorSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
