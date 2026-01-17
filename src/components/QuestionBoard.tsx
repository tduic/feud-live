"use client";

import { Room } from "@/lib/room";

export function QuestionBoard({ room }: { room: Room }) {
  const { board } = room;
  return (
    <div className="card" style={{ width: "100%" }}>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="small">Question</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {board.question || "(No question set)"}
          </div>
        </div>
        <div className="pill small">
          Control: {board.controlTeamId ?? "—"} • Buzzer: {board.buzzerOpen ? "OPEN" : "CLOSED"}
        </div>
      </div>

      <div className="hr" />

      <div className="grid2">
        {board.answers.map((a, idx) => (
          <div key={a.id} className="card" style={{ minHeight: 70, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="small">#{idx + 1}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {a.revealed ? (a.text || "—") : "████████"}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900 }} className="mono">
              {a.revealed ? a.points : "__"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
