"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const s = useSettingsStore();
  const nickname = useProfileStore((x) => x.profile.nickname);
  const setNickname = useProfileStore((x) => x.setNickname);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="btn-ghost">← в меню</Link>
        </div>
        <Card className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold">Настройки</h1>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Ник (из профиля)</span>
            <input
              className="input"
              defaultValue={nickname}
              onBlur={(e) => setNickname(e.target.value)}
              maxLength={16}
            />
            <span className="text-xs text-muted">
              Полный профиль и прокачка —{" "}
              <Link href="/profile" className="text-accent underline">
                на странице профиля
              </Link>
              .
            </span>
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Тема</span>
            <select
              className="input"
              value={s.theme}
              onChange={(e) => s.set({ theme: e.target.value as "dark" | "light" })}
            >
              <option value="dark">Тёмная</option>
              <option value="light">Светлая</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">
              Громкость: {(s.volume * 100) | 0}%
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={s.volume * 100}
              onChange={(e) => s.set({ volume: Number(e.target.value) / 100 })}
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Без звука</span>
            <input
              type="checkbox"
              checked={s.muted}
              onChange={(e) => s.set({ muted: e.target.checked })}
            />
          </label>

          <Button
            onClick={async () => {
              if (document.fullscreenElement) await document.exitFullscreen();
              else await document.documentElement.requestFullscreen();
            }}
          >
            Переключить полноэкранный режим
          </Button>
        </Card>
      </div>
    </div>
  );
}
