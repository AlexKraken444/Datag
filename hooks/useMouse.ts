"use client";

import { useEffect, useRef } from "react";

export interface MouseState {
  /** screen coords inside the target element */
  x: number;
  y: number;
  lmb: boolean;
  rmb: boolean;
}

/** Tracks pointer position inside `target`. Only real mouse buttons (not
 *  synthetic ones from touches) set lmb/rmb — on touch devices the
 *  brightness control comes from the on-screen buttons instead.
 */
export function useMouse(target: React.RefObject<HTMLElement | null>) {
  const ref = useRef<MouseState>({ x: 0, y: 0, lmb: false, rmb: false });
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      ref.current.x = e.clientX - rect.left;
      ref.current.y = e.clientY - rect.top;
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (e.button === 0) ref.current.lmb = true;
      if (e.button === 2) ref.current.rmb = true;
    };
    const up = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (e.button === 0) ref.current.lmb = false;
      if (e.button === 2) ref.current.rmb = false;
    };
    const ctx = (e: MouseEvent) => e.preventDefault();
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("contextmenu", ctx);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("contextmenu", ctx);
    };
  }, [target]);
  return ref;
}
