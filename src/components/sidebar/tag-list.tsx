"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { Tag } from "@/types";

export function TagList() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const activeTagId = pathname.startsWith("/tag/") ? pathname.slice(5) : null;

  useEffect(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((data: Tag[]) => setTags(data))
      .catch(() => undefined);
  }, []);

  async function handleCreate() {
    if (!newName.trim()) {
      return;
    }

    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (!response.ok) {
      return;
    }

    const tag = (await response.json()) as Tag;
    setTags((current) => [...current, tag]);
    setNewName("");
    setIsCreating(false);
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
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleCreate();
              }

              if (event.key === "Escape") {
                setIsCreating(false);
              }
            }}
            placeholder="标签名称"
            autoFocus
            className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-primary)] px-2 py-1 text-xs focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => router.push(`/tag/${tag.id}`)}
            className={[
              "rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
              activeTagId === tag.id
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
        ))}
      </div>
    </div>
  );
}
