"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { TodoCreate } from "@/components/todo/todo-create";
import { TodoList } from "@/components/todo/todo-list";
import { TAGS_CHANGED_EVENT } from "@/lib/todo-events";
import { useTodoActions } from "@/lib/use-todo-actions";
import type { Tag, Todo } from "@/types";

export default function TagPage() {
  const params = useParams<{ tagId: string }>();
  const tagId = params.tagId;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tagInfo, setTagInfo] = useState<Tag | null>(null);

  const fetchTodos = useCallback(() => {
    fetch(`/api/todos?tagId=${tagId}`)
      .then((response) => response.json())
      .then((data: Todo[]) => setTodos(data))
      .catch(() => undefined);
  }, [tagId]);

  const fetchTagInfo = useCallback(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((tags: Tag[]) => {
        const found = tags.find((tag) => tag.id === tagId) || null;
        setTagInfo(found);
      })
      .catch(() => undefined);
  }, [tagId]);

  useEffect(() => {
    fetchTodos();
    fetchTagInfo();

    function handleTagsChanged() {
      fetchTodos();
      fetchTagInfo();
    }

    window.addEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
    return () => window.removeEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
  }, [fetchTagInfo, fetchTodos]);

  const { handleToggle, handleDelete, handleUpdate, handleDateChange, handleReorder } =
    useTodoActions(fetchTodos);
  const pendingCount = todos.filter((todo) => todo.completed === 0).length;

  function onReorder(ids: string[]) {
    const reorderedIds = new Set(ids);

    setTodos((prev) => {
      const reorderedTodos = ids
        .map((id) => prev.find((todo) => todo.id === id))
        .filter((todo): todo is Todo => Boolean(todo));

      let reorderedIndex = 0;
      return prev.map((todo) => {
        if (!reorderedIds.has(todo.id)) {
          return todo;
        }

        const nextTodo = reorderedTodos[reorderedIndex];
        reorderedIndex += 1;
        return nextTodo ?? todo;
      });
    });

    void handleReorder(ids);
  }

  return (
    <div>
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {tagInfo ? (
              <span
                className="mr-2 inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: tagInfo.color || "#7c3aed" }}
              />
            ) : null}
            {tagInfo?.name || "标签"}
          </h1>
          <span className="text-xs text-[var(--text-muted)]">{pendingCount} 项待办</span>
        </div>
      </div>
      <TodoCreate defaultTagId={tagId} onCreated={fetchTodos} />
      <TodoList
        todos={todos}
        showDate
        hideTags
        enableDragSort
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onDateChange={handleDateChange}
        onReorder={onReorder}
      />
    </div>
  );
}
