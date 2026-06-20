"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { UpgradeTree } from "@/components/upgrades/UpgradeTree";
import { useProfileStore } from "@/stores/useProfileStore";
import { nicknameValid } from "@/lib/code";

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile);
  const setNickname = useProfileStore((s) => s.setNickname);
  const hardReset = useProfileStore((s) => s.hardReset);
  const addCoins = useProfileStore((s) => s.addCoins);

  const [nick, setNick] = useState(profile.nickname);
  const [editing, setEditing] = useState(!profile.nickname);
  const [err, setErr] = useState<string | null>(null);

  function save() {
    setErr(null);
    if (!nicknameValid(nick))
      return setErr("Ник: 2–16 символов: буквы/цифры/_/-");
    setNickname(nick);
    setEditing(false);
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="btn-ghost">← в меню</Link>
        </div>

        <ProfileCard />

        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Профиль</h2>
          {editing ? (
            <>
              <Input
                label="Ник (отображается в матчах)"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                maxLength={16}
                autoFocus
              />
              {err && <div className="text-red text-sm">{err}</div>}
              <div className="flex gap-2">
                <Button variant="primary" onClick={save}>
                  Сохранить
                </Button>
                {profile.nickname && (
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Отмена
                  </Button>
                )}
              </div>
              {!profile.nickname && (
                <div className="text-xs text-muted">
                  Это «регистрация» — ник, монеты и апгрейды сохраняются в этом
                  браузере (localStorage). Серверного аккаунта пока нет, чтобы
                  всё работало без авторизации.
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                Ник: <span className="font-semibold">{profile.nickname}</span>
              </div>
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Изменить
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <UpgradeTree />
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Сервис</h2>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              onClick={() => addCoins(100)}
              title="dev: +100 Tag-coins для теста"
            >
              +100 (dev)
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm("Сбросить профиль (ник, монеты, апгрейды)?"))
                  hardReset();
              }}
            >
              Сбросить профиль
            </Button>
          </div>
          <div className="text-xs text-muted">
            Кнопка «+100» нужна для проверки апгрейдов на старте. В реальной
            игре монеты приходят только за очки в матчах.
          </div>
        </Card>
      </div>
    </div>
  );
}
