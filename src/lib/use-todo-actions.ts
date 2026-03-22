"use client";

import { useCallback } from "react";

import { notifyTodosChanged } from "./todo-events";

export function useTodoActions(onMutate: () => void) {
  const handleToggle = useCallback(
    async (id: string, completed: boolean) => {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      notifyTodosChanged();
      onMutate();
    },
    [onMutate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      notifyTodosChanged();
      onMutate();
    },
    [onMutate],
  );

  const handleUpdate = useCallback(
    async (id: string, title: string) => {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      notifyTodosChanged();
      onMutate();
    },
    [onMutate],
  );

  const handleDateChange = useCallback(
    async (id: string, date: string | null) => {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      notifyTodosChanged();
      onMutate();
    },
    [onMutate],
  );

  const handleTagIdsChange = useCallback(
    async (id: string, tagIds: string[]) => {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds }),
      });
      notifyTodosChanged();
      onMutate();
    },
    [onMutate],
  );

  const handleReorder = useCallback(
    async (ids: string[]) => {
      await fetch("/api/todos/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      // Don't call onMutate here — the parent already updated local state optimistically
      notifyTodosChanged();
    },
    [],
  );

  return { handleToggle, handleDelete, handleUpdate, handleDateChange, handleTagIdsChange, handleReorder };
}
