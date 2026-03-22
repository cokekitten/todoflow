# TodoFlow Refinement Fixes V2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the remaining TodoFlow refinement issues around context-isolated sorting, popover layering, create-bar layout polish, and collapsible right-sidebar sections.

**Architecture:** The key change is to stop treating todo ordering as a single global `sortOrder`. Add a separate context-order table keyed by view context so date view, tag view, and unscheduled view can each maintain their own ordering without interfering. On the frontend, move popovers to portals, tighten button alignment, and persist right-sidebar section collapse state in `localStorage`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Drizzle ORM + SQLite, existing `@dnd-kit/*`, existing custom DOM event pattern.

---

## File Structure

```text
src/
  server/
    db/
      schema.ts                                # Modify: add todo_sort_contexts table
    todos/
      index.ts                                 # Rewrite ordering queries to use context keys
  app/
    api/
      todos/
        reorder/route.ts                       # Modify: accept context key + scoped IDs
    (main)/
      date/[date]/page.tsx                     # Modify: pass date-context reorder key
      tag/[tagId]/page.tsx                     # Modify: pass tag-context reorder key
      unscheduled/page.tsx                     # Modify: pass unscheduled-context reorder key
  components/
    icons/
      ui-icons.tsx                             # Modify: use X icon instead of trash icon
    calendar/
      month-picker.tsx                         # Modify: prevent month label wrapping
      date-popover.tsx                         # Modify: render via portal and improve z-index
    sidebar/
      right-sidebar.tsx                        # Modify: collapsible sections + persisted state
      tag-list.tsx                             # Modify: new tags insert at the top
    todo/
      todo-create.tsx                          # Modify: move tag/date controls to right side of input shell
      todo-item.tsx                            # Modify: X delete icon, aligned controls, popover trigger fixes
      todo-list.tsx                            # Modify: accept explicit context keys per group
      todo-tag-popover.tsx                     # Modify: render via portal and fix unscheduled interaction
```

---

## Chunk 1: Context-Isolated Todo Sorting

### Task 1: Add database support for scoped todo ordering

**Files:**
- Modify: `src/server/db/schema.ts`

- [ ] Add a new `todo_sort_contexts` table with columns: `contextKey`, `todoId`, `sortOrder`.
- [ ] Use a composite primary key on `contextKey + todoId`.
- [ ] Reference `todos.id` with cascade delete so orphaned sort rows disappear automatically.
- [ ] Keep the existing `todos.sortOrder` in place for now only if needed for backward compatibility; do not rely on it for view ordering anymore.

### Task 2: Refactor todo queries to read/write scoped order

**Files:**
- Modify: `src/server/todos/index.ts`

- [ ] Introduce a helper to build context keys:
  - `tag:<tagId>`
  - `date:<yyyy-mm-dd>:tag:<tagId>`
  - `date:<yyyy-mm-dd>:tag:none`
  - `unscheduled:tag:<tagId>`
  - `unscheduled:tag:none`
- [ ] For `getTodosByDate`, return todos grouped in a way that can be sorted by the correct per-group context key.
- [ ] For `getTodosByTag`, sort by `tag:<tagId>` order only.
- [ ] For `getUnscheduledTodos`, sort by unscheduled context order per primary tag / none bucket.
- [ ] Add a server helper to persist reorder input for a specific context key by replacing/upserting that context’s rows.
- [ ] Define fallback order for todos with no row yet: `createdAt asc` within the context.

### Task 3: Update reorder API to accept explicit context

**Files:**
- Modify: `src/app/api/todos/reorder/route.ts`

- [ ] Change the request body contract from only `{ ids }` to `{ contextKey, ids }`.
- [ ] Validate both fields.
- [ ] Call the new server reorder helper instead of mutating `todos.sortOrder`.
- [ ] Return a 400 for malformed bodies.

### Task 4: Thread context keys through the three main pages

**Files:**
- Modify: `src/app/(main)/date/[date]/page.tsx`
- Modify: `src/app/(main)/tag/[tagId]/page.tsx`
- Modify: `src/app/(main)/unscheduled/page.tsx`
- Modify: `src/components/todo/todo-list.tsx`
- Modify: `src/lib/use-todo-actions.ts`

- [ ] Extend `TodoList` so grouped mode can pass an explicit `contextKey` per rendered group.
- [ ] Date page: each tag group gets `date:<date>:tag:<tagId>` and untagged gets `date:<date>:tag:none`.
- [ ] Tag page: list gets `tag:<tagId>`.
- [ ] Unscheduled page: groups get `unscheduled:tag:<tagId>` or `unscheduled:tag:none`.
- [ ] Update `handleReorder` to send `{ contextKey, ids }`.
- [ ] Preserve optimistic UI updates only within the affected group.

---

## Chunk 2: Layout + Alignment Fixes

### Task 5: Move create-bar controls to the far right

**Files:**
- Modify: `src/components/todo/todo-create.tsx`

