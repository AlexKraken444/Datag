"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await signIn("credentials", {
      email,
      password: pwd,
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setErr("Неверный email или пароль");
      return;
    }
    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        <Link href="/" className="self-start"><Logo /></Link>
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <h1 className="text-xl font-semibold">Вход</h1>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Пароль"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
              autoComplete="current-password"
            />
            {err && <div className="text-red text-sm">{err}</div>}
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Входим…" : "Войти"}
            </Button>
            <div className="text-sm text-muted text-center">
              Нет аккаунта?{" "}
              <Link href="/register" className="text-accent underline">
                Зарегистрироваться
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
      </div>
    </div>
  );
}
