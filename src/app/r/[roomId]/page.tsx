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

  useEffect(() => {
    const id = getOrCreatePlayerId();
    setPlayerId(id);
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("feud_player_name") : "";
    const finalName = (nameFromQuery || stored || "Player").slice(0, 24);
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
    return subscribeBuzzes(roomId, setBuzzes);
  }, [roomId]);

  useEffect(() => {
    if (!playerId || !playerName) return;
    ensurePlayer(roomId, playerId, playerName).catch(() => {});
    const id = setInterval(() => touchPlayer(roomId, playerId).catch(() => {}), 15000);
    return () => clearInterval(id);
  }, [roomId, playerId, playerName]);

  const isHost = useMemo(() => !!room && hostSecret && room.hostSecret === hostSecret, [room, hostSecret]);

  const me = useMemo(() => players.find((p) => p.id === playerId) ?? null, [players, playerId]);
  const myTeamId = me?.teamId ?? null;

  if (room === null) {
    return (
      <div className="card">
        <div className="h2">Loading room…</div>
        <div className="small">If this never loads, the room code may be wrong or Firestore isn’t set up.</div>
      </div>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const joinLink = origin ? `${origin}/r/${roomId}` : `/r/${roomId}`;
  const hostLink = origin ? `${origin}/r/${roomId}?host=${room.hostSecret}` : `/r/${roomId}?host=…`;

  return (
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
              <div className="small">Once the host starts, you’ll see the buzzer + board.</div>
            </div>
          )}
        </div>
      ) : null}

      {room.status !== "lobby" ? (
        <>
          <Scoreboard room={room} />
          <QuestionBoard room={room} />
          <Buzzer
            room={room}
            buzzes={buzzes}
            canBuzz={!!myTeamId && room.board.buzzerOpen}
            onBuzz={async () => {
              if (!myTeamId) return;
              await buzz(roomId, { playerId, playerName, teamId: myTeamId });
            }}
          />

          {isHost ? <HostPanel roomId={roomId} room={room} hostSecret={hostSecret} /> : null}

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
  );
}
