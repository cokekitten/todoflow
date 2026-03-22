# TodoFlow Single-Tag and Sidebar Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a coherent single-tag todo model and eliminate the remaining todo-item/sidebar interaction bugs without introducing more unstable UI state.

**Architecture:** Revert the recent multi-select tag direction in todo items and create bars back to single-select because the current rendering model groups each todo into exactly one visible tag bucket. Keep the portal-based popover infrastructure, but simplify the data flow so tag selection is a single assignment followed by close. Separately, rebuild the todo-item close action as a fixed layout slot and switch the right sidebar back to true conditional content collapse, while preserving smooth chevron animation and `ellipsis + tooltip` behavior.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, existing portal popovers, custom event system, current `Todo`/`Tag` API contracts.

---

## File Structure

```text
src/
  components/
    todo/
      todo-item.tsx                           # Revert to single-tag state, fix tag hover, fix X-slot behavior
      todo-create.tsx                         # Revert create-bar tag picker to single-select
      todo-tag-popover.tsx                    # Rebuild popover from multi-select checklist to single-select menu
      todo-chip.tsx                           # Keep shared chip geometry; tune hover if needed
    sidebar/
      right-sidebar-todo-item.tsx             # Preserve truncate + title tooltip + cursor-default
      right-sidebar.tsx                       # True collapse via conditional body render, smooth icon animation
  lib/
    use-todo-actions.ts                       # Revert tag mutation helper to simple single-tag update path
  app/
    (main)/date/[date]/page.tsx              # Remove multi-select optimistic tag logic
    (main)/unscheduled/page.tsx              # Remove multi-select optimistic tag logic
```

---

## Implementation Constraints

- Todo tag assignment in UI is single-select after this change.
- API payload can still use `tagIds`, but the UI must only send zero or one tag id.
- Do not keep the popover open after tag selection anymore; that requirement is obsolete because multi-select is being removed.
- Do not keep empty sidebar card shells mounted when a section is collapsed.
- Preserve current portal positioning approach for popovers; do not regress to inline absolute overlays.
- Preserve current date-color rules that were already accepted:
  - today/future unchanged
  - overdue 1-3 days orange
  - overdue 4+ days red
  - completed todos do not get date emphasis

---

## Chunk 1: Revert Todo Tagging to Single-Select

### Task 1: Rebuild tag popover API around single selection

**Files:**
- Modify: `src/components/todo/todo-tag-popover.tsx`

**Target shape:**

```ts
interface TodoTagPopoverProps {
  tags: Tag[];
  selectedTagId: string | null;
  onSelect: (tagId: string | null) => void;
  onClose: () => void;
  anchorRef?: RefObject<HTMLElement | null>;
}
```

- [ ] Replace `selectedTagIds: string[]` with `selectedTagId: string | null`.
- [ ] Replace `onToggle(tagId)` with `onSelect(tagId)`.
- [ ] Keep the portal positioning logic exactly as-is unless a type change requires small edits.
- [ ] Change the item rendering from checkbox-style multi-select semantics to menu-style single-select semantics:
  - current selected item gets highlighted
  - clicking any item calls `onSelect(tag.id)` and then immediately `onClose()`
- [ ] Add an explicit “不设置标签” row at the top that calls `onSelect(null)` and then `onClose()`.
- [ ] Keep outside click and Escape closing.

**Implementation note:**
Do not preserve the current `onToggle` behavior. The root cause of the bad UX is that the UI allows a data shape the visible grouping model cannot represent cleanly.

### Task 2: Rebuild todo item tag control around one selected tag

**Files:**
- Modify: `src/components/todo/todo-item.tsx`

**Required prop change:**

```ts
onTagIdChange?: (id: string, tagId: string | null) => void;
```

- [ ] Replace `onTagIdsChange` prop with `onTagIdChange`.
- [ ] Delete the current `handleTagToggle()` logic.
- [ ] Replace it with:

