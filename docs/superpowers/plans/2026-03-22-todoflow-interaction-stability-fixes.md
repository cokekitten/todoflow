# TodoFlow Interaction Stability Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the todo item interaction model so tag/date/delete controls behave consistently, hover feedback is visually clear, and right-sidebar collapse animations remain smooth under rerender pressure.

**Architecture:** Stop treating the todo item’s right-side controls as ad-hoc inline fragments. Rebuild them as a small, consistent control cluster with fixed sizing, stable hover states, and optimistic local updates for tag multi-select so the popover state is not lost during refetches. Separately, decouple right-sidebar collapse icon animation from section content mount/unmount so the chevron can animate smoothly.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, existing portal popovers and custom event system.

---

## File Structure

```text
src/
  components/
    todo/
      todo-item.tsx                         # Rewrite right-side control cluster and close button behavior
      todo-list.tsx                         # Thread optimistic todo updates if needed
      todo-tag-popover.tsx                  # Keep multi-select popover open after each toggle
      todo-chip.tsx                         # Create: reusable visual token for tag/date-sized chips
    sidebar/
      right-sidebar.tsx                     # Decouple chevron animation from content collapse
      right-sidebar-todo-item.tsx           # Add tooltip and non-text cursor behavior
  app/
    (main)/date/[date]/page.tsx            # Optional: optimistic local tag update hook
    (main)/unscheduled/page.tsx            # Optional: optimistic local tag update hook
    (main)/tag/[tagId]/page.tsx            # Optional: keep behavior consistent if shared helper is added
  lib/
    use-todo-actions.ts                     # Optional: add no-refetch / optimistic tag-update path
```

---

## Chunk 1: Todo Control Cluster Rebuild

### Task 1: Create a reusable chip primitive for compact controls

**Files:**
- Create: `src/components/todo/todo-chip.tsx`

- [ ] Create a small presentational component for fixed-height compact pills/chips.
- [ ] Support explicit variants for `neutral`, `date`, and `tag-color` usage.
- [ ] Ensure the chip height matches the date button geometry exactly.
- [ ] Support a stronger hover visual than the current brightness tweak.

### Task 2: Rebuild todo item tag/date controls on top of the chip primitive

**Files:**
- Modify: `src/components/todo/todo-item.tsx`

- [ ] Replace the current nested button/chip structure with a fixed-size control row.
- [ ] Make tag trigger outer size match date trigger size.
- [ ] Remove the unwanted neutral gray wrapper around colored tag chips.
- [ ] Ensure empty-tag state (`选择标签`) and populated-tag state share one consistent box model.
- [ ] Strengthen hover color feedback on tag chips using explicit color/background rules.

### Task 3: Simplify checkbox hover feedback for dark mode

**Files:**
- Modify: `src/components/todo/todo-item.tsx`

- [ ] Remove the current heavier hover effect that feels delayed in dark mode.
- [ ] Replace it with faster border/background feedback.
- [ ] Keep checked and unchecked states visually distinct.

### Task 4: Make the delete/X button use a fixed interaction slot

**Files:**
- Modify: `src/components/todo/todo-item.tsx`

- [ ] Move the delete button into a reserved-width slot.
- [ ] Animate only opacity/visibility of the icon, not layout participation.
- [ ] Eliminate hover-boundary flicker where the icon appears/disappears or reverses behavior.

---

## Chunk 2: Tag Popover State Stability

### Task 5: Keep multi-select tag popover open after each selection

**Files:**
- Modify: `src/components/todo/todo-tag-popover.tsx`
- Modify: `src/components/todo/todo-item.tsx`
- Modify: `src/lib/use-todo-actions.ts`
- Modify: `src/app/(main)/date/[date]/page.tsx`
- Modify: `src/app/(main)/unscheduled/page.tsx`
- Modify: `src/app/(main)/tag/[tagId]/page.tsx` (only if shared helper path touches all pages)

- [ ] Stop using a full page/list refetch as the immediate response to each tag toggle.
- [ ] Return updated todo data or apply optimistic local todo updates per item.
- [ ] Keep the popover open for multi-select flows.
- [ ] Close only on outside click, Escape, or explicit trigger click.
- [ ] Verify repeated tag toggles on the same todo do not collapse the popover unexpectedly.

### Task 6: Make tag hover state visually stronger and deterministic

**Files:**
- Modify: `src/components/todo/todo-item.tsx`
- Modify: `src/components/todo/todo-chip.tsx`

- [ ] Replace filter-based hover styling with explicit foreground/background changes.
- [ ] Ensure the hover effect is obvious enough in both light and dark themes.
- [ ] Keep the tag color identity intact.

---

## Chunk 3: Right Sidebar Interaction Polish

### Task 7: Add stable tooltip + cursor behavior to sidebar todo rows

**Files:**
- Modify: `src/components/sidebar/right-sidebar-todo-item.tsx`

- [ ] Add tooltip text for truncated todo titles.
- [ ] Set the text region to non-editable cursor behavior (`cursor-default` / `select-none` as appropriate).
- [ ] Preserve checkbox interactivity.

### Task 8: Decouple chevron animation from heavy section rerendering

**Files:**
- Modify: `src/components/sidebar/right-sidebar.tsx`

- [ ] Split each section header into a stable clickable row with its own icon wrapper.
- [ ] Keep content mounted while collapsed, or use CSS-based height/opacity collapse instead of immediate conditional removal.
- [ ] Let the chevron rotate independently from content layout work.
- [ ] Ensure the icon finishes rotation smoothly every time.

---

## Chunk 4: Verification

### Task 9: Run focused interaction regression checks

**Files:**
- No code changes expected

- [ ] Run `npx tsc --noEmit`.
- [ ] Manual smoke test checklist:
  - [ ] Tag chips show a clearly stronger color hover state.
  - [ ] Tag chip area has no extra gray wrapper.
  - [ ] Tag control height matches date control height.
  - [ ] Multi-select tag popover stays open across repeated selections.
  - [ ] Checkbox hover responds immediately in dark mode.
  - [ ] Delete button never flickers or inverts hover behavior.
  - [ ] Right-sidebar chevrons rotate smoothly and fully.
  - [ ] Right-sidebar truncated titles show tooltip on hover.
  - [ ] Right-sidebar title text does not show text-insertion cursor.

---

## Suggested Commit Boundary

1. `fix: stabilize todo control interactions and sidebar toggles`
