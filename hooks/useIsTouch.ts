"use client";

import { useEffect, useState } from "react";

/** Detects whether the device is primarily touch-driven. */
export function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const detect = () =>
      "ontouchstart" in window ||
      (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
      window.matchMedia("(pointer: coarse)").matches;
    setIsTouch(detect());
  }, []);
  return isTouch;
}
