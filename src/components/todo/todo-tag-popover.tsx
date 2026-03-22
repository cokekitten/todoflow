"use client";

import { useEffect, useRef } from "react";

import { CheckIcon } from "@/components/icons/ui-icons";
import type { Tag } from "@/types";

interface TodoTagPopoverProps {
  tags: Tag[];
  selectedTagIds: string[];
  onToggle: (tagId: string) => void;
  onClose: () => void;
}

export function TodoTagPopover({ tags, selectedTagIds, onToggle, onClose }: TodoTagPopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      className="absolute left-0 top-full z-30 mt-2 min-w-[180px] rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-2 shadow-2xl"
      data-no-drag="true"
    >
      <div className="flex max-h-[220px] flex-col gap-1 overflow-y-auto">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id)}
              className={[
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
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
    </div>
  );
}
