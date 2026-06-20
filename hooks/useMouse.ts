"use client";

import { useEffect, useRef } from "react";

export interface MouseState {
  /** screen coords inside the target element */
  x: number;
  y: number;
  lmb: boolean;
  rmb: boolean;
}

export function useMouse(target: React.RefObject<HTMLElement | null>) {
  const ref = useRef<MouseState>({ x: 0, y: 0, lmb: false, rmb: false });
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      ref.current.x = e.clientX - rect.left;
      ref.current.y = e.clientY - rect.top;
    };
    const down = (e: MouseEvent) => {
      if (e.button === 0) ref.current.lmb = true;
      if (e.button === 2) ref.current.rmb = true;
    };
    const up = (e: MouseEvent) => {
      if (e.button === 0) ref.current.lmb = false;
      if (e.button === 2) ref.current.rmb = false;
    };
    const ctx = (e: MouseEvent) => e.preventDefault();
    el.addEventListener("mousemove", move);
    el.addEventListener("mousedown", down);
    el.addEventListener("mouseup", up);
    el.addEventListener("contextmenu", ctx);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mousedown", down);
      el.removeEventListener("mouseup", up);
      el.removeEventListener("contextmenu", ctx);
    };
  }, [target]);
  return ref;
}
