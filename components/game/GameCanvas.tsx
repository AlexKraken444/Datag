"use client";

// Datak — Pixi mount. Subscribes to useGameStore for snapshots (filled by
// the active HostController/PeerClient), drives an InputSystem that calls
// useRealtimeStore.input() with the unified send API. On touch devices,
// renders a virtual joystick + action buttons that feed into the same
// InputSystem via dedicated refs.

import { useEffect, useRef, useState } from "react";
import { useRealtimeStore } from "@/stores/useRealtimeStore";
import { useGameStore } from "@/stores/useGameStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useMouse } from "@/hooks/useMouse";
import { useIsTouch } from "@/hooks/useIsTouch";
import { PixiApp } from "@/game/engine/PixiApp";
import { Renderer } from "@/game/engine/Renderer";
import {
  InputSystem,
  type TouchActions,
  type TouchAxes,
} from "@/game/systems/InputSystem";
import { TouchControls } from "./TouchControls";
import type { Role } from "@/types/game";

export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const keys = useKeyboard();
  const mouse = useMouse(wrapRef);
  const room = useRoomStore((s) => s.room);
  const sendInput = useRealtimeStore((s) => s.input);
  const myPeerId = useRealtimeStore((s) => s.myPeerId);
  const isTouch = useIsTouch();

  const touchAxes = useRef<TouchAxes>({ x: 0, y: 0 });
  const touchActions = useRef<TouchActions>({});

  const [phase, setPhase] = useState<"loading" | "live">("loading");
  const me = room?.players.find((p) => p.id === myPeerId);
  const myRole: Role = me?.role ?? "TAGER";

  useEffect(() => {
    if (!hostRef.current) return;

    const pixi = new PixiApp();
    const renderer = new Renderer(pixi);
    const input = new InputSystem(
      { role: myRole, containerSize: { w: 1, h: 1 } },
      keys,
      mouse,
      (p) => sendInput(p),
      touchAxes,
      touchActions,
    );

    let cancelled = false;
    (async () => {
      await pixi.init(hostRef.current!);
      if (cancelled) return;
      if (room) {
        const map: Record<string, string> = {};
        for (const p of room.players) map[p.id] = p.nickname;
        renderer.setNicknames(map);
      }
      input.setConfig({ containerSize: sizeOf(wrapRef.current) });
      input.start();
      setPhase("live");
    })();

    const unsubSnap = useGameStore.subscribe((state, prev) => {
      if (state.snapshot && state.snapshot !== prev.snapshot) {
        renderer.apply(state.snapshot);
      }
    });

    const onResize = () =>
      input.setConfig({ containerSize: sizeOf(wrapRef.current) });
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      unsubSnap();
      input.stop();
      renderer.destroy();
      pixi.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full h-full">
      <div ref={hostRef} className="absolute inset-0" />
      {phase === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-muted">
          Загружаем сцену…
        </div>
      )}
      {isTouch && phase === "live" && (
        <TouchControls
          role={myRole}
          axesRef={touchAxes}
          actionsRef={touchActions}
          aimTarget={wrapRef}
          mouseWriter={mouse.current ?? undefined}
        />
      )}
    </div>
  );
}

function sizeOf(el: HTMLElement | null): { w: number; h: number } {
  if (!el) return { w: 1, h: 1 };
  const r = el.getBoundingClientRect();
  return { w: r.width || 1, h: r.height || 1 };
}
