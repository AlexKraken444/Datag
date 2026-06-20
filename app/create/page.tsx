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

export default function CreateRoomPage() {
  const router = useRouter();
  const connect = useSocketStore((s) => s.connect);
  const nickname = useRoomStore((s) => s.nickname);
  const setNickname = useRoomStore((s) => s.setNickname);
  const [nick, setNick] = useState(nickname || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onCreate() {
    setErr(null);
    if (!nicknameValid(nick))
      return setErr("Ник должен быть 2–16 символов: буквы/цифры/_/-");
    setBusy(true);
    setNickname(nick);
    const sock = connect();
    sock.emit("room:create", { nickname: nick }, (res) => {
      setBusy(false);
      if (!res.ok) return setErr(res.error);
      router.push(`/room/${res.code}`);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <Link href="/" className="self-start"><Logo /></Link>
        <Card className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Создать комнату</h1>
          <Input
            label="Ник"
            placeholder="ShadowHunter"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={16}
            autoFocus
          />
          {err && <div className="text-red text-sm">{err}</div>}
          <Button variant="primary" disabled={busy} onClick={onCreate}>
            {busy ? "Создаём…" : "Создать"}
          </Button>
          <Link href="/" className="text-muted text-sm hover:text-ink text-center">
            ← в меню
          </Link>
        </Card>
      </div>
    </div>
  );
}
