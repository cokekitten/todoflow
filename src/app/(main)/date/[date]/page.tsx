"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { TodoCreate } from "@/components/todo/todo-create";
import { TodoList } from "@/components/todo/todo-list";
import { TAGS_CHANGED_EVENT } from "@/lib/todo-events";
import { useTodoActions } from "@/lib/use-todo-actions";
import type { Todo } from "@/types";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function DatePage() {
  const params = useParams<{ date: string }>();
  const date = params.date;
  const [todos, setTodos] = useState<Todo[]>([]);
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;
  const currentDate = new Date(`${date}T00:00:00`);
  const dateLabel = `${currentDate.getMonth() + 1}月${currentDate.getDate()}日 ${WEEKDAYS[currentDate.getDay()]}`;

  const fetchTodos = useCallback(() => {
    fetch(`/api/todos?date=${date}`)
      .then((response) => response.json())
      .then((data: Todo[]) => setTodos(data))
      .catch(() => undefined);
  }, [date]);

  useEffect(() => {
    fetchTodos();

    function handleTagsChanged() {
      fetchTodos();
    }

    window.addEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
    return () => window.removeEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
  }, [fetchTodos]);

  const { handleToggle, handleDelete, handleUpdate, handleTagIdChange, handleReorder } =
    useTodoActions(fetchTodos);
  const pendingCount = todos.filter((todo) => todo.completed === 0).length;

  async function onTagIdChange(id: string, tagId: string | null) {
    const updated = (await handleTagIdChange(id, tagId)) as Todo | null;
    if (updated) {
      setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
    }
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
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-bold">{dateLabel}</h1>
          <span className="text-xs text-[var(--text-muted)]">
            {isToday ? "今天 · " : ""}{pendingCount} 项待办
          </span>
        </div>
      </div>
      <TodoCreate date={date} onCreated={fetchTodos} />
      <TodoList
        todos={todos}
        groupByTag
        enableDragSort
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onTagIdChange={onTagIdChange}
        onReorder={onReorder}
        getGroupContextKey={(tagId) => `date:${date}:tag:${tagId ?? "none"}`}
      />
    </div>
  );
}
