"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type PointerSensorOptions,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { TAGS_CHANGED_EVENT } from "@/lib/todo-events";
import type { Tag, Todo } from "@/types";

import { TodoItem, type TodoItemProps } from "./todo-item";

interface TodoListProps {
  todos: Todo[];
  groupByTag?: boolean;
  showDate?: boolean;
  hideTags?: boolean;
  enableDragSort?: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDateChange?: (id: string, date: string | null) => void;
  onTagIdsChange?: (id: string, tagIds: string[]) => void;
  onReorder?: (ids: string[]) => void;
}

function isDragExempt(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("[data-no-drag='true']"));
}

class TodoPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: React.PointerEvent, options: PointerSensorOptions) => {
        if (!nativeEvent.isPrimary || nativeEvent.button !== 0 || isDragExempt(nativeEvent.target)) {
          return false;
        }

        return PointerSensor.activators[0]?.handler({ nativeEvent } as React.PointerEvent, options) ?? true;
      },
    },
  ];
}

function SortableTodoItem(
  props: Omit<TodoItemProps, "style" | "isDragging" | "sortableProps"> & { id: string },
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  return (
    <TodoItem
      ref={setNodeRef}
      {...props}
      sortableProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    />
  );
}

function TodoGroup({
  todos,
  enableDragSort,
  onReorder,
  itemProps,
}: {
  todos: Todo[];
  enableDragSort: boolean;
  onReorder?: (ids: string[]) => void;
  itemProps: Omit<TodoItemProps, "todo" | "style" | "isDragging" | "sortableProps">;
}) {
  const sensors = useSensors(useSensor(TodoPointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const currentIds = todos.map((todo) => todo.id);
    const oldIndex = currentIds.indexOf(String(active.id));
    const newIndex = currentIds.indexOf(String(over.id));

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reorderedIds = [...currentIds];
    const [moved] = reorderedIds.splice(oldIndex, 1);
    reorderedIds.splice(newIndex, 0, moved);
    onReorder?.(reorderedIds);
  }

  if (!enableDragSort) {
    return (
      <div className="flex flex-col gap-1.5">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} {...itemProps} />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1.5">
          {todos.map((todo) => (
            <SortableTodoItem key={todo.id} id={todo.id} todo={todo} {...itemProps} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function TodoList({
  todos,
  groupByTag = false,
  showDate = false,
  hideTags = false,
  enableDragSort = false,
  onToggle,
  onDelete,
  onUpdate,
  onDateChange,
  onTagIdsChange,
  onReorder,
}: TodoListProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);

  const fetchTags = useCallback(() => {
    fetch("/api/tags")
      .then((response) => response.json())
      .then((data: Tag[]) => setAllTags(data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetchTags();

    function handleTagsChanged() {
      fetchTags();
    }

    window.addEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
    return () => window.removeEventListener(TAGS_CHANGED_EVENT, handleTagsChanged);
  }, [fetchTags]);

  const itemProps = {
    showDate,
    hideTags,
    onToggle,
    onDelete,
    onUpdate,
    onDateChange,
    onTagIdsChange,
    availableTags: allTags,
  };

  const tagOrder = useMemo(() => new Map(allTags.map((tag, index) => [tag.id, index])), [allTags]);

  if (todos.length === 0) {
    return <div className="py-12 text-center text-sm text-[var(--text-muted)]">暂无待办事项</div>;
  }

  if (!groupByTag) {
    return <TodoGroup todos={todos} enableDragSort={enableDragSort} onReorder={onReorder} itemProps={itemProps} />;
  }

  const grouped = new Map<string, { tag: Tag; todos: Todo[] }>();
  const ungrouped: Todo[] = [];

  for (const todo of todos) {
    const primaryTag = todo.tags[0];

    if (!primaryTag) {
      ungrouped.push(todo);
      continue;
    }

    if (!grouped.has(primaryTag.id)) {
      grouped.set(primaryTag.id, { tag: primaryTag, todos: [] });
    }

    grouped.get(primaryTag.id)?.todos.push(todo);
  }

  const sortedGroups = Array.from(grouped.values()).sort(
    (a, b) => (tagOrder.get(a.tag.id) ?? Number.MAX_SAFE_INTEGER) - (tagOrder.get(b.tag.id) ?? Number.MAX_SAFE_INTEGER),
  );

  return (
    <div className="flex flex-col gap-5">
      {sortedGroups.map(({ tag, todos: groupTodos }) => (
        <div key={tag.id}>
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: tag.color || "var(--accent-light)" }}
          >
            {tag.name}
          </div>
          <TodoGroup
            todos={groupTodos}
            enableDragSort={enableDragSort}
            onReorder={onReorder}
            itemProps={itemProps}
          />
        </div>
      ))}

      {ungrouped.length > 0 ? (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            未分类
          </div>
          <TodoGroup
            todos={ungrouped}
            enableDragSort={enableDragSort}
            onReorder={onReorder}
            itemProps={itemProps}
          />
        </div>
      ) : null}
    </div>
  );
}
