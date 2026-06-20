"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TeamPanel } from "@/components/lobby/TeamPanel";
import { ChatBox } from "@/components/lobby/ChatBox";
import { useSocketStore } from "@/stores/useSocketStore";
import { useRoomStore } from "@/stores/useRoomStore";
import type { ChatMessage, Role, RoomState, Team } from "@/types/game";

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const connect = useSocketStore((s) => s.connect);
  const socket = useSocketStore((s) => s.socket);
  const nickname = useRoomStore((s) => s.nickname);
  const room = useRoomStore((s) => s.room);
  const setRoom = useRoomStore((s) => s.setRoom);
  const pushChat = useRoomStore((s) => s.pushChat);

  const [err, setErr] = useState<string | null>(null);

  // bootstrap: ensure socket + room
  useEffect(() => {
    const s = connect();
    const onUpdate = (r: RoomState) => setRoom(r);
    const onChat = (m: ChatMessage) => pushChat(m);
    s.on("room:update", onUpdate);
    s.on("room:chat", onChat);
    s.on("match:start", () => router.push(`/game/${code}`));

    // if we landed here without a room (refresh) — try to join
    if (!room && nickname) {
      s.emit("room:join", { nickname, code: String(code) }, (res) => {
        if (!res.ok) setErr(res.error);
        else setRoom(res.room);
      });
    }
    return () => {
      s.off("room:update", onUpdate);
      s.off("room:chat", onChat);
      s.off("match:start");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meId = socket?.id ?? null;
  const me = useMemo(
    () => room?.players.find((p) => p.id === meId) ?? null,
    [room, meId],
  );

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <h1 className="text-xl mb-2">Не удалось войти</h1>
          <p className="text-muted mb-4">{err}</p>
          <Link href="/" className="btn-primary inline-block">В меню</Link>
        </Card>
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

  const onSelect = (team: Team, role: Role) =>
    socket?.emit("room:select", { team, role });
  const onReady = (v: boolean) => socket?.emit("room:ready", { ready: v });
  const onStart = () => socket?.emit("room:start");
  const onChatSend = (text: string) => socket?.emit("room:chat", { text });
  const onLeave = () => {
    socket?.emit("room:leave");
    setRoom(null);
    router.push("/");
  };

  const isHost = meId === room.hostId;
  const ready = me?.ready ?? false;
  const allReady = room.players.length === 4 && room.players.every((p) => p.ready && p.team && p.role);

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
            </Card>
            <ChatBox messages={room.chat} onSend={onChatSend} />
          </div>
          <TeamPanel team="B" players={room.players} meId={meId} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
