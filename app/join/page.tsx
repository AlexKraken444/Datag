"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useRealtimeStore } from "@/stores/useRealtimeStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useGameStore } from "@/stores/useGameStore";
import { nicknameValid } from "@/lib/code";

export default function JoinRoomPage() {
  const router = useRouter();
  const setPeer = useRealtimeStore((s) => s.setPeer);
  const reset = useRealtimeStore((s) => s.reset);
  const nickname = useRoomStore((s) => s.nickname);
  const setNickname = useRoomStore((s) => s.setNickname);
  const setRoom = useRoomStore((s) => s.setRoom);
  const pushChat = useRoomStore((s) => s.pushChat);
  const [nick, setNick] = useState(nickname || "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onJoin() {
    setErr(null);
    if (!nicknameValid(nick))
      return setErr("Ник: 2–16 символов: буквы/цифры/_/-");
    const c = code.trim().toUpperCase();
    if (c.length < 4) return setErr("Введи код комнаты");
    setBusy(true);
    setNickname(nick);

    const { PeerClient } = await import("@/game/host/PeerClient");
    const client = new PeerClient(c, nick, {
      onWelcome: () => {/* welcomed */},
      onRoom: (state) => setRoom(state),
      onChat: (m) => pushChat(m),
      onMatchStart: () => {
        useGameStore.getState().reset();
        router.push(`/game/${c}`);
      },
      onSnapshot: (snap) => useGameStore.getState().setSnapshot(snap),
      onRoundEnd: (e) =>
        useGameStore.getState().setLastRoundEnd({ ...e, ts: Date.now() }),
      onMatchEnd: (sum) => useGameStore.getState().setSummary(sum),
      onKicked: (reason) => {
        reset();
        setRoom(null);
        setErr(reason);
        router.push("/");
      },
      onError: (msg) => setErr(msg),
      onConnected: () => {/* noop */},
      onDisconnected: () => {/* keep showing what we have */},
    });

    const res = await client.connect();
    setBusy(false);
    if (!res.ok) {
      client.destroy();
      reset();
      setErr(res.error);
      return;
    }
    setPeer(client);
    router.push(`/room/${c}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <Link href="/" className="self-start"><Logo /></Link>
        <Card className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Подключиться по коду</h1>
          <Input
            label="Ник"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={16}
          />
          <Input
            label="Код комнаты"
            placeholder="ABCDEF"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
          {err && <div className="text-red text-sm">{err}</div>}
          <Button variant="primary" disabled={busy} onClick={onJoin}>
            {busy ? "Подключаемся…" : "Войти"}
          </Button>
          <Link href="/" className="text-muted text-sm hover:text-ink text-center">
            ← в меню
          </Link>
        </Card>
      </div>
    </div>
  );
}
