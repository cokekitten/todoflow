"use client";

import { useEffect, useState } from "react";

import { notifyTodosChanged } from "@/lib/todo-events";
import type { Tag } from "@/types";

interface TodoCreateProps {
  date?: string | null;
  defaultTagId?: string | null;
  onCreated: () => void;
}

export function TodoCreate({ date, defaultTagId, onCreated }: TodoCreateProps) {
  const [title, setTitle] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(defaultTagId ? [defaultTagId] : []);
  const [showTagPicker, setShowTagPicker] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((data: Tag[]) => setAllTags(data))
      .catch(() => undefined);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        date: date ?? null,
        tagIds: selectedTagIds,
      }),
    });

    if (!response.ok) {
      return;
    }

    setTitle("");
    setSelectedTagIds(defaultTagId ? [defaultTagId] : []);
    setShowTagPicker(false);
    notifyTodosChanged();
    onCreated();
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="添加新待办..."
          className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShowTagPicker((value) => !value)}
          className="rounded-lg border border-[var(--border-default)] px-2 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          title="选择标签"
        >
          🏷
        </button>
        <button
          type="submit"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          添加
        </button>
      </div>

      {showTagPicker && allTags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={[
                "rounded-md border px-2 py-1 text-[11px] transition-colors",
                selectedTagIds.includes(tag.id)
                  ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent-light)]"
                  : "border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--text-muted)]",
              ].join(" ")}
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}
