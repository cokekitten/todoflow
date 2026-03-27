"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { DatePopover } from "@/components/calendar/date-popover";
import { CalendarIcon, EnterIcon, TagIcon } from "@/components/icons/ui-icons";
import { notifyTodosChanged, TAGS_CHANGED_EVENT } from "@/lib/todo-events";
import type { Tag } from "@/types";

import { TodoTagPopover } from "./todo-tag-popover";

interface TodoCreateProps {
  date?: string | null;
  defaultTagId?: string | null;
  onCreated: () => void;
}

export function TodoCreate({ date, defaultTagId, onCreated }: TodoCreateProps) {
  const [title, setTitle] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(defaultTagId ?? null);
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  const isDatePage = Boolean(date);
  const isTagPage = Boolean(defaultTagId) && !date;
  const showTagSelector = isDatePage || (!isDatePage && !isTagPage);
  const showDateSelector = isTagPage || (!isDatePage && !isTagPage);

  const effectiveDate = date ?? draftDate;
  const selectedTag = useMemo(
    () => allTags.find((tag) => tag.id === selectedTagId) ?? null,
    [allTags, selectedTagId],
  );

  useEffect(() => {
    function fetchTags() {
      fetch("/api/tags")
        .then((response) => response.json())
        .then((data: Tag[]) => setAllTags(data))
        .catch(() => undefined);
    }

    fetchTags();
    window.addEventListener(TAGS_CHANGED_EVENT, fetchTags);

    return () => window.removeEventListener(TAGS_CHANGED_EVENT, fetchTags);
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
        date: effectiveDate,
        tagIds: selectedTagId ? [selectedTagId] : [],
      }),
    });

    if (!response.ok) {
      return;
    }

    setTitle("");
    setSelectedTagId(defaultTagId ?? null);
    setDraftDate(null);
    setShowTagPicker(false);
    setShowDatePicker(false);
    notifyTodosChanged();
    onCreated();
  }

  function selectTag(tagId: string | null) {
    setSelectedTagId(tagId);
    setShowTagPicker(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-2.5">
        <input
          type="text"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="添加新待办..."
          className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
        />

        {showTagSelector ? (
          <div className="relative flex-shrink-0" data-no-drag="true">
            <button
              ref={tagButtonRef}
              type="button"
              onClick={() => setShowTagPicker((value) => !value)}
              className={[
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] leading-none",
                selectedTag
                  ? "bg-[var(--accent)]/15 text-[var(--accent-light)]"
                  : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              ].join(" ")}
              title="选择标签"
            >
              <TagIcon className="h-3.5 w-3.5" />
              <span className="hidden max-w-[110px] truncate md:inline">
                {selectedTag?.name ?? "标签"}
              </span>
            </button>
            {showTagPicker ? (
              <TodoTagPopover
                tags={allTags}
                selectedTagId={selectedTagId}
                onSelect={selectTag}
                onClose={() => setShowTagPicker(false)}
                anchorRef={tagButtonRef}
              />
            ) : null}
          </div>
        ) : null}

        {showDateSelector ? (
          <div className="relative flex-shrink-0" data-no-drag="true">
            <button
              ref={dateButtonRef}
              type="button"
              onClick={() => setShowDatePicker((value) => !value)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--bg-primary)] px-2.5 text-[11px] leading-none text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="选择日期"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{effectiveDate || "日期"}</span>
            </button>
            {showDatePicker ? (
              <DatePopover
                value={effectiveDate}
                onSelect={setDraftDate}
                onClose={() => setShowDatePicker(false)}
                anchorRef={dateButtonRef}
              />
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          className="rounded-md p-1.5 text-[var(--accent-light)] transition-colors hover:bg-[var(--border-default)]"
          title="提交"
        >
          <EnterIcon className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
