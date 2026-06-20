"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TeamPanel } from "@/components/lobby/TeamPanel";
import { ChatBox } from "@/components/lobby/ChatBox";
import { useRealtimeStore } from "@/stores/useRealtimeStore";
import { useRoomStore } from "@/stores/useRoomStore";
import type { Role, Team } from "@/types/game";

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const rt = useRealtimeStore();
  const room = useRoomStore((s) => s.room);
  const setRoom = useRoomStore((s) => s.setRoom);

  // If user landed here directly (refresh / deep link) without an active
  // connection, bounce them back to /join so they re-enter the code+nick.
  useEffect(() => {
    if (!rt.role) {
      router.replace(`/join?code=${code}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meId = rt.myPeerId;
  const me = useMemo(
    () => room?.players.find((p) => p.id === meId) ?? null,
    [room, meId],
  );

  if (!rt.role) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Соединение потеряно, возвращаемся к подключению…
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Подключаемся к комнате <span className="ml-2 text-ink">{String(code)}</span>…
      </div>
    );
  }

  const onSelect = (team: Team, role: Role) => rt.select(team, role);
  const onReady = (v: boolean) => rt.ready(v);
  const onStart = () => rt.start();
  const onChatSend = (text: string) => rt.chat(text);
  const onLeave = () => {
    rt.reset();
    setRoom(null);
    router.push("/");
  };

  const isHost = meId === room.hostId;
  const ready = me?.ready ?? false;
  const allReady =
    room.players.length === 4 &&
    room.players.every((p) => p.ready && p.team && p.role);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="flex items-center gap-3">
            <div className="text-muted text-sm">Код комнаты</div>
            <div className="px-3 py-1.5 rounded-md bg-panel border border-line font-mono tracking-widest text-accent text-lg select-all">
              {room.code}
            </div>
            <Button variant="ghost" onClick={onLeave}>Выйти</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TeamPanel team="A" players={room.players} meId={meId} onSelect={onSelect} />
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3 items-center text-center">
              <div className="text-sm text-muted">Игроков в комнате</div>
              <div className="text-3xl font-bold">{room.players.length} / 4</div>
              <div className="text-sm text-muted">
                Выбери команду и роль слева/справа, потом нажми «Готов».
              </div>
              <Button
                variant={ready ? "danger" : "primary"}
                disabled={!me?.team || !me?.role}
                onClick={() => onReady(!ready)}
              >
                {ready ? "Снять готовность" : "Я готов"}
              </Button>
              {isHost && (
                <Button onClick={onStart} disabled={!allReady}>
                  Старт матча {allReady ? "" : "(нужны 4 готовых)"}
                </Button>
              )}
              {isHost && (
                <div className="text-xs text-accent">
                  Ты хост — твой браузер будет крутить симуляцию.
                </div>
              )}
            </Card>
            <ChatBox messages={room.chat} onSend={onChatSend} />
          </div>
          <TeamPanel team="B" players={room.players} meId={meId} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
