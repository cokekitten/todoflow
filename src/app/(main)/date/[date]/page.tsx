"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { TodoCreate } from "@/components/todo/todo-create";
import { TodoList } from "@/components/todo/todo-list";
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

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const { handleToggle, handleDelete, handleUpdate, handleReorder } = useTodoActions(fetchTodos);
  const pendingCount = todos.filter((todo) => todo.completed === 0).length;

  function onReorder(ids: string[]) {
    // Optimistic update
    const idIndexMap = new Map(ids.map((id, i) => [id, i]));
    setTodos((prev) => [...prev].sort((a, b) => (idIndexMap.get(a.id) ?? 0) - (idIndexMap.get(b.id) ?? 0)));
    void handleReorder(ids);
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
        onReorder={onReorder}
      />
    </div>
  );
}
