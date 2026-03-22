"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tag.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center">
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="mr-1 flex h-6 w-4 flex-shrink-0 items-center justify-center text-[10px] text-[var(--text-dim)] opacity-0 transition-opacity group-hover/taglist:opacity-100 hover:text-[var(--text-secondary)]"
        title="拖拽排序"
      >
        ⠿
      </span>
      <button
        type="button"
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={[
          "flex-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
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
  const router = useRouter();
  const pathname = usePathname();
  const activeTagId = pathname.startsWith("/tag/") ? pathname.slice(5) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((data: Tag[]) => setTags(data))
      .catch(() => undefined);
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!response.ok) return;
    const tag = (await response.json()) as Tag;
    setTags((current) => [...current, tag]);
    setNewName("");
    setIsCreating(false);
  }

  async function handleRename(id: string, name: string) {
    const response = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as Tag;
    setTags((current) => current.map((t) => (t.id === id ? updated : t)));
  }

  async function handleChangeColor(id: string, color: string) {
    const response = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    if (!response.ok) return;
    const updated = (await response.json()) as Tag;
    setTags((current) => current.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    setTags((current) => current.filter((t) => t.id !== id));
    if (activeTagId === id) {
      router.push(`/date/${new Date().toISOString().split("T")[0]}`);
    }
  }

  function handleContextMenu(event: React.MouseEvent, tag: Tag) {
    event.preventDefault();
    setContextMenu({ tag, x: event.clientX, y: event.clientY });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tags.findIndex((t) => t.id === active.id);
    const newIndex = tags.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tags, oldIndex, newIndex);
    setTags(reordered);

    // Persist to server
    await fetch("/api/tags/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((t) => t.id) }),
    });
  }

  return (
    <div className="group/taglist">
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
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCreate();
              if (event.key === "Escape") setIsCreating(false);
            }}
            placeholder="标签名称"
            autoFocus
            className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xs focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tags.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1">
            {tags.map((tag) => (
              <SortableTagItem
                key={tag.id}
                tag={tag}
                isActive={activeTagId === tag.id}
                onClick={() => router.push(`/tag/${tag.id}`)}
                onContextMenu={(e) => handleContextMenu(e, tag)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {contextMenu && (
        <TagContextMenu
          tag={contextMenu.tag}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onChangeColor={handleChangeColor}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
