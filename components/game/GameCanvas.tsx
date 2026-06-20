"use client";

// Datag — game-screen mount: PIXI app + InputSystem + snapshot pipe.

import { useEffect, useRef, useState } from "react";
import { useSocketStore } from "@/stores/useSocketStore";
import { useGameStore } from "@/stores/useGameStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useMouse } from "@/hooks/useMouse";
import { PixiApp } from "@/game/engine/PixiApp";
import { Renderer } from "@/game/engine/Renderer";
import { InputSystem } from "@/game/systems/InputSystem";
import type { GameSnapshot, MatchSummary, Role } from "@/types/game";

interface Props {
  roomCode: string;
}

export function GameCanvas({ roomCode }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const keys = useKeyboard();
  const mouse = useMouse(wrapRef);
  const socket = useSocketStore((s) => s.socket);
  const room = useRoomStore((s) => s.room);
  const setSnapshot = useGameStore((s) => s.setSnapshot);
  const setSummary = useGameStore((s) => s.setSummary);
  const setLastEvent = useGameStore((s) => s.setLastEvent);

  const [phase, setPhase] = useState<"loading" | "live" | "ended">("loading");

  useEffect(() => {
    if (!hostRef.current || !socket) return;
    const me = room?.players.find((p) => p.id === socket.id);
    const myRole: Role = me?.role ?? "TAGER";

    const pixi = new PixiApp();
    const renderer = new Renderer(pixi);
    const input = new InputSystem(
      { role: myRole, containerSize: { w: 1, h: 1 } },
      keys,
      mouse,
      (p) => socket.emit("game:input", p),
    );

    let cancelled = false;
    (async () => {
      await pixi.init(hostRef.current!);
      if (cancelled) return;
      // nicknames map
      if (room) {
        const map: Record<string, string> = {};
        for (const p of room.players) map[p.id] = p.nickname;
        renderer.setNicknames(map);
      }
      input.setConfig({ containerSize: sizeOf(wrapRef.current) });
      input.start();
      setPhase("live");
      socket.emit("game:rejoin");
    })();

    const onSnapshot = (snap: GameSnapshot) => {
      renderer.apply(snap);
      setSnapshot(snap);
    };
    const onRoundEnd = (e: {
      scoredBy?: "A" | "B";
      bonus?: boolean;
      draw?: boolean;
    }) => {
      setLastEvent({
        type: e.draw ? "draw" : "hit",
        text: e.draw
          ? "Ничья — одновременное попадание"
          : `+${e.bonus ? 2 : 1} команде ${e.scoredBy}${e.bonus ? " (бонус)" : ""}`,
        ts: Date.now(),
      });
    };
    const onMatchEnd = (sum: MatchSummary) => {
      setSummary(sum);
      setPhase("ended");
    };

    const onResize = () => input.setConfig({ containerSize: sizeOf(wrapRef.current) });
    window.addEventListener("resize", onResize);

    socket.on("match:snapshot", onSnapshot);
    socket.on("match:round_end", onRoundEnd);
    socket.on("match:end", onMatchEnd);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      socket.off("match:snapshot", onSnapshot);
      socket.off("match:round_end", onRoundEnd);
      socket.off("match:end", onMatchEnd);
      input.stop();
      pixi.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

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
