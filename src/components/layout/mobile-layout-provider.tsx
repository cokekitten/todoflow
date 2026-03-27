"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface MobileLayoutContextValue {
  leftOpen: boolean;
  rightOpen: boolean;
  openLeft: () => void;
  openRight: () => void;
  closeLeft: () => void;
  closeRight: () => void;
  closeAll: () => void;
}

const MobileLayoutContext = createContext<MobileLayoutContextValue>({
  leftOpen: false,
  rightOpen: false,
  openLeft: () => undefined,
  openRight: () => undefined,
  closeLeft: () => undefined,
  closeRight: () => undefined,
  closeAll: () => undefined,
});

export function useMobileLayout() {
  return useContext(MobileLayoutContext);
}

export function MobileLayoutProvider({ children }: { children: React.ReactNode }) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const openLeft = useCallback(() => {
    setRightOpen(false);
    setLeftOpen(true);
  }, []);

  const openRight = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(true);
  }, []);

  const closeLeft = useCallback(() => setLeftOpen(false), []);
  const closeRight = useCallback(() => setRightOpen(false), []);
  const closeAll = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, []);

  return (
    <MobileLayoutContext.Provider
      value={{ leftOpen, rightOpen, openLeft, openRight, closeLeft, closeRight, closeAll }}
    >
      {children}
    </MobileLayoutContext.Provider>
  );
}
