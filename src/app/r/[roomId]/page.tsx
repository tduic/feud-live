"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { subscribeRoom, Room, TeamId, patchRoomIfHost } from "@/lib/room";
import { TimerView } from "@/components/Timer";
import { Scoreboard } from "@/components/Scoreboard";
import { HostPanel } from "@/components/HostPanel";
import { CopyBox } from "@/components/CopyBox";
import { Lobby } from "@/components/Lobby";
import { QuestionBoard } from "@/components/QuestionBoard";
import { Buzzer } from "@/components/Buzzer";
import { ensurePlayer, setPlayerTeam, subscribePlayers, touchPlayer, Player } from "@/lib/players";
import { buzz, subscribeBuzzes, Buzz as BuzzType } from "@/lib/buzz";
import { randomId } from "@/lib/util";

function getOrCreatePlayerId() {
  if (typeof window === "undefined") return "";
  const k = "feud_player_id";
  let id = window.localStorage.getItem(k);
  if (!id) {
    id = randomId(20);
    window.localStorage.setItem(k, id);
  }
  return id;
}

function getOrCreatePlayerName() {
  if (typeof window === "undefined") return "";
  const k = "feud_player_name";
  let name = window.localStorage.getItem(k);
  if (!name) {
    // Assign a unique default name based on player counter
    const counterKey = "feud_player_counter";
    let counter = parseInt(window.localStorage.getItem(counterKey) || "0", 10);
    counter += 1;
    window.localStorage.setItem(counterKey, counter.toString());
    name = `Player ${counter}`;
    window.localStorage.setItem(k, name);
  }
  return name;
}

function savePlayerName(name: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("feud_player_name", name);
  }
}

