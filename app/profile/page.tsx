"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { UpgradeTree } from "@/components/upgrades/UpgradeTree";
import { useProfileStore } from "@/stores/useProfileStore";
import { nicknameValid } from "@/lib/code";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const profile = useProfileStore((s) => s.profile);
  const setNicknameLocal = useProfileStore((s) => s.setNickname);
  const hardReset = useProfileStore((s) => s.hardReset);
  const addCoins = useProfileStore((s) => s.addCoins);

  const [nick, setNick] = useState(profile.nickname);
  const [editing, setEditing] = useState(!profile.nickname);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isAuthed = status === "authenticated";

  async function save() {
    setErr(null);
    if (!nicknameValid(nick))
      return setErr("Ник: 2–16 символов: буквы/цифры/_/-");
    if (isAuthed) {
      setBusy(true);
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nickname: nick }),
      });
      const data = await res.json();
      setBusy(false);
      if (!data.ok) {
        setErr(data.error || "Не получилось сохранить");
        return;
      }
      await update({ nickname: nick });
    }
    setNicknameLocal(nick);
    setEditing(false);
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="btn-ghost">← в меню</Link>
        </div>

        {/* Account / auth status */}
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Аккаунт</h2>
          {status === "loading" && (
            <div className="text-muted text-sm">Проверяем сессию…</div>
          )}
          {status === "unauthenticated" && (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-muted">
                Сейчас ты играешь как гость — баланс и апгрейды живут только в
                этом браузере. Заведи аккаунт, чтобы хранить прогресс на
                сервере и заходить с любого устройства.
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href="/register" className="btn-primary">
                  Зарегистрироваться
                </Link>
                <Link href="/login" className="btn">Войти</Link>
              </div>
            </div>
          )}
          {status === "authenticated" && session?.user?.email && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-sm text-muted">Email</div>
                <div className="font-medium break-all">
                  {session.user.email}
                </div>
                <div className="text-xs text-accent mt-1">
                  ☁ Профиль синхронизируется с сервером
                </div>
              </div>
              <Button
                variant="danger"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Выйти
              </Button>
            </div>
          )}
        </Card>

        <ProfileCard />

        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Ник в игре</h2>
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
                <Button variant="primary" onClick={save} disabled={busy}>
                  {busy ? "Сохраняем…" : "Сохранить"}
                </Button>
                {profile.nickname && (
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Отмена
                  </Button>
                )}
              </div>
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
                if (
                  confirm(
                    "Сбросить ЛОКАЛЬНЫЙ профиль? Серверный аккаунт это не удалит.",
                  )
                )
                  hardReset();
              }}
            >
              Сбросить локально
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
