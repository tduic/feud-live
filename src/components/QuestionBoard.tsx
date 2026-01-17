"use client";

import { Room } from "@/lib/room";

export function QuestionBoard({ room }: { room: Room }) {
  const { board } = room;

  // Filter to only show answers that have both text and points entered
  const filledAnswers = board.answers.filter(a => a.text.trim() !== "" && a.points > 0);

  return (
    <div className="card" style={{ width: "100%" }}>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div className="pill small">
          Control: {board.controlTeamId ?? "—"} • Buzzer: {board.buzzerOpen ? "OPEN" : "CLOSED"}
        </div>
      </div>

      <div className="hr" />

      <div style={{ textAlign: "center", marginBottom: 24, maxWidth: "100%", overflowWrap: "break-word" }}>
        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.3 }}>
          {board.question || "(No question set)"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, maxWidth: "100%" }}>
        {filledAnswers.map((a) => (
          <div
            key={a.id}
            style={{
              backgroundColor: "#ffffff",
              border: "2px solid #333",
              borderRadius: 8,
              padding: 12,
              minHeight: 40,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "center"
            }}
          >
            {a.revealed ? (
              <>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#0066cc", flex: 1 }}>
                  {a.text}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0066cc", marginLeft: 12, whiteSpace: "nowrap" }} className="mono">
                  ({a.points})
                </div>
              </>
            ) : (
              <div style={{ fontSize: 20, fontWeight: 900, color: "#ccc", width: "100%", textAlign: "center" }}>?</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
