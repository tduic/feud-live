"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom } from "@/lib/room";
import { randomCode, randomSecret, randomId } from "@/lib/util";

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

export default function HomePage() {
  const r = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { getOrCreatePlayerId(); }, []);

  return (
    <div className="grid2">
      <div className="card">
        <div className="h1">Feud Live</div>
        <div className="small">4 teams • lobby • buzzer • question board • scoreboard • timer</div>

        <div className="hr" />

        <div className="small">Your name (shown in lobby + buzzer)</div>
        <input className="input" placeholder="Tyler" value={name} onChange={(e) => setName(e.target.value)} />

        <div className="hr" />

        <button
          className="btn"
          disabled={!name.trim() || isCreating}
          onClick={async () => {
            try {
              setError("");
              setIsCreating(true);
              const roomId = randomCode(6);
              const hostSecret = randomSecret(32);
              await createRoom(roomId, hostSecret);
              r.push(`/r/${roomId}?host=${hostSecret}&name=${encodeURIComponent(name.trim())}`);
            } catch (err) {
              const message = err instanceof Error ? err.message : "Failed to create room";
              setError(message);
              setIsCreating(false);
            }
          }}
        >
          {isCreating ? "Creating..." : "Create New Game (Host)"}
        </button>
        {error && <div className="small" style={{ color: "red", marginTop: 8 }}>Error: {error}</div>}

        <div className="hr" />

        <div className="small">Join an existing game</div>
        <input
          className="input"
          placeholder="Room code (e.g., ABC123)"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase().trim())}
        />
        <div className="row" style={{ marginTop: 10 }}>
          <button
            className="btn btnSecondary"
            disabled={!name.trim() || joinCode.length < 4}
            onClick={() => r.push(`/r/${joinCode}?name=${encodeURIComponent(name.trim())}`)}
          >
            Join
          </button>
        </div>

        <div className="hr" />
        <div className="small">
          Tip: The host should share the invite link shown in the room page.
        </div>
      </div>

      <div className="card">
        <div className="h2">How it works</div>
        <ul className="small">
          <li>Players join, pick teams in the lobby.</li>
          <li>Host starts the game, opens buzzer for face-offs.</li>
          <li>Host types question + answers, reveals them, and awards points.</li>
          <li>Everyone sees the same live scoreboard + timer.</li>
        </ul>
      </div>
    </div>
  );
}
