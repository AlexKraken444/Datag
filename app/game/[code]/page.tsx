"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useGameStore } from "@/stores/useGameStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useRealtimeStore } from "@/stores/useRealtimeStore";
import { Scoreboard } from "@/components/game/Scoreboard";
import { RoundTimer } from "@/components/game/RoundTimer";
import { WinScreen } from "@/components/game/WinScreen";
import { Button } from "@/components/ui/Button";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useIsTouch } from "@/hooks/useIsTouch";

const GameCanvas = dynamic(
  () => import("@/components/game/GameCanvas").then((m) => m.GameCanvas),
  { ssr: false },
);

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const snapshot = useGameStore((s) => s.snapshot);
  const summary = useGameStore((s) => s.summary);
  const resetGame = useGameStore((s) => s.reset);
  const room = useRoomStore((s) => s.room);
  const role = useRealtimeStore((s) => s.role);
  const { isFs, toggle } = useFullscreen();
  const isTouch = useIsTouch();

  useEffect(() => {
    if (!role) {
      router.replace(`/join?code=${code}`);
    }
    return () => resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <div className="text-muted mb-3">Контекст комнаты потерян.</div>
          <Link href="/" className="btn-primary">
            В меню
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden min-h-0">
      {/* HUD */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 bg-panel/80 border-b border-line gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="text-muted hover:text-ink text-lg">←</Link>
          <div className="font-mono text-accent text-sm sm:text-base truncate">
            {String(code)}
          </div>
          <div className="hidden sm:block text-xs text-muted">
            раунд {snapshot?.round.index ?? 0}
          </div>
        </div>
        <Scoreboard score={snapshot?.score ?? { A: 0, B: 0 }} />
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            onClick={toggle}
            className="!px-2 sm:!px-3 text-xs sm:text-sm"
          >
            {isFs ? "↙" : "⛶"}
            <span className="hidden sm:inline ml-1">
              {isFs ? "Свернуть" : "Полный экран"}
            </span>
          </Button>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 relative bg-bg flex items-center justify-center min-h-0">
        <div className="aspect-square w-full max-w-[min(100dvh-90px,1100px)] h-full max-h-full relative">
          <GameCanvas />
          {snapshot?.round && <RoundTimer round={snapshot.round} />}
        </div>
        {summary && <WinScreen summary={summary} roomCode={String(code)} />}
      </div>

      {/* Footer hints — hidden on touch (controls overlay takes over) */}
      {!isTouch && (
        <div className="px-4 py-2 bg-panel/70 border-t border-line text-xs text-muted hidden md:flex items-center justify-between">
          <div>
            <span className="mr-3">Tager: WASD / Shift</span>
            <span>Lighter: WASD · мышь · ЛКМ/ПКМ</span>
          </div>
          <div>До 12 очков. Тень — это победа.</div>
        </div>
      )}
    </div>
  );
}
