"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";

interface Row {
  id: string;
  roomCode: string;
  startedAt: string;
  finishedAt: string | null;
  scoreA: number;
  scoreB: number;
  winner: string | null;
  players: { nickname: string; team: string; role: string; hits: number }[];
}

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    fetch("/api/history")
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
          <h1 className="text-xl font-semibold mb-4">История матчей</h1>
          {!rows && <div className="text-muted">Загрузка…</div>}
          {rows && rows.length === 0 && (
            <div className="text-muted">История пуста.</div>
          )}
          {rows && rows.length > 0 && (
            <ul className="space-y-3">
              {rows.map((m) => (
                <li key={m.id} className="border border-line rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <div className="font-mono text-xs text-muted">
                      #{m.id.slice(-6)} · {new Date(m.startedAt).toLocaleString()}
                    </div>
                    <div className="font-mono">
                      <span className="text-red">{m.scoreA}</span>
                      <span className="text-muted mx-1">:</span>
                      <span className="text-blue">{m.scoreB}</span>
                      {m.winner && (
                        <span className="ml-2 text-accent text-xs">
                          {m.winner === "DRAW" ? "ничья" : `победа ${m.winner}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {m.players.map((p) => (
                      <span
                        key={p.nickname + p.role}
                        className="mr-3"
                      >
                        <span
                          className={p.team === "A" ? "text-red" : "text-blue"}
                        >
                          {p.team}
                        </span>{" "}
                        {p.nickname} /{p.role}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
