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
    return "标签";
  }

  if (pathname === "/unscheduled") {
    return "未安排";
  }

  return "TodoFlow";
}

export function MobileHeader({ showLeft = true }: { showLeft?: boolean }) {
  const { openLeft, openRight } = useMobileLayout();
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-sidebar-left)] px-4">
      {showLeft ? (
        <button
          type="button"
          onClick={openLeft}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] active:bg-[var(--border-default)]"
          aria-label="打开菜单"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      ) : (
        <div className="h-10 w-10" />
      )}
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
