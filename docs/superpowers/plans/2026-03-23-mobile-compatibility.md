# TodoFlow 移动端兼容性 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 TodoFlow 在手机端（≤768px）可用且体验良好，包括响应式布局、侧边栏抽屉化、触摸友好交互、合适的点击目标尺寸。

**Architecture:** 使用 Tailwind 的 `md:` 断点（768px）区分移动端和桌面端。移动端隐藏双侧边栏，改为从屏幕边缘滑入的抽屉（Drawer）+ 半透明遮罩。新增一个移动端专属 Header 组件用于触发抽屉和显示页面标题。触摸交互方面：为 dnd-kit 添加 TouchSensor、删除按钮在移动端常驻可见、双击编辑改为单击编辑、标签右键菜单增加长按和可见按钮触发方式、所有点击目标增加 padding 达到至少 44px 触摸区域。

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, @dnd-kit/core v6

**Breakpoint strategy:** `md:` (768px) — 768px 以下为移动端，768px 及以上保持现有桌面布局不变。

---

## File Structure

### New Files
| File | Responsibility |
|---|---|
| `src/components/layout/mobile-header.tsx` | 移动端顶部栏：汉堡菜单按钮、页面标题、右侧信息按钮 |
| `src/components/layout/sidebar-drawer.tsx` | 通用抽屉组件：遮罩 + 滑入面板，支持左/右方向 |
| `src/components/layout/mobile-layout-provider.tsx` | 移动端布局状态管理（Context），控制左右抽屉的开关 |
| `src/lib/use-is-mobile.ts` | 自定义 hook，基于 `matchMedia('(max-width: 767px)')` 判断是否移动端 |

### Modified Files
| File | Changes |
|---|---|
| `src/app/(main)/layout.tsx` | 引入 MobileLayoutProvider，条件渲染 MobileHeader + 桌面侧栏/抽屉侧栏 |
| `src/components/sidebar/left-sidebar.tsx` | 接受 `onClose` prop，移动端模式下显示关闭按钮 |
| `src/components/sidebar/right-sidebar.tsx` | 接受 `onClose` prop，移动端模式下显示关闭按钮 |
| `src/components/todo/todo-item.tsx` | 删除按钮移动端可见、双击改单击编辑、checkbox 增大触摸区域 |
| `src/components/todo/todo-list.tsx` | 添加 TouchSensor |
| `src/components/sidebar/tag-list.tsx` | 添加 TouchSensor、移除 touch-none、长按触发上下文菜单、增加可见菜单按钮 |
| `src/components/sidebar/tag-context-menu.tsx` | mousedown → pointerdown、移动端居中/底部展示 |
| `src/components/sidebar/color-palette.tsx` | 增大色块尺寸 |
| `src/components/sidebar/right-sidebar-todo-item.tsx` | checkbox 增大触摸区域 |
| `src/components/todo/todo-create.tsx` | 移动端输入区域自适应 |
| `src/components/calendar/date-popover.tsx` | mousedown → pointerdown、移动端定位优化 |
| `src/components/todo/todo-tag-popover.tsx` | mousedown → pointerdown、移动端定位优化 |
| `src/components/calendar/calendar.tsx` | 日历格子增大触摸区域、mousedown → pointerdown |
| `src/components/calendar/month-picker.tsx` | 移动端按钮增大 |
| `src/components/calendar/year-picker.tsx` | 移动端按钮增大 |
| `src/app/(main)/date/[date]/page.tsx` | 响应式 padding |
| `src/app/(main)/tag/[tagId]/page.tsx` | 响应式 padding |
| `src/app/(main)/unscheduled/page.tsx` | 响应式 padding |
| `src/app/globals.css` | 添加移动端相关全局样式 |
| `src/components/icons/ui-icons.tsx` | 添加 MenuIcon（汉堡菜单）和 InfoIcon（信息按钮）图标 |

---

## Chunk 1: 基础设施 — useIsMobile hook + 图标 + 全局样式

### Task 1: 创建 useIsMobile hook

**Files:**
- Create: `src/lib/use-is-mobile.ts`

- [ ] **Step 1: 创建 useIsMobile hook**

```typescript
// src/lib/use-is-mobile.ts
"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 767;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mql.matches);

    function handleChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
```

- [ ] **Step 2: 验证文件创建成功**

