# TodoFlow Follow-up Refinements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the TodoFlow UI so drag-and-drop feels natural, tag changes propagate everywhere, sidebars and creation flows are consistent, and date/tag editing uses polished in-app controls instead of stopgap interactions.

**Architecture:** Keep the existing data model and API surface, but add a tag-change event channel, reusable inline popovers for tag/date picking, and stricter DnD boundaries so sorting only happens within the current group. Rework the create bar and right sidebar around shared presentational pieces so the date page, tag page, and unscheduled page follow one consistent interaction model.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, existing `@dnd-kit/*` packages, existing custom DOM event pattern.

---

## File Structure

```text
src/
  lib/
    todo-events.ts                          # Modify: add tags-changed event + notifier
    use-todo-actions.ts                     # Modify: add tag update action + local retention hooks
  components/
    icons/
      ui-icons.tsx                          # Create: shared inline SVG icons (no emoji)
    calendar/
      calendar.tsx                          # Modify: stable overlay positioning for month/year picker
      month-picker.tsx                      # Modify: fixed-width overlay grid
      year-picker.tsx                       # Modify: fixed-width overlay grid
      date-popover.tsx                      # Create: reusable in-app date picker popover
    sidebar/
      left-sidebar.tsx                      # Modify: replace emoji icons
      right-sidebar.tsx                     # Rewrite card treatment for all three sections
      right-sidebar-todo-item.tsx           # Modify: replace icon usage and card spacing if needed
      tag-list.tsx                          # Modify: whole-row drag, blur-create, emit tags-changed
      tag-context-menu.tsx                  # Modify: remove emoji icons, emit tags-changed path
    todo/
      todo-create.tsx                       # Rewrite: input-embedded context controls + submit icon
      todo-item.tsx                         # Rewrite: whole-item drag, clickable tag editor, custom date editor
      todo-list.tsx                         # Rewrite: group-bounded sorting, group order by global tags
      todo-tag-popover.tsx                  # Create: vertical tag checklist popover
      todo-group.tsx                        # Create: optional focused group wrapper for sortable sections
  app/
    (main)/date/[date]/page.tsx            # Modify: use tag-aware create bar + group-local reorder
    (main)/tag/[tagId]/page.tsx            # Modify: use custom date picker + single-list reorder
    (main)/unscheduled/page.tsx            # Modify: support date+tag create flow + retain newly scheduled todos locally
```

---

## Chunk 1: Event Synchronization + Icon Cleanup

### Task 1: Add tag change event channel

**Files:**
- Modify: `src/lib/todo-events.ts`

- [ ] Add `TAGS_CHANGED_EVENT` alongside the existing todo event.
- [ ] Add `notifyTagsChanged()` helper.
- [ ] Keep the API parallel to `notifyTodosChanged()` so components can subscribe consistently.
- [ ] Verify TypeScript with `npx tsc --noEmit`.

### Task 2: Create shared SVG icon set

**Files:**
- Create: `src/components/icons/ui-icons.tsx`
- Modify: `src/components/sidebar/left-sidebar.tsx`
- Modify: `src/components/sidebar/tag-context-menu.tsx`
- Modify: any todo/sidebar component still rendering emoji during implementation

- [ ] Create a tiny icon module exporting only the shapes needed now: settings, theme, submit/enter, tag, calendar, delete, rename, palette.
- [ ] Replace all emoji/icon text usages introduced in the previous pass.
- [ ] Keep icon sizing driven by `className` so components stay flexible.
- [ ] Run `npx tsc --noEmit`.

### Task 3: Make tag mutations broadcast globally

**Files:**
- Modify: `src/components/sidebar/tag-list.tsx`
- Modify: `src/components/sidebar/tag-context-menu.tsx` (if callbacks need reshaping)
- Modify: `src/components/todo/todo-create.tsx`
- Modify: `src/components/sidebar/right-sidebar.tsx`
- Modify: `src/app/(main)/date/[date]/page.tsx`
- Modify: `src/app/(main)/tag/[tagId]/page.tsx`
- Modify: `src/app/(main)/unscheduled/page.tsx`

