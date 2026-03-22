"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { TodoCreate } from "@/components/todo/todo-create";
import { TodoList } from "@/components/todo/todo-list";
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

  useEffect(() => {
    fetchTodos();
    fetch("/api/tags")
      .then((response) => response.json())
      .then((tags: Tag[]) => {
        const found = tags.find((tag) => tag.id === tagId) || null;
        setTagInfo(found);
      })
      .catch(() => undefined);
  }, [fetchTodos, tagId]);

  const { handleToggle, handleDelete, handleUpdate } = useTodoActions(fetchTodos);
  const pendingCount = todos.filter((todo) => todo.completed === 0).length;

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
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