Run: `cat src/lib/use-is-mobile.ts`
Expected: 文件内容正确显示

### Task 2: 添加移动端需要的图标

**Files:**
- Modify: `src/components/icons/ui-icons.tsx:127-141`（文件末尾追加）

- [ ] **Step 1: 在 ui-icons.tsx 末尾添加 MenuIcon 和 InfoIcon**

在 `ChevronDownIcon` 后面追加：

```typescript
export function MenuIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </BaseIcon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 8v.5M12 11v5" />
    </BaseIcon>
  );
}
```

### Task 3: 全局样式补充

**Files:**
- Modify: `src/app/globals.css:85-104`（文件末尾追加）

- [ ] **Step 1: 添加移动端全局样式**

在 globals.css 末尾追加：

```css
/* Disable touch callout and text selection on interactive elements for mobile */
@media (max-width: 767px) {
  button,
  [role="button"] {
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
  }
}

/* Drawer overlay transition */
.drawer-overlay {
  transition: opacity 200ms ease-out;
}

/* Drawer panel transition */
.drawer-panel {
  transition: transform 200ms ease-out;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/use-is-mobile.ts src/components/icons/ui-icons.tsx src/app/globals.css
git commit -m "feat: add mobile infrastructure (useIsMobile hook, icons, global styles)"
```

---

## Chunk 2: 布局系统 — MobileLayoutProvider + SidebarDrawer + MobileHeader + 主布局改造

### Task 4: 创建 MobileLayoutProvider（状态管理）

**Files:**
- Create: `src/components/layout/mobile-layout-provider.tsx`

- [ ] **Step 1: 创建 MobileLayoutProvider**

```typescript
// src/components/layout/mobile-layout-provider.tsx
"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface MobileLayoutContextValue {
  leftOpen: boolean;
  rightOpen: boolean;
  openLeft: () => void;
  openRight: () => void;
  closeLeft: () => void;
  closeRight: () => void;
  closeAll: () => void;
}

const MobileLayoutContext = createContext<MobileLayoutContextValue>({
  leftOpen: false,
  rightOpen: false,
  openLeft: () => undefined,
  openRight: () => undefined,
  closeLeft: () => undefined,
  closeRight: () => undefined,
  closeAll: () => undefined,
});

export function useMobileLayout() {
  return useContext(MobileLayoutContext);
}

export function MobileLayoutProvider({ children }: { children: React.ReactNode }) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const openLeft = useCallback(() => {
    setRightOpen(false);
    setLeftOpen(true);
  }, []);

  const openRight = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(true);
  }, []);

  const closeLeft = useCallback(() => setLeftOpen(false), []);
  const closeRight = useCallback(() => setRightOpen(false), []);
  const closeAll = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, []);

  return (
    <MobileLayoutContext.Provider
      value={{ leftOpen, rightOpen, openLeft, openRight, closeLeft, closeRight, closeAll }}
    >
      {children}
    </MobileLayoutContext.Provider>
  );
}
```

### Task 5: 创建 SidebarDrawer 组件

**Files:**
- Create: `src/components/layout/sidebar-drawer.tsx`

- [ ] **Step 1: 创建 SidebarDrawer**

```typescript
// src/components/layout/sidebar-drawer.tsx
"use client";

import { useEffect } from "react";

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  children: React.ReactNode;
}

export function SidebarDrawer({ open, onClose, side, children }: SidebarDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <div
      className={[
        "fixed inset-0 z-40",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
    >
      {/* Backdrop */}
      <div
        className={[
          "drawer-overlay absolute inset-0 bg-black/50",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={[
          "drawer-panel absolute top-0 bottom-0 flex flex-col overflow-y-auto",
          side === "left" ? "left-0 w-[280px]" : "right-0 w-[300px]",
          side === "left"
            ? open ? "translate-x-0" : "-translate-x-full"
            : open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
```

### Task 6: 创建 MobileHeader 组件

**Files:**
- Create: `src/components/layout/mobile-header.tsx`

- [ ] **Step 1: 创建 MobileHeader**

