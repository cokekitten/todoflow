"use client";

import { useCallback, useEffect, useState } from "react";

import { TodoCreate } from "@/components/todo/todo-create";
import { TodoList } from "@/components/todo/todo-list";
import { notifyTodosChanged, TAGS_CHANGED_EVENT } from "@/lib/todo-events";
import { useTodoActions } from "@/lib/use-todo-actions";
import type { Todo } from "@/types";

export default function UnscheduledPage() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const fetchTodos = useCallback(() => {
    fetch("/api/todos?unscheduled=true")
      .then((response) => response.json())
      .then((data: Todo[]) => setTodos(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetchTodos();

    function handleTagsChanged() {
      fetchTodos();
    }

    window.addEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
    return () => window.removeEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
  }, [fetchTodos]);

  const { handleToggle, handleDelete, handleUpdate, handleTagIdsChange, handleReorder } =
    useTodoActions(fetchTodos);

  async function handleDateChange(id: string, date: string | null) {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });

    if (!response.ok) {
      return;
    }

    const updated = (await response.json()) as Todo;
    setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
    notifyTodosChanged();
  }

  function onReorder(contextKey: string, ids: string[]) {
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

    void handleReorder(contextKey, ids);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">未安排</h1>
        <span className="text-xs text-[var(--text-muted)]">
          {todos.length} 项无日期待办
        </span>
      </div>
      <TodoCreate onCreated={fetchTodos} />
      <TodoList
        todos={todos}
        groupByTag
        showDate
        enableDragSort
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onTagIdsChange={handleTagIdsChange}
        onDateChange={handleDateChange}
        onReorder={onReorder}
        getGroupContextKey={(tagId) => `unscheduled:tag:${tagId ?? "none"}`}
      />
    </div>
  );
}
