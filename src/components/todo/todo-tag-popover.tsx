"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { CheckIcon } from "@/components/icons/ui-icons";
import type { Tag } from "@/types";

interface TodoTagPopoverProps {
  tags: Tag[];
  selectedTagId: string | null;
  onSelect: (tagId: string | null) => void;
  onClose: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
}

const POPOVER_WIDTH = 220;

export function TodoTagPopover({ tags, selectedTagId, onSelect, onClose, anchorRef }: TodoTagPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    const anchor = anchorRef?.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const popoverHeight = 280;
    let top = rect.bottom + 8;
    if (top + popoverHeight > window.innerHeight - 12) {
      top = rect.top - popoverHeight - 8;
    }
    setPosition({
      top: Math.max(12, top),
      left: Math.max(12, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 12)),
    });
  }, [anchorRef]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const anchor = anchorRef?.current;

      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node) &&
        (!anchor || !anchor.contains(event.target as Node))
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handleReposition() {
      const anchor = anchorRef?.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const popoverHeight = 280;
      let top = rect.bottom + 8;
      if (top + popoverHeight > window.innerHeight - 12) {
        top = rect.top - popoverHeight - 8;
      }
      setPosition({
        top: Math.max(12, top),
        left: Math.max(12, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 12)),
      });
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={rootRef}
      className="fixed z-[120] min-w-[220px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-2 shadow-2xl"
      style={position}
      data-no-drag="true"
    >
      <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            onClose();
          }}
          className={[
            "flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors",
            selectedTagId === null
              ? "bg-[var(--accent)]/12 text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--border-default)]",
          ].join(" ")}
        >
          <span className="h-2 w-2 rounded-full bg-[var(--text-dim)]" />
          <span className="flex-1">不设置标签</span>
          {selectedTagId === null ? <CheckIcon className="h-3.5 w-3.5 text-[var(--accent-light)]" /> : null}
        </button>
        {tags.map((tag) => {
          const isSelected = selectedTagId === tag.id;

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                onSelect(tag.id);
                onClose();
              }}
              className={[
                "flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors",
                isSelected
                  ? "bg-[var(--accent)]/12 text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--border-default)]",
              ].join(" ")}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || "#7c3aed" }} />
              <span className="flex-1">{tag.name}</span>
              {isSelected ? <CheckIcon className="h-3.5 w-3.5 text-[var(--accent-light)]" /> : null}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
