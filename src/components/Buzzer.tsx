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

      {buzzes.length > 0 && (
        <>
          <div className="hr" />
          <div className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Buzz Order:</div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            {buzzes.slice(0, 5).map((b, i) => (
              <div key={i} style={{ padding: "4px 0", borderBottom: i < Math.min(buzzes.length, 5) - 1 ? "1px solid #eee" : "none" }}>
                <span style={{ fontWeight: 700 }}>{i + 1}.</span> {b.playerName} <span className="small">({teamLabel(b.teamId)})</span>
              </div>
            ))}
          </div>
        </>
      )}
      {buzzes.length === 0 && (
        <>
          <div className="hr" />
          <div className="small">Buzz order: —</div>
        </>
      )}
    </div>
  );
}

function teamLabel(t: TeamId | null) {
  return t ?? "No team";
}
