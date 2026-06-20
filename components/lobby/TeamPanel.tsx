"use client";

import type { LobbyPlayer, Role, Team } from "@/types/game";

interface Props {
  team: Team;
  players: LobbyPlayer[];
  meId: string | null;
  onSelect: (team: Team, role: Role) => void;
}

const ROLES: Role[] = ["TAGER", "LIGHTER"];

export function TeamPanel({ team, players, meId, onSelect }: Props) {
  const color = team === "A" ? "border-red text-red" : "border-blue text-blue";
  return (
    <div className={`card flex flex-col gap-3 border-2 ${color}`}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold">Команда {team}</div>
        <div className="text-xs text-muted">2 слота</div>
      </div>
      {ROLES.map((role) => {
        const taken = players.find((p) => p.team === team && p.role === role);
        const isMe = taken?.id === meId;
        return (
          <button
            key={role}
            onClick={() => onSelect(team, role)}
            className={`text-left rounded-md p-3 border transition ${
              taken
                ? "border-line bg-bg"
                : "border-dashed border-line hover:border-accent/60"
            }`}
          >
            <div className="text-xs text-muted">{role}</div>
            <div className="text-base font-medium">
              {taken ? (
                <span className={isMe ? "text-accent" : "text-ink"}>
                  {taken.nickname} {isMe && "(ты)"}
                  {taken.ready && (
                    <span className="ml-2 text-xs text-accent">● готов</span>
                  )}
                  {!taken.connected && (
                    <span className="ml-2 text-xs text-muted">⏸ оффлайн</span>
                  )}
                </span>
              ) : (
                <span className="text-muted">— занять место —</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
