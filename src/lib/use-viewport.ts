"use client";

import { useEffect, useState } from "react";

export type ViewportSize = "mobile" | "tablet" | "desktop";

export function useViewport(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>("desktop");

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w < 768) setSize("mobile");
      else if (w < 1024) setSize("tablet");
      else setSize("desktop");
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}