```ts
function handleTagSelect(tagId: string | null) {
  onTagIdChange?.(todo.id, tagId)
}
```

- [ ] Replace `selectedTagIds={todo.tags.map(...)}` with `selectedTagId={todo.tags[0]?.id ?? null}`.
- [ ] Replace `onToggle={handleTagToggle}` with `onSelect={handleTagSelect}`.
- [ ] Render only one visible tag chip in the item:
  - if `todo.tags[0]` exists, render one chip
  - if no tag exists, render one neutral `TodoChip` with `选择标签`
- [ ] Keep the tag trigger button height exactly equal to the date chip height.
- [ ] Remove any remaining logic that visually suggests multiple chips can coexist.

**Required hover treatment:**
Do not use `brightness`, `opacity`, or translate. Use explicit colors.

Use this rule for a selected tag chip:

```ts
style={{
  ["--tag-bg" as string]: `${tag.color}24`,
  ["--tag-border" as string]: `${tag.color}55`,
  ["--tag-bg-hover" as string]: `${tag.color}cc`,
  ["--tag-fg" as string]: tag.color,
}}
```

And classes equivalent to:

```ts
"bg-[color:var(--tag-bg)] text-[color:var(--tag-fg)] hover:bg-[color:var(--tag-bg-hover)] hover:text-white"
```

This is intentionally stronger than the current subtle hover.

### Task 3: Rebuild create-bar tag selection around one tag

**Files:**
- Modify: `src/components/todo/todo-create.tsx`

- [ ] Replace `selectedTagIds: string[]` with `selectedTagId: string | null`.
- [ ] Initialize it from `defaultTagId ?? null`.
- [ ] Replace the current helper:

```ts
function toggleTag(tagId: string) {
  setSelectedTagId((current) => current === tagId ? null : tagId)
}
```

or, if you want simpler behavior:

```ts
function selectTag(tagId: string | null) {
  setSelectedTagId(tagId)
  setShowTagPicker(false)
}
```

- [ ] Update the popover props to `selectedTagId` + `onSelect`.
- [ ] Update the selected label display to show only one tag name.
- [ ] Keep submit payload compatible with the current API contract:

```ts
tagIds: selectedTagId ? [selectedTagId] : []
```

- [ ] On successful submit, reset back to:
  - `defaultTagId ?? null` if page context provides one
  - otherwise `null`

---

## Chunk 2: Simplify Tag Update Data Flow

### Task 4: Revert tag update helper to single-tag semantics

**Files:**
- Modify: `src/lib/use-todo-actions.ts`

- [ ] Remove the current multi-select return-contract mindset.
- [ ] Replace `handleTagIdsChange(id, tagIds)` with `handleTagIdChange(id, tagId)`.
- [ ] Implementation should send:

```ts
body: JSON.stringify({ tagIds: tagId ? [tagId] : [] })
```

- [ ] Return the updated todo JSON if the request succeeds, otherwise `null`.
- [ ] Do not call the global page refetch immediately from this helper.
- [ ] Still dispatch `notifyTodosChanged()` after a successful mutation so sidebar/calendar consumers stay current.

### Task 5: Remove multi-select optimistic page logic

**Files:**
- Modify: `src/app/(main)/date/[date]/page.tsx`
- Modify: `src/app/(main)/unscheduled/page.tsx`

- [ ] Replace `handleTagIdsChange` usage with `handleTagIdChange`.
- [ ] Remove the current `prev.flatMap(...).find(...)` reconstruction logic.
- [ ] Use the updated todo returned from the helper to patch local page state:

```ts
async function onTagIdChange(id: string, tagId: string | null) {
  const updated = await handleTagIdChange(id, tagId)
  if (!updated) return
  setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)))
}
```

- [ ] If a tag reassignment moves the todo into a different group, do not try to manually splice arrays by group. Just replace the todo object in the flat page state and let the grouped render recompute.
- [ ] Verify date page and unscheduled page do not duplicate the same todo across multiple groups anymore.

