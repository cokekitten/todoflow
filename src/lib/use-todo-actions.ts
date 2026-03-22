"use client";

import { useCallback } from "react";

export function useTodoActions(onMutate: () => void) {
  const handleToggle = useCallback(
    async (id: string, completed: boolean) => {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      onMutate();
    },
    [onMutate],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
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
      onMutate();
    },
    [onMutate],
  );

  return { handleToggle, handleDelete, handleUpdate };
}
