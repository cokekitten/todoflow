import { Calendar } from "@/components/calendar/calendar";
import { TagList } from "@/components/sidebar/tag-list";
import Link from "next/link";

export function LeftSidebar() {
  return (
    <aside className="flex w-[220px] flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--border-default)] bg-[var(--bg-sidebar-left)] p-4">
      <div className="text-base font-bold tracking-tight">TodoFlow_</div>
      <Calendar />
      <div className="border-t border-[var(--border-default)]" />
      <TagList />
      <div className="mt-auto">
        <Link
          href="/settings"
          className="text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)]"
        >
          ⚙ 设置
        </Link>
      </div>
    </aside>
  );
}
