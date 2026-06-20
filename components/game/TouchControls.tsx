"use client";

// Datag — on-screen virtual joystick + role-specific action buttons for
// touch devices. Writes into refs that the InputSystem already polls.

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import type { Role } from "@/types/game";
import type { TouchActions, TouchAxes } from "@/game/systems/InputSystem";

interface Props {
  role: Role;
  axesRef: RefObject<TouchAxes>;
  actionsRef: RefObject<TouchActions>;
  /** play area used for aim (Lighter). Touch on this element sets mouse.x/y. */
  aimTarget?: RefObject<HTMLElement | null>;
  mouseWriter?: { x: number; y: number };
}

const JOY_RADIUS = 56;

export function TouchControls({
  role,
  axesRef,
  actionsRef,
  aimTarget,
  mouseWriter,
}: Props) {
  // --- joystick ---
  const joyRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const joyActive = useRef<number | null>(null);

  const setKnob = (dx: number, dy: number) => {
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    axesRef.current = { x: dx / JOY_RADIUS, y: dy / JOY_RADIUS };
  };

  const onJoyStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    joyActive.current = e.pointerId;
    joyRef.current?.setPointerCapture(e.pointerId);
    updateJoy(e);
  };
  const onJoyMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (joyActive.current !== e.pointerId) return;
    e.preventDefault();
    updateJoy(e);
  };
  const onJoyEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (joyActive.current !== e.pointerId) return;
    joyActive.current = null;
    setKnob(0, 0);
  };
  const updateJoy = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > JOY_RADIUS) {
      dx = (dx / d) * JOY_RADIUS;
      dy = (dy / d) * JOY_RADIUS;
    }
    setKnob(dx, dy);
  };

  // --- aim drag (Lighter only) ---
  useEffect(() => {
    const el = aimTarget?.current;
    if (!el || role !== "LIGHTER" || !mouseWriter) return;
    const apply = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const rect = el.getBoundingClientRect();
      mouseWriter.x = e.clientX - rect.left;
      mouseWriter.y = e.clientY - rect.top;
    };
    const onDown = (e: PointerEvent) => apply(e);
    const onMove = (e: PointerEvent) => {
      // only when the user is actively touching the play area
      if (e.pressure > 0 || e.buttons > 0) apply(e);
    };
    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
    };
  }, [aimTarget, role, mouseWriter]);

  // --- hold buttons (sprint / brightness) ---
  const setAction = (
    patch: Partial<TouchActions>,
  ) => {
    actionsRef.current = { ...(actionsRef.current ?? {}), ...patch };
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {/* Joystick (left, bottom) */}
      <div className="absolute left-4 bottom-4 pointer-events-auto">
        <div
          ref={joyRef}
          onPointerDown={onJoyStart}
          onPointerMove={onJoyMove}
          onPointerUp={onJoyEnd}
          onPointerCancel={onJoyEnd}
          className="relative rounded-full bg-panel/55 border border-line backdrop-blur touch-none"
          style={{ width: JOY_RADIUS * 2 + 30, height: JOY_RADIUS * 2 + 30 }}
        >
          <div
            ref={knobRef}
            className="absolute rounded-full bg-accent/80 shadow-glow"
            style={{
              width: 56,
              height: 56,
              left: `calc(50% - 28px)`,
              top: `calc(50% - 28px)`,
              transition: "transform 60ms linear",
            }}
          />
        </div>
        <div className="text-center text-[10px] uppercase tracking-widest text-muted mt-1">
          движение
        </div>
      </div>

      {/* Action buttons (right, bottom) */}
      <div className="absolute right-4 bottom-4 pointer-events-auto flex flex-col gap-3 items-end">
        {role === "TAGER" ? (
          <HoldButton
            label="SPRINT"
            onChange={(held) => setAction({ sprint: held })}
            className="bg-accent text-black text-lg w-24 h-24"
          />
        ) : (
          <>
            <HoldButton
              label="ЯРКО ＋"
              onChange={(held) => setAction({ lmb: held })}
              className="bg-accent/90 text-black"
            />
            <HoldButton
              label="ТУСКЛО −"
              onChange={(held) => setAction({ rmb: held })}
              className="bg-panel border border-line text-ink"
            />
          </>
        )}
      </div>
    </div>
  );
}

function HoldButton({
  label,
  onChange,
  className = "",
}: {
  label: string;
  onChange: (held: boolean) => void;
  className?: string;
}) {
  const id = useRef<number | null>(null);
  const handleDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    id.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onChange(true);
  };
  const handleUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (id.current !== e.pointerId) return;
    id.current = null;
    onChange(false);
  };
  return (
    <button
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
      className={`rounded-full px-5 h-16 min-w-[5.5rem] font-bold uppercase tracking-widest text-sm shadow-md active:brightness-110 touch-none ${className}`}
    >
      {label}
    </button>
  );
}
