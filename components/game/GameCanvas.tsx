"use client";

// Datag — Pixi mount. Subscribes to useGameStore for snapshots (filled by
// the active HostController/PeerClient), drives an InputSystem that calls
// useRealtimeStore.input() with the unified send API.

import { useEffect, useRef, useState } from "react";
import { useRealtimeStore } from "@/stores/useRealtimeStore";
import { useGameStore } from "@/stores/useGameStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useMouse } from "@/hooks/useMouse";
import { PixiApp } from "@/game/engine/PixiApp";
import { Renderer } from "@/game/engine/Renderer";
import { InputSystem } from "@/game/systems/InputSystem";
import type { Role } from "@/types/game";

export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const keys = useKeyboard();
  const mouse = useMouse(wrapRef);
  const room = useRoomStore((s) => s.room);
  const sendInput = useRealtimeStore((s) => s.input);
  const myPeerId = useRealtimeStore((s) => s.myPeerId);

  const [phase, setPhase] = useState<"loading" | "live">("loading");

  useEffect(() => {
    if (!hostRef.current) return;
    const me = room?.players.find((p) => p.id === myPeerId);
    const myRole: Role = me?.role ?? "TAGER";

    const pixi = new PixiApp();
    const renderer = new Renderer(pixi);
    const input = new InputSystem(
      { role: myRole, containerSize: { w: 1, h: 1 } },
      keys,
      mouse,
      (p) => sendInput(p),
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

    // bridge: re-render scene whenever a new snapshot lands in the store
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
    </div>
  );
}

function sizeOf(el: HTMLElement | null): { w: number; h: number } {
  if (!el) return { w: 1, h: 1 };
  const r = el.getBoundingClientRect();
  return { w: r.width || 1, h: r.height || 1 };
}
