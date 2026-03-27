"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { notifyTagsChanged, notifyTodosChanged, TAGS_CHANGED_EVENT } from "@/lib/todo-events";
import type { Tag } from "@/types";

import { TagContextMenu } from "./tag-context-menu";

interface ContextMenuState {
  tag: Tag;
  x: number;
  y: number;
}

function SortableTagItem({
  tag,
  isActive,
  onClick,
  onContextMenu,
}: {
  tag: Tag;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (event: React.MouseEvent | { clientX: number; clientY: number }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tag.id,
  });
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMoved = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchMoved.current = false;
    const touch = e.touches[0];
    longPressRef.current = setTimeout(() => {
      if (!touchMoved.current) {
        onContextMenu({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }, 500);
  }

  function handleTouchMove() {
    touchMoved.current = true;
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  function handleTouchEnd() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={[
          "w-full rounded-md px-2 py-2 text-left text-xs transition-colors",
          isActive
            ? "bg-[var(--accent)] text-white"
            : "text-[var(--text-secondary)] hover:bg-[var(--border-default)]",
        ].join(" ")}
      >
        <span
          className="mr-2 inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: tag.color || "#7c3aed" }}
        />
        {tag.name}
      </button>
    </div>
  );
}

export function TagList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const creatingOnBlurRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const activeTagId = pathname.startsWith("/tag/") ? pathname.slice(5) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const fetchTags = useCallback(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((data: Tag[]) => setTags(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetchTags();

    function handleTagsChanged() {
      fetchTags();
    }

    window.addEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
    return () => window.removeEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
  }, [fetchTags]);

  async function handleCreate() {
    const trimmed = newName.trim();

    if (!trimmed) {
      setIsCreating(false);
      setNewName("");
      return;
    }

    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    if (!response.ok) {
      return;
    }

    setNewName("");
    setIsCreating(false);
    notifyTagsChanged();
  }

  async function handleRename(id: string, name: string) {
    const response = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      return;
    }

    notifyTagsChanged();
    notifyTodosChanged();
  }

  async function handleChangeColor(id: string, color: string) {
    const response = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });

    if (!response.ok) {
      return;
    }

    notifyTagsChanged();
    notifyTodosChanged();
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/tags/${id}`, { method: "DELETE" });

    if (!response.ok) {
      return;
    }

    if (activeTagId === id) {
      router.push(`/date/${new Date().toISOString().split("T")[0]}`);
    }

    notifyTagsChanged();
    notifyTodosChanged();
  }

  function handleContextMenu(event: React.MouseEvent | { clientX: number; clientY: number }, tag: Tag) {
    if ("preventDefault" in event) {
      event.preventDefault();
    }
    setContextMenu({ tag, x: event.clientX, y: event.clientY });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tags.findIndex((tag) => tag.id === active.id);
    const newIndex = tags.findIndex((tag) => tag.id === over.id);
    const reordered = arrayMove(tags, oldIndex, newIndex);
    setTags(reordered);

    const response = await fetch("/api/tags/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((tag) => tag.id) }),
    });

    if (!response.ok) {
      fetchTags();
      return;
    }

    notifyTagsChanged();
    notifyTodosChanged();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">标签</span>
        <button
          type="button"
          onClick={() => setIsCreating((value) => !value)}
          className="text-sm text-[var(--text-dim)] hover:text-[var(--text-primary)]"
        >
          +
        </button>
      </div>

      {isCreating ? (
        <div className="mb-2">
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onBlur={() => {
              if (creatingOnBlurRef.current) {
                creatingOnBlurRef.current = false;
                return;
              }

              void handleCreate();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                creatingOnBlurRef.current = true;
                void handleCreate();
              }

              if (event.key === "Escape") {
                setNewName("");
                setIsCreating(false);
              }
            }}
            placeholder="标签名称"
            autoFocus
            className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xs focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tags.map((tag) => tag.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {tags.map((tag) => (
              <SortableTagItem
                key={tag.id}
                tag={tag}
                isActive={activeTagId === tag.id}
                onClick={() => router.push(`/tag/${tag.id}`)}
                onContextMenu={(event) => handleContextMenu(event, tag)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {contextMenu ? (
        <TagContextMenu
          tag={contextMenu.tag}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onChangeColor={handleChangeColor}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  );
}
