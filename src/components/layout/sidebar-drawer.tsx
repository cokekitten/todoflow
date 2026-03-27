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
          "absolute inset-0 bg-black/50 transition-opacity duration-200 ease-out",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={[
          "absolute top-0 bottom-0 flex flex-col overflow-y-auto transition-transform duration-200 ease-out",
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