- [ ] Emit `notifyTagsChanged()` after tag create, rename, recolor, reorder, and delete succeed.
- [ ] Subscribe any component that reads `/api/tags` so it refetches when tags change.
- [ ] Ensure pages/components that already refetch todos also refresh when tag metadata changes, so names/colors/order update without reload.
- [ ] Verify by renaming and recoloring a tag, then checking left sidebar, page headers, create bar options, and grouped lists.

---

## Chunk 2: Drag-and-Drop Interaction Redesign

### Task 4: Remove drag handles from tags and make whole row draggable

**Files:**
- Modify: `src/components/sidebar/tag-list.tsx`

- [ ] Move `attributes`/`listeners` from the handle span onto the sortable row container.
- [ ] Remove the handle UI completely.
- [ ] Preserve right-click menu and normal left-click navigation.
- [ ] Mark menu-triggering internals, if any, as drag-exempt only when necessary.
- [ ] Verify reorder still persists through `/api/tags/reorder`.

### Task 5: Make todo items draggable by body, but not by controls

**Files:**
- Modify: `src/components/todo/todo-item.tsx`
- Modify: `src/components/todo/todo-list.tsx`

- [ ] Apply sortable listeners to the outer todo row instead of a handle.
- [ ] Add a small utility convention such as `data-no-drag` for interactive subcontrols.
- [ ] Prevent drag activation when pointerdown starts inside checkbox, delete button, tag picker trigger, date picker trigger, or editable input.
- [ ] Keep inline title editing working with double click.
- [ ] Verify drag still starts naturally from whitespace/title area.

### Task 6: Restrict todo sorting to the current group only

**Files:**
- Modify: `src/components/todo/todo-list.tsx`
- Modify: `src/app/(main)/date/[date]/page.tsx`
- Modify: `src/app/(main)/unscheduled/page.tsx`
- Modify: `src/app/(main)/tag/[tagId]/page.tsx`

- [ ] Replace the current whole-list reorder calculation with group-scoped reorder callbacks.
- [ ] In grouped views, compute sortable items per group and only send reordered IDs from that group.
- [ ] In the tag page, keep single-list sorting behavior.
- [ ] Preserve optimistic UI ordering after reorder.
- [ ] Verify no cross-group drop target changes order in date/unscheduled views.

### Task 7: Sort date-page groups by global tag order

**Files:**
- Modify: `src/components/todo/todo-list.tsx`

- [ ] Refactor grouped rendering to accept the current global tag ordering.
- [ ] When grouping todos by primary tag, sort the rendered groups using the fetched tag order instead of insertion order.
- [ ] Keep untagged/uncategorized group last.
- [ ] Reuse the same rule in unscheduled view grouping for consistency.

---

## Chunk 3: Todo Item Editing Popovers

### Task 8: Create reusable custom date popover

**Files:**
- Create: `src/components/calendar/date-popover.tsx`

- [ ] Build a lightweight in-app date picker popover using the project’s existing calendar language.
- [ ] Support selecting a date, clearing a date, and closing on outside click / Escape.
- [ ] Keep the component controlled via props so both tag page items and create bar can reuse it.
- [ ] Size/position it as an overlay, not an inline layout participant.

### Task 9: Create vertical tag checklist popover

**Files:**
- Create: `src/components/todo/todo-tag-popover.tsx`

- [ ] Render all tags in global sort order.
- [ ] Show current selections with clear checked state.
- [ ] Single click toggles membership and persists immediately.
- [ ] Close on outside click / Escape.

### Task 10: Wire todo item to use custom date and tag popovers

**Files:**
- Modify: `src/components/todo/todo-item.tsx`
- Modify: `src/lib/use-todo-actions.ts`

- [ ] Replace native `input[type="date"]` with `DatePopover` in tag view.
- [ ] Replace static tag badges in date view with a clickable trigger opening `TodoTagPopover`.
- [ ] Add/update action helpers to persist `tagIds` changes, not just title/date/completed.
- [ ] Ensure tag-view still hides redundant tag badges.
- [ ] Verify tag edits update immediately everywhere via todo + tag events.

---

## Chunk 4: Create Bar Redesign

### Task 11: Redesign create bar layout

