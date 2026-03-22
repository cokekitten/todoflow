"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  onReorder?: (ids: string[]) => void;
}

function SortableTodoItem(
  props: Omit<TodoItemProps, "dragHandleProps" | "style" | "isDragging"> & { id: string },
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TodoItem
      ref={setNodeRef}
      {...props}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
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
  onReorder,
}: TodoListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  if (todos.length === 0) {
    return <div className="py-12 text-center text-sm text-[var(--text-muted)]">暂无待办事项</div>;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);
    onReorder?.(reordered.map((t) => t.id));
  }

  const itemProps = {
    showDate,
    hideTags,
    onToggle,
    onDelete,
    onUpdate,
    onDateChange,
  };

  // Flat list mode (no grouping)
  if (!groupByTag) {
    if (enableDragSort) {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              {todos.map((todo) => (
                <SortableTodoItem key={todo.id} id={todo.id} todo={todo} {...itemProps} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      );
    }

    return (
      <div className="flex flex-col gap-1.5">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} {...itemProps} />
        ))}
      </div>
    );
  }

  // Grouped by tag mode
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

  function renderGroup(groupTodos: Todo[]) {
    if (enableDragSort) {
      return (
        <SortableContext items={groupTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {groupTodos.map((todo) => (
              <SortableTodoItem key={todo.id} id={todo.id} todo={todo} {...itemProps} />
            ))}
          </div>
        </SortableContext>
      );
    }
    return (
      <div className="flex flex-col gap-1.5">
        {groupTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} {...itemProps} />
        ))}
      </div>
    );
  }

  const content = (
    <div className="flex flex-col gap-5">
      {Array.from(grouped.values()).map(({ tag, todos: groupTodos }) => (
        <div key={tag?.id ?? "ungrouped"}>
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: tag?.color || "var(--accent-light)" }}
          >
            {tag?.name}
          </div>
          {renderGroup(groupTodos)}
        </div>
      ))}

      {ungrouped.length > 0 ? (
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            未分类
          </div>
          {renderGroup(ungrouped)}
        </div>
      ) : null}
    </div>
  );

  if (enableDragSort) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {content}
      </DndContext>
    );
  }

  return content;
}