```typescript
// src/components/layout/mobile-header.tsx
"use client";

import { usePathname } from "next/navigation";

import { InfoIcon, MenuIcon } from "@/components/icons/ui-icons";
import { useMobileLayout } from "./mobile-layout-provider";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/date/")) {
    const dateStr = pathname.slice(6);
    try {
      const date = new Date(`${dateStr}T00:00:00`);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAYS[date.getDay()]}`;
    } catch {
      return "待办";
    }
  }

  if (pathname.startsWith("/tag/")) {
    return "标签"; // 标签名会在页面内显示
  }

  if (pathname === "/unscheduled") {
    return "未安排";
  }

  return "TodoFlow";
}

export function MobileHeader() {
  const { openLeft, openRight } = useMobileLayout();
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-sidebar-left)] px-4 md:hidden">
      <button
        type="button"
        onClick={openLeft}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] active:bg-[var(--border-default)]"
        aria-label="打开菜单"
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold">{title}</span>
      <button
        type="button"
        onClick={openRight}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] active:bg-[var(--border-default)]"
        aria-label="查看概览"
      >
        <InfoIcon className="h-5 w-5" />
      </button>
    </header>
  );
}
```

### Task 7: 改造主布局 (main)/layout.tsx

**Files:**
- Modify: `src/app/(main)/layout.tsx`（完全重写）

- [ ] **Step 1: 重写主布局**

将 `src/app/(main)/layout.tsx` 替换为：

```typescript
"use client";

import { LeftSidebar } from "@/components/sidebar/left-sidebar";
import { RightSidebar } from "@/components/sidebar/right-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileLayoutProvider, useMobileLayout } from "@/components/layout/mobile-layout-provider";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { useIsMobile } from "@/lib/use-is-mobile";

