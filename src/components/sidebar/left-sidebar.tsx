import Link from "next/link";

export function LeftSidebar() {
  return (
    <aside className="flex w-[220px] flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-[var(--border-default)] bg-[var(--bg-sidebar-left)] p-4">
      <div className="text-base font-bold tracking-tight">TodoFlow_</div>
      <div className="text-xs text-[var(--text-muted)]">[Calendar placeholder]</div>
      <div className="border-t border-[var(--border-default)]" />
      <div className="text-xs text-[var(--text-muted)]">[Tags placeholder]</div>
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
