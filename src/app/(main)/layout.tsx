"use client";

import { LeftSidebar } from "@/components/sidebar/left-sidebar";
import { RightSidebar } from "@/components/sidebar/right-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileLayoutProvider, useMobileLayout } from "@/components/layout/mobile-layout-provider";
import { SidebarDrawer } from "@/components/layout/sidebar-drawer";
import { useViewport } from "@/lib/use-viewport";

function MainLayoutInner({ children }: { children: React.ReactNode }) {
  const viewport = useViewport();
  const { leftOpen, rightOpen, closeLeft, closeRight } = useMobileLayout();

  // Mobile (<768px): both sidebars as drawers
  if (viewport === "mobile") {
    return (
      <div className="flex h-[100dvh] flex-col overflow-hidden">
        <MobileHeader showLeft />
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

  // Tablet (768–1023px): left sidebar inline, right sidebar as drawer
  if (viewport === "tablet") {
    return (
      <div className="flex h-screen overflow-hidden">
        <LeftSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <MobileHeader showLeft={false} />
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-8 py-6">
            {children}
          </main>
        </div>
        <SidebarDrawer open={rightOpen} onClose={closeRight} side="right">
          <RightSidebar onClose={closeRight} />
        </SidebarDrawer>
      </div>
    );
  }

  // Desktop (≥1024px): both sidebars inline
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
