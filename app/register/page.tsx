"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [nick, setNick] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pwd.length < 8) return setErr("Пароль — минимум 8 символов");
    if (pwd !== pwd2) return setErr("Пароли не совпадают");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: pwd, nickname: nick }),
      });
      const data = await res.json();
      if (!data.ok) {
        setErr(data.error || "Не получилось зарегистрироваться");
        setBusy(false);
        return;
      }
      // auto sign-in
      const signed = await signIn("credentials", {
        email,
        password: pwd,
        redirect: false,
      });
      if (signed?.error) {
        setErr("Регистрация прошла, но войти не получилось — попробуй /login");
        setBusy(false);
        return;
      }
      router.push("/profile");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        <Link href="/" className="self-start"><Logo /></Link>
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <h1 className="text-xl font-semibold">Регистрация</h1>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              maxLength={120}
            />
            <Input
              label="Ник (виден в матчах)"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              required
              maxLength={16}
              minLength={2}
              autoComplete="username"
            />
            <Input
              label="Пароль (≥ 8 символов)"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <Input
              label="Повтори пароль"
              type="password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {err && <div className="text-red text-sm">{err}</div>}
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Регистрируем…" : "Создать аккаунт"}
            </Button>
            <div className="text-sm text-muted text-center">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-accent underline">
                Войти
              </Link>
            </div>
            <Link
              href="/"
              className="text-muted text-sm hover:text-ink text-center"
            >
              ← в меню
            </Link>
          </form>
        </Card>
        <div className="text-xs text-muted text-center">
          Аккаунт хранит ник, баланс Tag-coin и купленные апгрейды на сервере.
          Можно играть и без регистрации — тогда данные живут только в этом
          браузере.
        </div>
      </div>
    </div>
  );
}
