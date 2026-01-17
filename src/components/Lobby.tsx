"use client";

import { useMemo } from "react";
import { Player } from "@/lib/players";
import { Team, TeamId } from "@/lib/room";

export function Lobby({
  teams,
  players,
  myPlayerId,
  isHost,
  onJoinTeam
}: {
  teams: Team[];
  players: Player[];
  myPlayerId: string;
  isHost: boolean;
  onJoinTeam: (teamId: TeamId) => Promise<void>;
}) {
  const byTeam = useMemo(() => {
    const map: Record<string, Player[]> = { A: [], B: [], C: [], D: [] };
    for (const p of players) {
      if (p.teamId && map[p.teamId]) map[p.teamId].push(p);
    }
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [players]);

  const me = players.find((p) => p.id === myPlayerId);

  return (
    <div className="card" style={{ width: "100%" }}>
      <div className="h2">Lobby</div>
      <div className="small">
        {isHost ? (
          <>You're the host: <span className="mono">{me?.name ?? "(unknown)"}</span>. You cannot join a team.</>
        ) : (
          <>Pick a team. You're: <span className="mono">{me?.name ?? "(unknown)"}</span></>
        )}
      </div>

      <div className="hr" />

      <div className="row" style={{ width: "100%" }}>
        {teams.map((t) => (
          <div key={t.id} className="card" style={{ flex: 1, minWidth: 240 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{t.name}</div>
              <button
                className="btn btnSecondary"
                onClick={() => onJoinTeam(t.id)}
                disabled={isHost}
                style={isHost ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
                Join
              </button>
            </div>
            <div className="small" style={{ marginTop: 8 }}>
              Players ({byTeam[t.id]?.length ?? 0}/5)
            </div>
            <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 16 }}>
              {(byTeam[t.id] ?? []).slice(0, 8).map((p) => (
                <li key={p.id}>
                  {p.name}
                  {p.id === myPlayerId ? " (you)" : ""}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="hr" />
      <div className="small">Tip: Aim for 5 per team, but the app won’t block you.</div>
    </div>
  );
}