export default function RoomPage({ params }: { params: { roomId: string } }) {
  const { roomId } = params;
  const sp = useSearchParams();
  const hostSecret = sp.get("host") ?? "";
  const nameFromQuery = (sp.get("name") ?? "").trim();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [buzzes, setBuzzes] = useState<BuzzType[]>([]);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    const id = getOrCreatePlayerId();
    setPlayerId(id);
    let finalName = "";
    if (nameFromQuery) {
      finalName = nameFromQuery.slice(0, 24);
    } else {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("feud_player_name") : "";
      if (stored) {
        finalName = stored;
      } else {
        finalName = getOrCreatePlayerName();
        setShowNameModal(true);
      }
    }
    setPlayerName(finalName);
    if (typeof window !== "undefined") window.localStorage.setItem("feud_player_name", finalName);
  }, [nameFromQuery]);

  useEffect(() => {
    return subscribeRoom(roomId, setRoom);
  }, [roomId]);

  useEffect(() => {
    return subscribePlayers(roomId, setPlayers);
  }, [roomId]);

  useEffect(() => {
    return subscribeBuzzes(roomId, (buzzes) => {
      console.log("Buzzes updated:", buzzes);
      setBuzzes(buzzes);
    });
  }, [roomId]);

  useEffect(() => {
    if (!playerId || !playerName) return;
    ensurePlayer(roomId, playerId, playerName).catch(() => {});
    const id = setInterval(() => touchPlayer(roomId, playerId).catch(() => {}), 15000);
    return () => clearInterval(id);
  }, [roomId, playerId, playerName]);

  const isHost = useMemo(() => !!(room && hostSecret && room.hostSecret === hostSecret), [room, hostSecret]);

  const me = useMemo(() => players.find((p) => p.id === playerId) ?? null, [players, playerId]);
  const myTeamId = me?.teamId ?? null;

  if (room === null) {
    return (
      <div className="card">
        <div className="h2">Loading room…</div>
        <div className="small">If this never loads, the room code may be wrong or Firestore isn't set up.</div>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinLink = origin ? `${origin}/r/${roomId}` : `/r/${roomId}`;
  const hostLink = origin ? `${origin}/r/${roomId}?host=${room.hostSecret}` : `/r/${roomId}?host=…`;

  return (
    <>
      {showNameModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="card" style={{ width: 300 }}>
            <div className="h2">Customize your name (optional)</div>
            <div className="small">You've been assigned <span className="mono">{playerName}</span>. Change it below or keep it.</div>
            <div className="hr" />
            <input
              className="input"
              placeholder={playerName}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (tempName.trim()) {
                    savePlayerName(tempName.trim());
                    setPlayerName(tempName.trim());
                  }
                  setShowNameModal(false);
                }
              }}
              autoFocus
            />
            <div className="hr" />
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn"
                onClick={() => {
                  if (tempName.trim()) {
                    savePlayerName(tempName.trim());
                    setPlayerName(tempName.trim());
                  }
                  setShowNameModal(false);
                }}
              >
                Continue
              </button>
              <button
                className="btn btnSecondary"
                onClick={() => setShowNameModal(false)}
              >
                Keep {playerName}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="row" style={{ gap: 16 }}>
        <div className="row" style={{ width: "100%" }}>
          <div className="card" style={{ flex: 1, minWidth: 280 }}>
            <div className="h1">
              Room <span className="mono">{roomId}</span>
            </div>
            <div className="small">Status: {room.status}</div>
            <div className="small">You: {playerName}{myTeamId ? ` (Team ${myTeamId})` : ""}</div>
            <div className="small">Host mode: {isHost ? "YES" : "NO"}</div>
          </div>
          <TimerView room={room} />
        </div>

        <div className="row" style={{ width: "100%" }}>
          <CopyBox label="Invite link (players)" value={joinLink} />
          {isHost ? <CopyBox label="Host link (keep private)" value={hostLink} /> : null}
        </div>

        {room.status === "lobby" ? (
          <div className="row" style={{ width: "100%" }}>
            <Lobby
              teams={room.teams}
              players={players}
              myPlayerId={playerId}
              isHost={isHost}
              onJoinTeam={async (teamId: TeamId) => {
                await setPlayerTeam(roomId, playerId, teamId);
              }}
            />

            {isHost ? (
              <div className="card" style={{ flex: 1, minWidth: 280 }}>
                <div className="h2">Host: start when ready</div>
                <div className="small">Tip: ask each team to join and pick a team.</div>
                <div className="hr" />
                <button
                  className="btn"
                  onClick={async () => {
                    await patchRoomIfHost(roomId, hostSecret, { status: "live" });
                  }}
                >
                  Start Game
                </button>
              </div>
            ) : (
              <div className="card" style={{ flex: 1, minWidth: 280 }}>
                <div className="h2">Waiting for host…</div>
                <div className="small">Once the host starts, you'll see the buzzer + board.</div>
              </div>
            )}
          </div>
        ) : null}

        {room.status !== "lobby" ? (
          <>
            <Scoreboard
              room={room}
              isHost={isHost}
              roomId={roomId}
              hostSecret={hostSecret}
              delta={10}
            />
            {!isHost && <QuestionBoard room={room} />}
            {!isHost && (
              <Buzzer
                room={room}
                buzzes={buzzes}
                canBuzz={!!myTeamId && room.board.buzzerOpen}
                onBuzz={async () => {
                  try {
                    if (!myTeamId) {
                      console.error("Cannot buzz: No team assigned");
                      return;
                    }
                    console.log("Buzzing:", { roomId, playerId, playerName, teamId: myTeamId });
                    await buzz(roomId, { playerId, playerName, teamId: myTeamId });
                    console.log("Buzz successful");
                  } catch (error) {
                    console.error("Error buzzing:", error);
                    alert("Failed to buzz. Check console for details.");
                  }
                }}
              />
            )}

            {isHost ? <HostPanel roomId={roomId} room={room} hostSecret={hostSecret} buzzes={buzzes} /> : null}

            {!isHost ? (
              <div className="card" style={{ width: "100%" }}>
                <div className="h2">Viewer / Player mode</div>
                <div className="small">
                  You can buzz when the host opens the buzzer. Ask for the host link if you need controls.
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
