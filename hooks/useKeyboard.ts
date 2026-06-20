"use client";

import { useEffect, useRef } from "react";

export type Keys = Record<string, boolean>;

export function useKeyboard() {
  const ref = useRef<Keys>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      ref.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      ref.current[e.code] = false;
    };
    const blur = () => (ref.current = {});
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  return ref;
}
