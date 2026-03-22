"use client";

import type { Tag, Todo } from "@/types";

import { TodoItem } from "./todo-item";

interface TodoListProps {
  todos: Todo[];
  groupByTag?: boolean;
  showDate?: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
}

export function TodoList({
  todos,
  groupByTag = false,
  showDate = false,
  onToggle,
  onDelete,
  onUpdate,
}: TodoListProps) {
  if (todos.length === 0) {
    return <div className="py-12 text-center text-sm text-[var(--text-muted)]">暂无待办事项</div>;
  }

  if (!groupByTag) {
    return (
      <div className="flex flex-col gap-1.5">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            showDate={showDate}
            onToggle={onToggle}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    );
  }

  const grouped = new Map<string, { tag: Tag | null; todos: Todo[] }>();
  const ungrouped: Todo[] = [];

  for (const todo of todos) {
    if (todo.tags.length === 0) {
      ungrouped.push(todo);
      continue;
    }

    const primaryTag = todo.tags[0];

    if (!grouped.has(primaryTag.id)) {
      grouped.set(primaryTag.id, { tag: primaryTag, todos: [] });
    }

    grouped.get(primaryTag.id)?.todos.push(todo);
  }

  return (
    <div className="flex flex-col gap-5">
      {Array.from(grouped.values()).map(({ tag, todos: groupTodos }) => (
        <div key={tag?.id}>
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: tag?.color || "var(--accent-light)" }}
          >
            {tag?.name}
          </div>
          <div className="flex flex-col gap-1.5">
            {groupTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                showDate={showDate}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 ? (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            未分类
          </div>
          <div className="flex flex-col gap-1.5">
            {ungrouped.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                showDate={showDate}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