**Files:**
- Modify: `src/components/todo/todo-create.tsx`

- [ ] Change the component from external buttons to a single input-shell layout.
- [ ] Embed the contextual selector inside the input container on the left.
- [ ] Replace the text submit button with an inline SVG submit/enter icon on the right.
- [ ] Remove emoji from the trigger UI.

### Task 12: Support page-specific create contexts

**Files:**
- Modify: `src/components/todo/todo-create.tsx`
- Modify: `src/app/(main)/date/[date]/page.tsx`
- Modify: `src/app/(main)/tag/[tagId]/page.tsx`
- Modify: `src/app/(main)/unscheduled/page.tsx`

- [ ] Date page: embed tag selector only.
- [ ] Tag page: embed custom date selector only.
- [ ] Unscheduled page: embed both tag selector and date selector.
- [ ] Keep the “current page context” pre-applied (date page date, tag page tag).
- [ ] Preserve Enter-to-submit keyboard behavior.

### Task 13: Retain newly scheduled todos on unscheduled page until refresh

**Files:**
- Modify: `src/app/(main)/unscheduled/page.tsx`
- Modify: `src/lib/use-todo-actions.ts` (if helper abstraction is worthwhile)

- [ ] Add local state for “optimistically retained” unscheduled items.
- [ ] When a todo on this page gets a date assigned, update its local row to show that date but do not remove it from the current in-memory list.
- [ ] Continue to remove it on the next full fetch/navigation/refresh naturally.
- [ ] Make sure the row displays normally, with no dimming or special bucket.

---

## Chunk 5: Sidebar + Calendar Presentation Fixes

### Task 14: Make all right sidebar sections card-based

**Files:**
- Modify: `src/components/sidebar/right-sidebar.tsx`
- Modify: `src/components/sidebar/right-sidebar-todo-item.tsx`

- [ ] Wrap upcoming, overdue, and unscheduled groups in a consistent card treatment.
- [ ] Keep overdue visually distinct using danger colors while matching the same card anatomy.
- [ ] Preserve linkability to date/unscheduled destinations.
- [ ] Keep grouped content inside cards instead of loose text lists.

### Task 15: Fix month/year picker overlay layout

**Files:**
- Modify: `src/components/calendar/calendar.tsx`
- Modify: `src/components/calendar/month-picker.tsx`
- Modify: `src/components/calendar/year-picker.tsx`

- [ ] Make picker overlays fixed/min-width popovers that are not squeezed by the sidebar header layout.
- [ ] Anchor them reliably below the clicked month/year trigger.
- [ ] Ensure month grid and year grid cells have enough width for Chinese labels and years.
- [ ] Verify they render correctly in the narrow left sidebar.

### Task 16: Improve new-tag create behavior on blur

**Files:**
- Modify: `src/components/sidebar/tag-list.tsx`

- [ ] On blur, create the tag if the trimmed value is non-empty.
- [ ] On blur with empty value, close the input without creating.
- [ ] Avoid duplicate creation when blur happens immediately after Enter.

---

## Chunk 6: Verification

### Task 17: Run focused regression checks

**Files:**
- No code changes expected

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Manual smoke test checklist:
  - [ ] Rename/recolor/reorder a tag and confirm all pages/sidebars/update surfaces refresh live.
  - [ ] Drag tags by row body.
  - [ ] Drag todos by row body.
  - [ ] Confirm date/unscheduled views do not allow cross-group reorder.
  - [ ] Open tag popover from date-page todo and toggle multiple tags.
  - [ ] Open custom date popover from tag-page todo and pick/clear dates.
  - [ ] In unscheduled page, assign a date and confirm the row stays visible until refresh.
  - [ ] Verify all three sidebar sections render as cards.
  - [ ] Verify month/year popovers are not compressed.
  - [ ] Verify create bars match page-specific selector rules.

---

## Suggested Commit Boundaries

1. `fix: synchronize tag changes and remove emoji icons`
2. `fix: refine drag interactions and group-local todo sorting`
3. `feat: add custom todo tag and date popovers`
4. `refactor: redesign todo create bar by page context`
5. `fix: unify sidebar cards and calendar picker overlays`
