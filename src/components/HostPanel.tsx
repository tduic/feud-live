"use client";

import { useMemo, useState } from "react";
import { Room, TeamId, patchRoomIfHost, Answer } from "@/lib/room";
import { clamp, randomId } from "@/lib/util";
import { serverTimestamp } from "firebase/firestore";
import { clearBuzzes, Buzz } from "@/lib/buzz";
import { generateQuestion } from "@/lib/questionGenerator";

export function HostPanel({
  roomId,
  room,
  hostSecret,
  buzzes
}: {
  roomId: string;
  room: Room;
  hostSecret: string;
  buzzes: Buzz[];
}) {
  const [delta, setDelta] = useState<number>(10);
  const [duration, setDuration] = useState<number>(room.timer.durationSec);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const isRunning = room.timer.running;
  const teams = useMemo(() => room.teams, [room]);

  async function setTeams(newTeams = teams) {
    await patchRoomIfHost(roomId, hostSecret, { teams: newTeams });
  }

  async function updateTeam(id: string, fn: (t: any) => any) {
    const newTeams = teams.map((t) => (t.id === id ? fn(t) : t));
    await setTeams(newTeams);
  }

  async function setRound(n: number) {
    await patchRoomIfHost(roomId, hostSecret, { round: clamp(n, 1, 20) });
  }

  async function setMultiplier(m: 1 | 2) {
    await patchRoomIfHost(roomId, hostSecret, { multiplier: m });
  }

  async function setStatus(status: Room["status"]) {
    await patchRoomIfHost(roomId, hostSecret, { status });
  }

  // TIMER
  async function startTimer() {
    if (room.timer.running) return;
    await patchRoomIfHost(roomId, hostSecret, {
      timer: { ...room.timer, running: true, startedAt: serverTimestamp() }
    } as any);
  }

  async function pauseTimer() {
    if (!room.timer.running || !room.timer.startedAt) return;
    const startedMs = (room.timer.startedAt as any).toMillis?.() ?? Date.now();
    const elapsed = Math.floor((Date.now() - startedMs) / 1000);
    const remaining = clamp(room.timer.remainingSec - elapsed, 0, room.timer.durationSec);

    await patchRoomIfHost(roomId, hostSecret, {
      timer: { ...room.timer, running: false, startedAt: null, remainingSec: remaining }
    } as any);
  }

  async function resetTimer() {
    await patchRoomIfHost(roomId, hostSecret, {
      timer: { ...room.timer, running: false, startedAt: null, remainingSec: room.timer.durationSec }
    } as any);
  }

  async function applyDuration() {
    const d = clamp(duration, 10, 60 * 30);
    await patchRoomIfHost(roomId, hostSecret, {
      timer: { durationSec: d, remainingSec: d, running: false, startedAt: null }
    } as any);
  }

  // QUESTION BOARD
  const board = room.board;

  async function setBoard(patch: Partial<Room["board"]>) {
    await patchRoomIfHost(roomId, hostSecret, { board: { ...board, ...patch } } as any);
  }

  async function setAnswer(id: string, patch: Partial<Answer>) {
    const answers = board.answers.map((a) => (a.id === id ? { ...a, ...patch } : a));
    await setBoard({ answers });
  }

  async function addAnswer() {
    const answers = [...board.answers, { id: randomId(6), text: "", points: 0, revealed: false }];
    await setBoard({ answers });
  }

  async function resetBoard() {
    const answers = board.answers.map((a) => ({ ...a, revealed: false, text: "", points: 0 }));
    await setBoard({ question: "", answers, controlTeamId: null });
    await clearBuzzes(roomId);
  }

  async function generateNewQuestion() {
    setIsGenerating(true);
    try {
      const data = await generateQuestion();
      const answers = data.answers.map((ans) => ({
        id: randomId(6),
        text: ans.text,
        points: ans.points,
        revealed: false
      }));
      // Pad with empty answers up to 8
      while (answers.length < 8) {
        answers.push({
          id: randomId(6),
          text: "",
          points: 0,
          revealed: false
        });
      }
      await setBoard({ question: data.question, answers });
    } finally {
      setIsGenerating(false);
    }
  }

  async function toggleReveal(id: string) {
    const a = board.answers.find((x) => x.id === id);
    if (!a) return;
    await setAnswer(id, { revealed: !a.revealed });
  }

  async function awardAllRevealedAnswers() {
    const totalPoints = board.answers.reduce((sum, a) => sum + (a.revealed ? (Number(a.points) || 0) * room.multiplier : 0), 0);
    const tid = board.controlTeamId;
    if (!tid || totalPoints === 0) return;
    await updateTeam(tid, (t) => ({ ...t, score: t.score + totalPoints }));
  }

  async function openBuzzer(open: boolean) {
    await setBoard({ buzzerOpen: open });
    if (open) await clearBuzzes(roomId);
  }

  return (
    <div className="card" style={{ width: "100%" }}>
      <div className="h2">Host Controls</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="card">
          <div className="row" style={{ alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div className="small">Round</div>
              <div className="row" style={{ marginTop: 4 }}>
                <button className="btn btnSecondary" onClick={() => setRound(room.round - 1)}>-</button>
                <div className="pill mono">Round {room.round}</div>
                <button className="btn btnSecondary" onClick={() => setRound(room.round + 1)}>+</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="small">Multiplier</div>
              <div className="row" style={{ marginTop: 4 }}>
                <button className={`btn ${room.multiplier === 1 ? "" : "btnSecondary"}`} onClick={() => setMultiplier(1)}>1×</button>
                <button className={`btn ${room.multiplier === 2 ? "" : "btnSecondary"}`} onClick={() => setMultiplier(2)}>2×</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="small">Game State</div>
              <div className="row" style={{ marginTop: 4, gap: 4 }}>
                <button className="btn btnSecondary" onClick={() => setStatus("lobby")} style={{ fontSize: 12 }}>Lobby</button>
                <button className="btn" onClick={() => setStatus("live")} style={{ fontSize: 12 }}>Live</button>
                <button className="btn btnDanger" onClick={() => setStatus("ended")} style={{ fontSize: 12 }}>End</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div className="small">Timer Duration (sec)</div>
              <div className="row" style={{ gap: 4, marginTop: 4 }}>
                <input className="input" type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ flex: 1 }} />
                <button className="btn btnSecondary" onClick={applyDuration} style={{ fontSize: 11 }}>Set</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="small">Timer Controls</div>
              <div className="row" style={{ gap: 4, marginTop: 4 }}>
                <button className="btn" onClick={startTimer} disabled={isRunning} style={{ fontSize: 12 }}>Start</button>
                <button className="btn btnSecondary" onClick={pauseTimer} disabled={!isRunning} style={{ fontSize: 12 }}>Pause</button>
                <button className="btn btnSecondary" onClick={resetTimer} style={{ fontSize: 12 }}>Reset</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="small">Points Step</div>
              <input className="input" type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} style={{ marginTop: 4 }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div className="small">Control Team</div>
              <div className="row" style={{ gap: 4, marginTop: 4 }}>
                {teams.map((t) => (
                  <button
                    key={t.id}
                    className={`btn ${board.controlTeamId === t.id ? "" : "btnSecondary"}`}
                    onClick={() => setBoard({ controlTeamId: t.id })}
                    style={{ fontSize: 12 }}
                  >
                    {t.name}
                  </button>
                ))}
                <button className="btn btnSecondary" onClick={() => setBoard({ controlTeamId: null })} style={{ fontSize: 12 }}>None</button>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="small">Buzzer</div>
              <div className="row" style={{ gap: 4, marginTop: 4 }}>
                <button className={`btn ${board.buzzerOpen ? "btnSecondary" : ""}`} onClick={() => openBuzzer(true)} style={{ fontSize: 12 }}>
                  Open + Clear
                </button>
                <button className="btn btnSecondary" onClick={() => openBuzzer(false)} style={{ fontSize: 12 }}>
                  Close
                </button>
                <button className="btn btnSecondary" onClick={() => clearBuzzes(roomId)} style={{ fontSize: 12 }}>
                  Clear
                </button>
              </div>
              {buzzes.length > 0 && (
                <div style={{ marginTop: 8, padding: 10, backgroundColor: "#fff3cd", border: "2px solid #ffc107", borderRadius: 6 }}>
                  <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 13, color: "#856404" }}>🏁 Buzz Order</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {buzzes.slice(0, 5).map((b, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "6px 8px",
                          backgroundColor: i === 0 ? "#28a745" : "#fff",
                          color: i === 0 ? "#fff" : "#333",
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: i === 0 ? 700 : 500,
                          border: i === 0 ? "none" : "1px solid #dee2e6"
                        }}
                      >
                        <span style={{ fontWeight: 700, marginRight: 6 }}>{i + 1}.</span>
                        {b.playerName}
                        <span style={{ marginLeft: 6, fontSize: 11, opacity: i === 0 ? 0.9 : 0.7 }}>
                          (Team {b.teamId})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hr" />

      <div className="h2">Question Board</div>
      <div className="card">
        <div>
          <div className="small">Question</div>
          <input className="input" value={board.question} onChange={(e) => setBoard({ question: e.target.value })} placeholder="Type the question..." style={{ marginTop: 8 }} />
          <button
            className="btn"
            onClick={generateNewQuestion}
            disabled={isGenerating}
            style={{ width: "100%", marginTop: 8, opacity: isGenerating ? 0.6 : 1 }}
          >
            {isGenerating ? "🤖 Generating AI Question..." : "🎲 Generate AI Question"}
          </button>
        </div>

        <div className="hr" />

        <div className="small">Answers (Reveal + Award)</div>
        <div className="small">Tip: "Award All Revealed" adds the sum of all revealed answer points (× multiplier) to the control team.</div>
        <div className="hr" />
        <button
          className="btn"
          disabled={!board.controlTeamId || !board.answers.some(a => a.revealed)}
          onClick={awardAllRevealedAnswers}
          style={{ marginBottom: 12 }}
        >
          Award All Revealed
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {board.answers.map((a, idx) => (
            <div key={a.id} className="card" style={{ padding: 12 }}>
              <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
                <div className="row">
                  <div className="pill mono">#{idx + 1}</div>
                  <div className="pill mono" style={{ marginLeft: 8 }}>{a.points} pts</div>
                </div>
                <button className={`btn ${a.revealed ? "" : "btnSecondary"}`} onClick={() => toggleReveal(a.id)}>
                  {a.revealed ? "Revealed" : "Hidden"}
                </button>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <input
                  className="input"
                  value={a.text}
                  onChange={(e) => setAnswer(a.id, { text: e.target.value })}
                  placeholder="Answer text"
                />
                <input
                  className="input"
                  style={{ width: 120 }}
                  type="number"
                  value={a.points}
                  onChange={(e) => setAnswer(a.id, { points: Number(e.target.value) })}
                  placeholder="Pts"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn btnSecondary" onClick={addAnswer}>+ Add Answer Row</button>
        </div>

        <div className="hr" />
        <div className="row">
          <button className="btn btnSecondary" onClick={() => setTeams(teams.map((t) => ({ ...t, strikes: 0 })))}>
            Clear Strikes
          </button>
          <button className="btn btnSecondary" onClick={() => setTeams(teams.map((t) => ({ ...t, score: 0 })))}>
            Reset Scores
          </button>
          <button className="btn btnDanger" onClick={resetBoard}>
            Reset Board
          </button>
        </div>
      </div>
    </div>
  );
}
