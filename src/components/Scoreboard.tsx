"use client";

import { Room, Team, patchRoomIfHost } from "@/lib/room";
import { clamp } from "@/lib/util";

export function Scoreboard({
  room,
  isHost = false,
  roomId,
  hostSecret,
  delta = 10
}: {
  room: Room;
  isHost?: boolean;
  roomId?: string;
  hostSecret?: string;
  delta?: number;
}) {
  const teams = room.teams;

  async function setTeams(newTeams: Team[]) {
    if (!isHost || !roomId || !hostSecret) return;
    await patchRoomIfHost(roomId, hostSecret, { teams: newTeams });
  }

  async function updateTeam(id: string, fn: (t: any) => any) {
    if (!isHost || !roomId || !hostSecret) return;
    const newTeams = teams.map((t) => (t.id === id ? fn(t) : t));
    await setTeams(newTeams);
  }

  return (
    <div className="card" style={{ width: "100%" }}>
      <div className="h2">Scoreboard</div>
      <div className="row">
        {room.teams.map((t) => (
          <TeamCard
            key={t.id}
            team={t}
            room={room}
            isHost={isHost}
            onUpdateTeam={updateTeam}
            onUpdateName={(name) => {
              const newTeams = teams.map((x) => (x.id === t.id ? { ...x, name } : x));
              setTeams(newTeams);
            }}
            delta={delta}
          />
        ))}
      </div>
    </div>
  );
}

function TeamCard({
  team,
  room,
  isHost,
  onUpdateTeam,
  onUpdateName,
  delta
}: {
  team: Team;
  room: Room;
  isHost: boolean;
  onUpdateTeam: (id: string, fn: (t: any) => any) => void;
  onUpdateName: (name: string) => void;
  delta: number;
}) {
  const hasControl = room.board.controlTeamId === team.id;
  return (
    <div className="card" style={{ flex: 1, minWidth: 220 }}>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{team.name}</div>
        <div className="pill small">
          Round {room.round} • {room.multiplier}×{hasControl ? " • CONTROL" : ""}
        </div>
      </div>

      <div style={{ fontSize: 42, fontWeight: 800, marginTop: 8 }}>{team.score}</div>

      <div className="row" style={{ marginTop: 8, alignItems: "center", justifyContent: "space-between" }}>
        <div className="small">Strikes</div>
        <div className="mono" style={{ fontSize: 18 }}>
          {"X".repeat(team.strikes)}{"·".repeat(Math.max(0, 3 - team.strikes))}
        </div>
      </div>

      {isHost && (
        <>
          <div className="hr" />
          <div className="small" style={{ marginBottom: 4 }}>Host Controls</div>
          <input
            className="input"
            value={team.name}
            onChange={(e) => onUpdateName(e.target.value)}
            placeholder="Team name"
            style={{ fontSize: 12, marginBottom: 6 }}
          />
          <div className="row" style={{ gap: 4 }}>
            <button className="btn" onClick={() => onUpdateTeam(team.id, (x) => ({ ...x, score: x.score + delta * room.multiplier }))} style={{ fontSize: 11 }}>
              +{delta}×{room.multiplier}
            </button>
            <button className="btn btnSecondary" onClick={() => onUpdateTeam(team.id, (x) => ({ ...x, score: x.score - delta * room.multiplier }))} style={{ fontSize: 11 }}>
              -{delta}×{room.multiplier}
            </button>
          </div>
          <div className="row" style={{ marginTop: 4, gap: 4 }}>
            <button className="btn btnSecondary" onClick={() => onUpdateTeam(team.id, (x) => ({ ...x, strikes: clamp(x.strikes + 1, 0, 3) }))} style={{ fontSize: 11 }}>
              Strike +
            </button>
            <button className="btn btnSecondary" onClick={() => onUpdateTeam(team.id, (x) => ({ ...x, strikes: clamp(x.strikes - 1, 0, 3) }))} style={{ fontSize: 11 }}>
              Strike -
            </button>
          </div>
        </>
      )}
    </div>
  );
}
