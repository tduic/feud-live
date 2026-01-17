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

export default function HomePage() {
  const r = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("");
  const [numTeams, setNumTeams] = useState(2);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    getOrCreatePlayerId();
    const savedName = getOrCreatePlayerName();
    setName(savedName);
    setShowNameModal(true);
  }, []);

  return (
    <div className="grid2">
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
            <div className="small">You've been assigned <span className="mono">{name}</span>. Change it below or keep it.</div>
            <div className="hr" />
            <input
              className="input"
              placeholder={name}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (tempName.trim()) {
                    savePlayerName(tempName.trim());
                    setName(tempName.trim());
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
                    setName(tempName.trim());
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
                Keep {name}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="h1">Feud Live</div>
        <div className="small">lobby • buzzer • question board • scoreboard • timer</div>

        <div className="hr" />

        <div className="small">Number of teams</div>
        <div className="row" style={{ gap: 8, marginBottom: 16 }}>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              className={numTeams === n ? "btn" : "btn btnSecondary"}
              onClick={() => setNumTeams(n)}
              style={{ flex: 1 }}
            >
              {n} Teams
            </button>
          ))}
        </div>

        <div className="hr" />

        <div className="small">Your name</div>
        <input className="input" placeholder="Tyler" value={name} onChange={(e) => {
          setName(e.target.value);
          savePlayerName(e.target.value);
        }} />

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
              await createRoom(roomId, hostSecret, numTeams);
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