- [ ] Keep the input text area on the left.
- [ ] Move the tag/date selector controls to the far right inside the shell.
- [ ] Place them immediately to the left of the submit/enter button.
- [ ] Keep page-specific control visibility rules unchanged.

### Task 6: Replace delete icon with a simple X

**Files:**
- Modify: `src/components/icons/ui-icons.tsx`
- Modify: `src/components/todo/todo-item.tsx`

- [ ] Add or reuse a clean `X` icon.
- [ ] Replace the todo delete button icon with that `X`.
- [ ] Remove the trash-can visual from todo items.

### Task 7: Align todo-side controls consistently

**Files:**
- Modify: `src/components/todo/todo-item.tsx`

- [ ] Standardize height, padding, and line-height for the date and tag controls on the right side.
- [ ] Ensure the controls align to the same vertical centerline regardless of whether tags are present.
- [ ] Make the no-tag state (`选择标签`) use the same geometry as the date control.

### Task 8: Prevent month labels from wrapping in month picker

**Files:**
- Modify: `src/components/calendar/month-picker.tsx`

- [ ] Force month buttons to keep text on one line.
- [ ] Increase width or adjust grid sizing so `10月`, `11月`, `12月` do not compress.
- [ ] Keep the popover compact enough for the sidebar.

---

## Chunk 3: Popover Layering + Interaction Bugs

### Task 9: Portal the date popover

**Files:**
- Modify: `src/components/calendar/date-popover.tsx`

- [ ] Render the popover through `createPortal(..., document.body)`.
- [ ] Measure trigger position and place the popover in viewport coordinates.
- [ ] Keep outside-click and Escape handling working after portaling.
- [ ] Use a higher z-index than the surrounding layout.

### Task 10: Portal the tag popover and fix unscheduled-page opening

**Files:**
- Modify: `src/components/todo/todo-tag-popover.tsx`
- Modify: `src/components/todo/todo-item.tsx`

- [ ] Render the tag popover through a portal just like the date popover.
- [ ] Anchor it to the clicked tag trigger rather than absolute positioning inside a clipped parent.
- [ ] Fix the event/drag interaction so the tag picker opens correctly on the unscheduled page.
- [ ] Verify the popover is not hidden behind the sidebar or main content panels.

### Task 11: Keep popover triggers and drag logic from fighting

**Files:**
- Modify: `src/components/todo/todo-item.tsx`
- Modify: `src/components/todo/todo-list.tsx`

- [ ] Re-check `data-no-drag` handling on tag and date trigger buttons.
- [ ] Ensure pointerdown on these controls never starts drag.
- [ ] Verify body-drag still works elsewhere on the row.

---

## Chunk 4: Tag Ordering Polish

### Task 12: Make newly created tags appear first

**Files:**
- Modify: `src/server/tags/index.ts`
- Modify: `src/components/sidebar/tag-list.tsx` (only if optimistic insertion logic needs updating)

- [ ] When creating a new tag, shift existing tag sort orders down and insert the new tag at `sortOrder = 0`.
- [ ] Keep existing reorder behavior intact.
- [ ] Ensure all tag consumers refresh and show the new tag first.

---

## Chunk 5: Collapsible Right Sidebar Sections

### Task 13: Add persisted collapse state to right sidebar

**Files:**
- Modify: `src/components/sidebar/right-sidebar.tsx`

- [ ] Make `即将提醒` / `已逾期` / `未安排` individually collapsible.
- [ ] Default all three to expanded.
- [ ] Persist collapse state in `localStorage`.
- [ ] Load the stored state on mount and render accordingly.
- [ ] Keep section headers clickable and accessible.

### Task 14: Keep cards and collapse behavior visually coherent

**Files:**
- Modify: `src/components/sidebar/right-sidebar.tsx`

- [ ] Add a compact chevron indicator for expanded/collapsed state.
- [ ] Keep card spacing tidy when a section is collapsed.
- [ ] Preserve overdue visual emphasis after collapse support is added.

---

## Chunk 6: Verification

### Task 15: Run regression verification

**Files:**
- No code changes expected

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Run schema sync if needed after the new table is added.
- [ ] Manual smoke test checklist:
  - [ ] Reorder todos inside a date group, then verify tag page order stays unchanged.
  - [ ] Reorder todos in one tag page, then verify another tag page stays unchanged.
  - [ ] Confirm unscheduled page ordering is independent too.
  - [ ] Confirm create-bar controls sit on the right next to submit.
  - [ ] Confirm delete button shows X, not trash.
  - [ ] Confirm month picker does not wrap `10月` onward.
  - [ ] Confirm tag/date controls are vertically aligned.
  - [ ] Confirm date popover and tag popover are never clipped or covered.
  - [ ] Confirm unscheduled-page tag picker opens and works.
  - [ ] Confirm all three right-sidebar sections collapse, expand, and restore state after reload.

---

## Suggested Commit Boundaries

1. `feat: isolate todo ordering by view context`
2. `fix: polish create bar and todo action alignment`
3. `fix: portal todo popovers above layout`
4. `fix: insert new tags at top and add collapsible sidebar sections`
