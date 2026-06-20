"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";

interface Row {
  nickname: string;
  wins: number;
  losses: number;
  hits: number;
  matches: number;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setRows(d.rows))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="btn-ghost">← в меню</Link>
        </div>
        <Card>
          <h1 className="text-xl font-semibold mb-4">Лидерборд</h1>
          {!rows && <div className="text-muted">Загрузка…</div>}
          {rows && rows.length === 0 && (
            <div className="text-muted">Пока пусто. Сыграй первый матч!</div>
          )}
          {rows && rows.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-muted text-xs uppercase">
                <tr>
                  <th className="text-left py-2">#</th>
                  <th className="text-left">Ник</th>
                  <th className="text-right">Победы</th>
                  <th className="text-right">Поражения</th>
                  <th className="text-right">Хиты</th>
                  <th className="text-right">Матчей</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.nickname} className="border-t border-line">
                    <td className="py-2 text-muted">{i + 1}</td>
                    <td className="font-medium">{r.nickname}</td>
                    <td className="text-right text-accent">{r.wins}</td>
                    <td className="text-right text-muted">{r.losses}</td>
                    <td className="text-right">{r.hits}</td>
                    <td className="text-right text-muted">{r.matches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
