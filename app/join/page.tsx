"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useSocketStore } from "@/stores/useSocketStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { nicknameValid } from "@/lib/code";

export default function JoinRoomPage() {
  const router = useRouter();
  const connect = useSocketStore((s) => s.connect);
  const nickname = useRoomStore((s) => s.nickname);
  const setNickname = useRoomStore((s) => s.setNickname);
  const setRoom = useRoomStore((s) => s.setRoom);
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
    const sock = connect();
    sock.emit("room:join", { nickname: nick, code: c }, (res) => {
      setBusy(false);
      if (!res.ok) return setErr(res.error);
      setRoom(res.room);
      router.push(`/room/${c}`);
    });
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
