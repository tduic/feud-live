"use client";

import { Room, Team } from "@/lib/room";

export function Scoreboard({ room }: { room: Room }) {
  return (
    <div className="card" style={{ width: "100%" }}>
      <div className="h2">Scoreboard</div>
      <div className="row">
        {room.teams.map((t) => (
          <TeamCard key={t.id} team={t} room={room} />
        ))}
      </div>
    </div>
  );
}

function TeamCard({ team, room }: { team: Team; room: Room }) {
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
    </div>
  );
}
