"use client";

import { useCallback, useEffect, useState } from "react";

import { TodoCreate } from "@/components/todo/todo-create";
import { TodoList } from "@/components/todo/todo-list";
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
  }, [fetchTodos]);

  const { handleToggle, handleDelete, handleUpdate } = useTodoActions(fetchTodos);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">未安排</h1>
        <span className="text-xs text-[var(--text-muted)]">{todos.length} 项无日期待办</span>
      </div>

      <TodoCreate onCreated={fetchTodos} />

      <TodoList
        todos={todos}
        groupByTag
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
