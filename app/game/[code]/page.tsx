"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSocketStore } from "@/stores/useSocketStore";
import { useGameStore } from "@/stores/useGameStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { Scoreboard } from "@/components/game/Scoreboard";
import { RoundTimer } from "@/components/game/RoundTimer";
import { WinScreen } from "@/components/game/WinScreen";
import { Button } from "@/components/ui/Button";
import { useFullscreen } from "@/hooks/useFullscreen";

const GameCanvas = dynamic(
  () => import("@/components/game/GameCanvas").then((m) => m.GameCanvas),
  { ssr: false },
);

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const connect = useSocketStore((s) => s.connect);
  const snapshot = useGameStore((s) => s.snapshot);
  const summary = useGameStore((s) => s.summary);
  const resetGame = useGameStore((s) => s.reset);
  const room = useRoomStore((s) => s.room);
  const { isFs, toggle } = useFullscreen();

  useEffect(() => {
    connect();
    return () => resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!room) {
    // no room context — bounce back to lobby
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <div className="text-muted mb-3">Контекст комнаты потерян.</div>
          <Link href={`/room/${code}`} className="btn-primary">
            Войти в комнату
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-panel/80 border-b border-line">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted hover:text-ink">←</Link>
          <div className="font-mono text-accent">{String(code)}</div>
          <div className="text-xs text-muted">
            раунд {snapshot?.round.index ?? 0}
          </div>
        </div>
        <Scoreboard score={snapshot?.score ?? { A: 0, B: 0 }} />
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={toggle}>
            {isFs ? "Свернуть" : "На весь экран"}
          </Button>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 relative bg-bg flex items-center justify-center">
        <div className="aspect-square w-full max-w-[min(100vh-120px,1100px)] h-full max-h-full relative">
          <GameCanvas roomCode={String(code)} />
          {snapshot?.round && <RoundTimer round={snapshot.round} />}
        </div>
        {summary && <WinScreen summary={summary} roomCode={String(code)} />}
      </div>

      {/* Footer hints */}
      <div className="px-4 py-2 bg-panel/70 border-t border-line text-xs text-muted flex items-center justify-between">
        <div>
          <span className="mr-3">Tager: WASD / Shift</span>
          <span>Lighter: A/D · мышь · ЛКМ/ПКМ</span>
        </div>
        <div>До 12 очков. Тень — это победа.</div>
      </div>
    </div>
  );
}