function MainLayoutInner({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { leftOpen, rightOpen, closeLeft, closeRight } = useMobileLayout();

  if (isMobile) {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
          {children}
        </main>

        <SidebarDrawer open={leftOpen} onClose={closeLeft} side="left">
          <LeftSidebar onClose={closeLeft} />
        </SidebarDrawer>

        <SidebarDrawer open={rightOpen} onClose={closeRight} side="right">
          <RightSidebar onClose={closeRight} />
        </SidebarDrawer>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-8 py-6">
        {children}
      </main>
      <RightSidebar />
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileLayoutProvider>
      <MainLayoutInner>{children}</MainLayoutInner>
    </MobileLayoutProvider>
  );
}
```

注意：这个文件需要从 server component 改成 client component（添加 `"use client"`），因为要使用 hooks。

### Task 8: 修改 LeftSidebar 支持 onClose

**Files:**
- Modify: `src/components/sidebar/left-sidebar.tsx`

- [ ] **Step 1: 添加 onClose prop 并在移动端显示关闭按钮和导航链接关闭抽屉**

修改 `LeftSidebar` 接受可选的 `onClose` prop：

```typescript
// 修改函数签名
export function LeftSidebar({ onClose }: { onClose?: () => void } = {}) {
```

在 aside 标签的 className 中：
- 原来：`className="flex w-[220px] flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--border-default)] bg-[var(--bg-sidebar-left)] p-4"`
- 改为：`className={["flex flex-shrink-0 flex-col gap-4 overflow-y-auto bg-[var(--bg-sidebar-left)] p-4", onClose ? "w-full" : "w-[220px] border-r border-[var(--border-default)]"].join(" ")}`

这样移动端（通过 Drawer 传入 onClose）时 sidebar 占满 drawer 宽度且无右边框，桌面端保持原样。

另外需要在组件内部包装 `router.push` 的导航行为（Calendar 和 TagList 的导航点击后自动关闭抽屉）。最简单的方式是监听 pathname 变化来关闭。在组件顶部添加：

```typescript
import { usePathname } from "next/navigation";

// 在函数体内部添加：
const pathname = usePathname();
const prevPathRef = useRef(pathname);

useEffect(() => {
  if (prevPathRef.current !== pathname && onClose) {
    onClose();
  }
  prevPathRef.current = pathname;
}, [pathname, onClose]);
```

### Task 9: 修改 RightSidebar 支持 onClose

**Files:**
- Modify: `src/components/sidebar/right-sidebar.tsx`

- [ ] **Step 1: 添加 onClose prop**

修改函数签名：
```typescript
export function RightSidebar({ onClose }: { onClose?: () => void } = {}) {
```

修改 aside 的 className：
- 原来：`className="w-[260px] flex-shrink-0 overflow-y-auto border-l border-[var(--border-default)] bg-[var(--bg-sidebar-right)] p-5"`
- 改为：`className={["flex-shrink-0 overflow-y-auto bg-[var(--bg-sidebar-right)] p-5", onClose ? "w-full" : "w-[260px] border-l border-[var(--border-default)]"].join(" ")}`

同样添加 pathname 变化关闭逻辑（因为右侧栏有 Link 元素）：

```typescript
import { usePathname } from "next/navigation";

// 在函数体内部（已有 useEffect 等 hook 之后）添加：
const pathname = usePathname();
const prevPathRef = useRef(pathname);

useEffect(() => {
  if (prevPathRef.current !== pathname && onClose) {
    onClose();
  }
  prevPathRef.current = pathname;
}, [pathname, onClose]);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/ src/app/\(main\)/layout.tsx src/components/sidebar/left-sidebar.tsx src/components/sidebar/right-sidebar.tsx
git commit -m "feat: responsive layout with mobile drawers for sidebars"
```

---

## Chunk 3: Todo 交互改造 — 删除按钮、编辑模式、拖拽触摸

### Task 10: TodoItem — 删除按钮移动端可见 + 编辑触发改为单击

**Files:**
- Modify: `src/components/todo/todo-item.tsx:231-240`（删除按钮区域）
- Modify: `src/components/todo/todo-item.tsx:145-153`（标题区域）
- Modify: `src/components/todo/todo-item.tsx:110-122`（checkbox 区域）

- [ ] **Step 1: 删除按钮 — 移动端始终可见**

将 todo-item.tsx 第 236 行删除按钮的 className 从：

```
"invisible absolute inset-0 opacity-0 text-[var(--text-dim)] transition-[opacity,color,visibility] duration-100 group-hover:visible group-hover:opacity-100 hover:text-[var(--danger)]"
```

改为：

```
"absolute inset-0 text-[var(--text-dim)] transition-[opacity,color,visibility] duration-100 md:invisible md:opacity-0 md:group-hover:visible md:group-hover:opacity-100 hover:text-[var(--danger)]"
```

这样在移动端（<768px）按钮始终可见，桌面端保持 hover 才显示。

- [ ] **Step 2: 标题编辑 — 移动端单击进入编辑**

将第 146 行 `onDoubleClick={() => setIsEditing(true)}` 改为同时支持单击（移动端）和双击（桌面端）：

```typescript
// 在组件顶部添加 ref
const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// 替换 span 的事件处理
<span
  onClick={() => {
    // 移动端用单击，桌面端用双击
    if (window.matchMedia("(max-width: 767px)").matches) {
      setIsEditing(true);
      setEditTitle(todo.title);
    }
  }}
  onDoubleClick={() => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    setIsEditing(true);
    setEditTitle(todo.title);
  }}
  className={[
    "flex-1 cursor-text text-[13px]",
    isCompleted ? "text-[var(--text-muted)] line-through" : "",
  ].join(" ")}
>
```

注意：`cursor-text` 提示用户可以点击编辑。

- [ ] **Step 3: Checkbox 触摸区域增大**

当前 checkbox 是 `h-4 w-4` (16px)，为按钮增加更大的触摸 padding。

将第 110-122 行 checkbox button 修改：

```typescript
<button
  type="button"
  data-no-drag="true"
  onClick={() => onToggle(todo.id, !isCompleted)}
  className={[
    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-[border-color,background-color,color] duration-75",
    // 外层添加更大的触摸区域
    "before:absolute before:inset-[-8px] before:content-[''] relative",
    isCompleted
      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
      : "border-[var(--text-dim)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/8",
  ].join(" ")}
>
  {isCompleted ? <CheckIcon className="h-2.5 w-2.5" /> : null}
</button>
```

实际上用 `before:` pseudo 做无形的触摸区扩大不太好用于 button 元素。更简洁的做法是直接增大 button 的 padding：

将 checkbox button 改为：

```typescript
<button
  type="button"
  data-no-drag="true"
  onClick={() => onToggle(todo.id, !isCompleted)}
  className="relative flex-shrink-0 p-1.5"
>
  <span
    className={[
      "flex h-4 w-4 items-center justify-center rounded border-2 transition-[border-color,background-color,color] duration-75",
      isCompleted
        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
        : "border-[var(--text-dim)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/8",
    ].join(" ")}
  >
    {isCompleted ? <CheckIcon className="h-2.5 w-2.5" /> : null}
  </span>
</button>
```

button 有 `p-1.5`（6px 每侧），加上内部 16px = 28px。再配合 todo 行本身的 padding，总触摸区域足够。同时为保持视觉不变，调整 todo item 外层 gap。

将 todo-item 外层 className 中 `gap-2` 改为 `gap-1`（因为 checkbox button 现在自带 padding 了）。

### Task 11: TodoList — 添加 TouchSensor

**Files:**
- Modify: `src/components/todo/todo-list.tsx:1-18`（import 区域）
- Modify: `src/components/todo/todo-list.tsx:94`（sensors 定义）

- [ ] **Step 1: 添加 TouchSensor import**

在 import 区域（第 6 行）添加 `TouchSensor`：

```typescript
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type PointerSensorOptions,
} from "@dnd-kit/core";
```

- [ ] **Step 2: 在 sensors 中添加 TouchSensor**

将第 94 行：
```typescript
const sensors = useSensors(useSensor(TodoPointerSensor, { activationConstraint: { distance: 6 } }));
```

改为：
```typescript
const sensors = useSensors(
  useSensor(TodoPointerSensor, { activationConstraint: { distance: 6 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
);
```

TouchSensor 使用 `delay: 200` 意味着用户需要长按 200ms 才激活拖拽，这样正常滚动不会误触发。`tolerance: 5` 允许手指在 200ms 内有 5px 微移动（手指抖动），超过则取消。

- [ ] **Step 3: Commit**

```bash
git add src/components/todo/todo-item.tsx src/components/todo/todo-list.tsx
git commit -m "feat: mobile-friendly todo item (visible delete, tap to edit, touch drag)"
```

---

## Chunk 4: 标签交互改造 — 长按菜单、TouchSensor、移除 touch-none

### Task 12: TagList — TouchSensor + 移除 touch-none + 长按菜单

**Files:**
- Modify: `src/components/sidebar/tag-list.tsx`

- [ ] **Step 1: 添加 TouchSensor import**

在 import 区域添加 `TouchSensor`：

```typescript
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
```

- [ ] **Step 2: 在 sensors 中添加 TouchSensor**

将第 90 行：
```typescript
const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
```

改为：
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
);
```

- [ ] **Step 3: 移除 SortableTagItem 的 touch-none 并添加长按菜单**

将 `SortableTagItem` 组件修改：

1. 移除第 57 行 `className="touch-none"`
2. 添加 long-press 处理来触发上下文菜单

修改后的 `SortableTagItem`：

```typescript
function SortableTagItem({
  tag,
  isActive,
  onClick,
  onContextMenu,
}: {
  tag: Tag;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (event: React.MouseEvent | { clientX: number; clientY: number }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tag.id,
  });
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMoved = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    touchMoved.current = false;
    const touch = e.touches[0];
    longPressRef.current = setTimeout(() => {
      if (!touchMoved.current) {
        onContextMenu({ clientX: touch.clientX, clientY: touch.clientY });
      }
    }, 500);
  }

  function handleTouchMove() {
    touchMoved.current = true;
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  function handleTouchEnd() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={[
          "w-full rounded-md px-2 py-2 text-left text-xs transition-colors",
          isActive
            ? "bg-[var(--accent)] text-white"
            : "text-[var(--text-secondary)] hover:bg-[var(--border-default)]",
        ].join(" ")}
      >
        <span
          className="mr-2 inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: tag.color || "#7c3aed" }}
        />
        {tag.name}
      </button>
    </div>
  );
}
```

注意：`py-1.5` 改为 `py-2`，增大触摸区域。

- [ ] **Step 4: 更新 handleContextMenu 类型**

将 `handleContextMenu` 支持非 MouseEvent 的调用：

```typescript
function handleContextMenu(event: React.MouseEvent | { clientX: number; clientY: number }, tag: Tag) {
  if ("preventDefault" in event) {
    event.preventDefault();
  }
  setContextMenu({ tag, x: event.clientX, y: event.clientY });
}
```

同时更新 `SortableTagItem` 的 `onContextMenu` prop 调用处，把 `(event) => handleContextMenu(event, tag)` 改为 `(event) => handleContextMenu(event as React.MouseEvent, tag)` 或调整类型兼容。

### Task 13: TagContextMenu — pointerdown + 移动端友好

**Files:**
- Modify: `src/components/sidebar/tag-context-menu.tsx:31-39`

- [ ] **Step 1: mousedown 改 pointerdown**

将第 38 行：
```typescript
document.addEventListener("mousedown", handleClickOutside);
return () => document.removeEventListener("mousedown", handleClickOutside);
```

改为：
```typescript
document.addEventListener("pointerdown", handleClickOutside);
return () => document.removeEventListener("pointerdown", handleClickOutside);
```

同时将 `handleClickOutside` 的参数类型从 `MouseEvent` 改为 `PointerEvent`。

- [ ] **Step 2: 移动端居中展示**

将第 79-85 行的定位逻辑改为移动端居中：

```typescript
const isMobileView = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

const style: React.CSSProperties = isMobileView
  ? {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 50,
    }
  : {
      position: "fixed",
      left: position.x,
      top: position.y,
      zIndex: 50,
    };
```

- [ ] **Step 3: 增大菜单按钮的触摸区域**

将菜单按钮的 `py-2` 改为 `py-2.5`（第 95、103、112 行），使菜单项更容易点击。

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar/tag-list.tsx src/components/sidebar/tag-context-menu.tsx
git commit -m "feat: mobile-friendly tag interactions (long-press menu, touch drag)"
```

---

## Chunk 5: 弹出层和小组件触摸优化

### Task 14: DatePopover — pointerdown + 移动端定位

**Files:**
- Modify: `src/components/calendar/date-popover.tsx:77-117`

- [ ] **Step 1: mousedown 改 pointerdown**

将第 107 行：
```typescript
document.addEventListener("mousedown", handlePointerDown);
```
改为：
```typescript
document.addEventListener("pointerdown", handlePointerDown);
```

第 112 行：
```typescript
document.removeEventListener("mousedown", handlePointerDown);
```
改为：
```typescript
document.removeEventListener("pointerdown", handlePointerDown);
```

同时将 `handlePointerDown` 的参数类型从 `MouseEvent` 改为 `PointerEvent`。

- [ ] **Step 2: 移动端居中定位**

修改 `useLayoutEffect` 中的定位逻辑，移动端居中展示：

```typescript
useLayoutEffect(() => {
  const anchor = anchorRef?.current;
  if (!anchor) return;

  const isMobileView = window.matchMedia("(max-width: 767px)").matches;
  if (isMobileView) {
    // 移动端：水平居中，垂直偏上
    setPosition({
      top: Math.max(60, (window.innerHeight - 320) / 2),
      left: Math.max(12, (window.innerWidth - POPOVER_WIDTH) / 2),
    });
    return;
  }

  const rect = anchor.getBoundingClientRect();
  const nextLeft = align === "right" ? rect.right - POPOVER_WIDTH : rect.left;
  setPosition({
    top: rect.bottom + 8,
    left: Math.max(12, Math.min(nextLeft, window.innerWidth - POPOVER_WIDTH - 12)),
  });
}, [align, anchorRef]);
```

同样更新 `handleReposition` 函数中的逻辑。

- [ ] **Step 3: 日历日期格子增大触摸区域**

将第 198 行的日期按钮 `py-1.5` 改为 `py-2`，使每个日期格子更高。

### Task 15: TodoTagPopover — pointerdown + 移动端定位

**Files:**
- Modify: `src/components/todo/todo-tag-popover.tsx:34-72`

- [ ] **Step 1: mousedown 改 pointerdown**

将第 63 行：
```typescript
document.addEventListener("mousedown", handlePointerDown);
```
改为：
```typescript
document.addEventListener("pointerdown", handlePointerDown);
```

第 69 行相应修改 removeEventListener。参数类型从 `MouseEvent` 改为 `PointerEvent`。

- [ ] **Step 2: 移动端定位优化**

```typescript
useLayoutEffect(() => {
  const anchor = anchorRef?.current;
  if (!anchor) return;

  const isMobileView = window.matchMedia("(max-width: 767px)").matches;
  if (isMobileView) {
    setPosition({
      top: Math.max(60, (window.innerHeight - 280) / 2),
      left: Math.max(12, (window.innerWidth - POPOVER_WIDTH) / 2),
    });
    return;
  }

  const rect = anchor.getBoundingClientRect();
  setPosition({
    top: rect.bottom + 8,
    left: Math.max(12, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 12)),
  });
}, [anchorRef]);
```

- [ ] **Step 3: 标签选项增大触摸区域**

将标签选项按钮的 `py-1.5` 改为 `py-2`（第 90、112 行）。

### Task 16: ColorPalette — 增大色块

**Files:**
- Modify: `src/components/sidebar/color-palette.tsx:25-38`

- [ ] **Step 1: 色块从 h-5 w-5 增大到 h-7 w-7**

```typescript
<div className="grid grid-cols-6 gap-2 p-1">
  {PRESET_COLORS.map((color) => (
    <button
      key={color}
      type="button"
      onClick={() => onSelect(color)}
      className={[
        "h-7 w-7 rounded-full transition-transform hover:scale-110",
        currentColor === color ? "ring-2 ring-white ring-offset-1 ring-offset-[var(--bg-card)]" : "",
      ].join(" ")}
      style={{ backgroundColor: color }}
      title={color}
    />
  ))}
</div>
```

变化：`h-5 w-5` → `h-7 w-7`（20px → 28px），`gap-1.5` → `gap-2`，`hover:scale-125` → `hover:scale-110`（大了之后 scale 小一些）。

### Task 17: RightSidebarTodoItem — checkbox 触摸区域

**Files:**
- Modify: `src/components/sidebar/right-sidebar-todo-item.tsx:34-48`

- [ ] **Step 1: 增大 checkbox 触摸区域**

用和 TodoItem 同样的思路，外包一层 button padding：

```typescript
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    onToggle(todo.id, !isCompleted);
  }}
  className="relative flex-shrink-0 p-1"
>
  <span
    className={[
      "flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors",
      isCompleted
        ? "border-[var(--accent)] bg-[var(--accent)] text-white"
        : "border-[var(--text-dim)] hover:border-[var(--accent)]",
    ].join(" ")}
  >
    {isCompleted ? <CheckIcon className="h-2 w-2" /> : null}
  </span>
</button>
```

### Task 18: Calendar — 触摸区域 + pointerdown

**Files:**
- Modify: `src/components/calendar/calendar.tsx:86-94`（click outside）
- Modify: `src/components/calendar/calendar.tsx:180-203`（days grid）

- [ ] **Step 1: mousedown → pointerdown**

将第 93 行：
```typescript
document.addEventListener("mousedown", handleClickOutside);
return () => document.removeEventListener("mousedown", handleClickOutside);
```
改为：
```typescript
document.addEventListener("pointerdown", handleClickOutside);
return () => document.removeEventListener("pointerdown", handleClickOutside);
```

参数类型从 `MouseEvent` 改为 `PointerEvent`。

- [ ] **Step 2: 日历格子增大触摸区域**

将第 191 行 day button 的 `py-1` 改为 `py-1.5`，使日期按钮更高：

```
"relative rounded-sm py-1.5 transition-colors hover:bg-[var(--border-default)]",
```

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar/date-popover.tsx src/components/todo/todo-tag-popover.tsx src/components/sidebar/color-palette.tsx src/components/sidebar/right-sidebar-todo-item.tsx src/components/calendar/calendar.tsx
git commit -m "feat: touch-friendly popovers, color palette, sidebar items, calendar"
```

---

## Chunk 6: 页面级调整 + TodoCreate 适配

### Task 19: 页面响应式 padding

**Files:**
- Modify: `src/app/(main)/date/[date]/page.tsx` — 无需改动（padding 在 layout 中控制）
- Modify: `src/app/(main)/tag/[tagId]/page.tsx` — 无需改动
- Modify: `src/app/(main)/unscheduled/page.tsx` — 无需改动

由于 Chunk 2 中已经将移动端主内容区的 padding 改为 `px-4 py-4`（在 layout.tsx 中），页面本身不需要额外修改 padding。

但页面标题的 `text-xl` 在移动端可以稍小一点。这是可选的微调，不是必须的，暂不修改。

### Task 20: TodoCreate 移动端适配

**Files:**
- Modify: `src/components/todo/todo-create.tsx:88-157`

- [ ] **Step 1: 移动端标签/日期选择器文字隐藏，只显示图标**

在移动端，输入区域的标签和日期选择器可以只显示图标（隐藏文字），节省空间：

将标签按钮（第 106 行）中的 `<span>` 部分：
```typescript
<span className="max-w-[110px] truncate">
  {selectedTag?.name ?? "标签"}
</span>
```
改为：
```typescript
<span className="hidden max-w-[110px] truncate md:inline">
  {selectedTag?.name ?? "标签"}
</span>
```

将日期按钮（第 136 行）中的 `<span>` 部分：
```typescript
<span>{effectiveDate || "日期"}</span>
```
改为：
```typescript
<span className="hidden md:inline">{effectiveDate || "日期"}</span>
```

这样移动端只显示图标，桌面端显示图标 + 文字。

同时，当选中了标签或日期时，移动端也应该有视觉反馈。给按钮添加选中态颜色变化：

标签按钮（第 106 行）增加条件样式：
```typescript
className={[
  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] leading-none",
  selectedTag
    ? "bg-[var(--accent)]/15 text-[var(--accent-light)]"
    : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
].join(" ")}
```

### Task 21: MonthPicker / YearPicker 触摸区域微调

**Files:**
- Modify: `src/components/calendar/month-picker.tsx:14`
- Modify: `src/components/calendar/year-picker.tsx:14`

- [ ] **Step 1: 增大按钮 padding**

MonthPicker 第 24 行 `px-2 py-2` 已经合适（32px+ 高度），无需修改。

YearPicker 第 24 行 `px-2 py-2` 同样已经合适。

这两个组件无需修改，按钮尺寸已经够用。

- [ ] **Step 2: 最终 Commit**

```bash
git add src/components/todo/todo-create.tsx
git commit -m "feat: responsive todo create form for mobile"
```

---

## Chunk 7: 测试和验证

### Task 22: 手动测试清单

- [ ] **Step 1: 使用浏览器 DevTools 模拟移动设备（iPhone 14, 390x844）测试以下场景**

1. **布局**
   - [ ] 页面加载时两个侧边栏均隐藏，只显示主内容 + 顶部 Header
   - [ ] 点击汉堡菜单，左侧栏从左边滑出，遮罩可见
   - [ ] 点击遮罩或内部导航链接后，左抽屉关闭
   - [ ] 点击信息按钮，右侧栏从右边滑出
   - [ ] 点击遮罩关闭右抽屉
   - [ ] 在侧栏中导航到不同页面时，抽屉自动关闭

2. **Todo 操作**
   - [ ] Checkbox 可以正常点击（触摸区域足够大）
   - [ ] 单击 todo 标题进入编辑模式
   - [ ] 删除按钮始终可见
   - [ ] 长按 todo 项可以拖拽排序
   - [ ] 正常滚动不会触发拖拽

3. **标签操作**
   - [ ] 长按标签项弹出上下文菜单
   - [ ] 上下文菜单在屏幕中央显示
   - [ ] 重命名、改色、删除均可操作
   - [ ] 标签拖拽排序正常

4. **弹出层**
   - [ ] 日期选择器不会超出屏幕
   - [ ] 标签选择器不会超出屏幕
   - [ ] 日历日期格子可以准确点击
   - [ ] 颜色选择色块可以准确点击

5. **桌面端回归**
   - [ ] 放大到 768px+ 宽度，布局恢复三栏
   - [ ] 所有桌面端交互（hover、双击编辑、右键菜单）正常
   - [ ] Header 在桌面端隐藏

- [ ] **Step 3: 最终 Commit（如有修复）**

```bash
git add -A
git commit -m "fix: mobile testing adjustments"
```

---

## 总结

| Chunk | Tasks | 主要改动 |
|---|---|---|
| 1 | 1-3 | 基础设施：useIsMobile hook、图标、全局样式 |
| 2 | 4-9 | 布局系统：Provider + Drawer + Header + 侧栏改造 |
| 3 | 10-11 | Todo 交互：删除可见、单击编辑、TouchSensor |
| 4 | 12-13 | 标签交互：长按菜单、TouchSensor、移除 touch-none |
| 5 | 14-18 | 弹出层 & 小组件：pointerdown、移动端定位、触摸区域 |
| 6 | 19-21 | 页面级调整、TodoCreate 适配 |
| 7 | 22 | 测试验证 |

**预计每个 Chunk 需要 15-30 分钟实施。总计约 2-3 小时。**
