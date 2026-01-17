"use client";

import { useMemo, useState } from "react";
import { Buzz } from "@/lib/buzz";
import { Room, TeamId } from "@/lib/room";

export function Buzzer({
  room,
  buzzes,
  canBuzz,
  onBuzz
}: {
  room: Room;
  buzzes: Buzz[];
  canBuzz: boolean;
  onBuzz: () => Promise<void>;
}) {
  const [sending, setSending] = useState(false);

  const winner = useMemo(() => buzzes[0] ?? null, [buzzes]);

  return (
    <div className="card" style={{ width: "100%" }}>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="h2">Buzzer</div>
          <div className="small">
            {room.board.buzzerOpen ? "Open" : "Closed"} • First buzz wins
          </div>
        </div>
        {winner ? (
          <div className="pill">
            <span className="small">Winner:</span>
            <span style={{ fontWeight: 800 }}>{winner.playerName}</span>
            <span className="small">({teamLabel(winner.teamId)})</span>
          </div>
        ) : (
          <div className="pill small">No buzz yet</div>
        )}
      </div>

      <div className="hr" />

      <button
        className="buzzer"
        disabled={!room.board.buzzerOpen || !canBuzz || sending}
        onClick={async () => {
          try {
            setSending(true);
            await onBuzz();
          } finally {
            setSending(false);
          }
        }}
      >
        {room.board.buzzerOpen ? (sending ? "BUZZING…" : "BUZZ!") : "BUZZER CLOSED"}
      </button>

      <div className="small" style={{ marginTop: 10 }}>
        Buzz order: {buzzes.length ? buzzes.slice(0, 5).map((b, i) => `${i + 1}) ${b.playerName}`).join(" • ") : "—"}
      </div>
    </div>
  );
}

function teamLabel(t: TeamId | null) {
  return t ?? "No team";
}