---

## Chunk 3: Fix Close Button Ghosting Properly

### Task 6: Turn the trailing X into a true fixed action slot

**Files:**
- Modify: `src/components/todo/todo-item.tsx`

**Problem to solve:**
The current slot still leaves a visible gray ghost because the button itself remains present and fades opacity in place.

**Required structure:**

```tsx
<span className="relative h-4 w-4 flex-shrink-0">
  <span className="absolute inset-0" />
  <button className="absolute inset-0 ..." />
</span>
```

But the actual visibility rule should use both opacity and visibility:

```ts
"invisible opacity-0 group-hover:visible group-hover:opacity-100"
```

and the slot wrapper itself must not inherit text color that can make the hidden icon appear faintly.

- [ ] Keep a fixed-size wrapper so layout never shifts.
- [ ] Set the wrapper to neutral/no text color leakage.
- [ ] Apply `invisible opacity-0` to the button by default.
- [ ] Apply `group-hover:visible group-hover:opacity-100` to the button.
- [ ] Keep `hover:text-[var(--danger)]` only on the visible state.
- [ ] Verify no ghost gray icon remains after mouse leave.

---

## Chunk 4: Right Sidebar Text + Collapse Behavior

### Task 7: Preserve truncation and tooltip together in sidebar todo rows

**Files:**
- Modify: `src/components/sidebar/right-sidebar-todo-item.tsx`

- [ ] Keep the current `truncate` class on the title text element.
- [ ] Keep `title={todo.title}` on that same element.
- [ ] Keep `cursor-default select-none`.
- [ ] Do not change the text element to block auto-sizing that would defeat truncation.
- [ ] Verify the visible text still shows ellipsis while native tooltip appears on hover.

### Task 8: Make sidebar collapse fully remove content instead of leaving empty shells

**Files:**
- Modify: `src/components/sidebar/right-sidebar.tsx`

**Current bad behavior:**
`SectionCard` remains mounted with a zero-row inner grid, so the layout still shows empty shells.

**Required direction:**
- Keep the chevron animation on the header row.
- Remove the body/cards entirely from layout when collapsed.

**Implementation guidance:**
Do **not** animate collapse by keeping cards mounted. Instead:

- [ ] Revert section bodies back to conditional rendering:

```tsx
{collapsed.upcoming ? null : <SectionBody ... />}
```

- [ ] Remove the `collapsed` prop from `SectionCard` entirely.
- [ ] Keep the header button and chevron always mounted.
- [ ] Keep the chevron transition classes, but move the icon into a dedicated fixed-size wrapper so the icon itself rotates smoothly even when content below unmounts.
- [ ] If needed, add `transition-transform duration-150 ease-out` and avoid extra layout classes on the icon wrapper.
- [ ] Verify that when a section is collapsed, no blank card container remains.

---

## Chunk 5: Verification

### Task 9: Run focused regression checks

**Files:**
- No code changes expected

- [ ] Run `npx tsc --noEmit`.
- [ ] Manual smoke test checklist:
  - [ ] Todo tag picker is single-select only.
  - [ ] Selecting a tag closes the popover immediately.
  - [ ] Date view does not imply multiple group membership for one todo.
  - [ ] Tag chip hover is visibly strong enough.
  - [ ] Tag chip height matches date chip height.
  - [ ] Close/X button leaves no faint residue after mouse leave.
  - [ ] Sidebar todo text still truncates with ellipsis.
  - [ ] Sidebar todo text shows native tooltip on hover.
  - [ ] Sidebar text does not show insertion cursor.
  - [ ] Collapsing `近期待办` / `已逾期` / `未安排` removes their bodies completely.
  - [ ] Chevron rotation still feels smooth.

---

## Suggested Commit Boundary

1. `fix: restore single-tag todo controls and sidebar collapse behavior`
