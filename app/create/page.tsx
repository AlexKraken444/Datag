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
import { useProfileStore } from "@/stores/useProfileStore";
import { generateRoomCode, nicknameValid } from "@/lib/code";
import { awardCoinsToProfile } from "@/lib/awardCoins";

export default function CreateRoomPage() {
  const router = useRouter();
  const setHost = useRealtimeStore((s) => s.setHost);
  const reset = useRealtimeStore((s) => s.reset);
  const profile = useProfileStore((s) => s.profile);
  const setProfileNickname = useProfileStore((s) => s.setNickname);
  const setRoom = useRoomStore((s) => s.setRoom);
  const pushChat = useRoomStore((s) => s.pushChat);
  const [nick, setNick] = useState(profile.nickname || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onCreate() {
    setErr(null);
    if (!nicknameValid(nick))
      return setErr("Ник: 2–16 символов: буквы/цифры/_/-");
    setBusy(true);
    setProfileNickname(nick);

    const { HostController } = await import("@/game/host/HostController");
    // try up to 3 codes in case of collision
    let host: InstanceType<typeof HostController> | null = null;
    let lastErr = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateRoomCode();
      const candidate = new HostController(code, {
        onRoom: (s) => setRoom(s),
        onChat: (m) => pushChat(m),
        onMatchStart: () => {
          useGameStore.getState().reset();
          router.push(`/game/${code}`);
        },
        onSnapshot: (snap) => useGameStore.getState().setSnapshot(snap),
        onRoundEnd: (e) =>
          useGameStore.getState().setLastRoundEnd({ ...e, ts: Date.now() }),
        onMatchEnd: (sum) => {
          useGameStore.getState().setSummary(sum);
          awardCoinsToProfile(sum);
        },
        onError: (msg) => setErr(msg),
      });
      const res = await candidate.init(nick, profile.upgrades, profile.coins);
      if (res.ok) {
        host = candidate;
        break;
      }
      candidate.destroy();
      lastErr = res.error;
    }
    setBusy(false);
    if (!host) {
      reset();
      setErr(lastErr || "Не удалось создать комнату");
      return;
    }
    setHost(host);
    router.push(`/room/${host.roomCode}`);
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
          <div className="text-xs text-muted">
            Ты будешь хостом — твой браузер запустит симуляцию матча.
            Передай код комнаты остальным игрокам.
          </div>
          <Link href="/" className="text-muted text-sm hover:text-ink text-center">
            ← в меню
          </Link>
        </Card>
      </div>
    </div>
  );
}
