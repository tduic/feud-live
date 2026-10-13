import { describe, it, expect, vi, beforeEach } from "vitest";
import { firestoreModule, installFakeFirestore } from "./helpers/mock-firestore";

vi.mock("@/lib/firebase", () => ({ db: { fake: true } }));
vi.mock("firebase/firestore", () => firestoreModule());

import { createRoom, defaultBoard, defaultTeams, getRoom, patchRoom, patchRoomIfHost, subscribeRoom } from "@/lib/room";
import { ensurePlayer, setPlayerTeam, subscribePlayers, touchPlayer } from "@/lib/players";
import { buzz, clearBuzzes, subscribeBuzzes } from "@/lib/buzz";

let f: ReturnType<typeof installFakeFirestore>;
beforeEach(() => {
  f = installFakeFirestore();
});

describe("room defaults", () => {
  it("creates 2 to 4 zeroed teams", () => {
    expect(defaultTeams()).toEqual([
      { id: "A", name: "Team A", score: 0, strikes: 0 },
      { id: "B", name: "Team B", score: 0, strikes: 0 },
    ]);
    expect(defaultTeams(4).map((t) => t.id)).toEqual(["A", "B", "C", "D"]);
    expect(defaultTeams(9)).toHaveLength(4);
  });

  it("creates an empty eight-answer board", () => {
    const b = defaultBoard();
    expect(b.answers).toHaveLength(8);
    expect(new Set(b.answers.map((a) => a.id)).size).toBe(8);
    expect(b.answers.every((a) => a.text === "" && a.points === 0 && !a.revealed)).toBe(true);
    expect(b).toMatchObject({ question: "", controlTeamId: null, buzzerOpen: false });
  });
});

describe("room persistence", () => {
  it("creates a lobby room and reads it back", async () => {
    await createRoom("R1", "secret", 3);
    const room = await getRoom("R1");
    expect(room).toMatchObject({
      status: "lobby",
      hostSecret: "secret",
      round: 1,
      multiplier: 1,
      timer: { durationSec: 120, remainingSec: 120, running: false, startedAt: null },
    });
    expect(room!.teams).toHaveLength(3);
    expect(await getRoom("missing")).toBeNull();

    const cb = vi.fn();
    subscribeRoom("R1", cb);
    expect(cb.mock.calls[0][0].hostSecret).toBe("secret");
  });

  it("patches only for the host", async () => {
    await createRoom("R1", "secret");
    await patchRoomIfHost("R1", "secret", { round: 2, multiplier: 2 });
    expect(await getRoom("R1")).toMatchObject({ round: 2, multiplier: 2 });
    await expect(patchRoomIfHost("R1", "guess", { status: "ended" })).rejects.toThrow("Not host");
    await expect(patchRoomIfHost("nope", "secret", {})).rejects.toThrow("Room not found");
    await patchRoom("R1", { status: "live" });
    expect((await getRoom("R1"))!.status).toBe("live");
  });
});

describe("players", () => {
  it("registers, re-joins without losing a team, and switches teams", async () => {
    await ensurePlayer("R1", "p1", "Ann");
    await setPlayerTeam("R1", "p1", "B");
    await touchPlayer("R1", "p1");
    expect(f.get("rooms/R1/players/p1")).toMatchObject({ id: "p1", name: "Ann", teamId: "B" });

    const cb = vi.fn();
    subscribePlayers("R1", cb);
    expect(cb.mock.calls[0][0]).toEqual([expect.objectContaining({ id: "p1", teamId: "B" })]);
  });

  it("fails to touch a player that never joined", async () => {
    await expect(touchPlayer("R1", "ghost")).rejects.toThrow();
  });
});

describe("buzzer", () => {
  it("records buzzes with a server timestamp and clears them", async () => {
    await buzz("R1", { playerId: "p1", playerName: "Ann", teamId: "A" });
    await buzz("R1", { playerId: "p2", playerName: "Bob", teamId: "B" });
    const cb = vi.fn();
    subscribeBuzzes("R1", cb);
    expect(cb.mock.calls[0][0].map((b: any) => [b.playerName, b.ts])).toEqual([
      ["Ann", "SERVER_TS"],
      ["Bob", "SERVER_TS"],
    ]);

    await clearBuzzes("R1");
    subscribeBuzzes("R1", cb);
    expect(cb.mock.calls[1][0]).toEqual([]);
  });
});
