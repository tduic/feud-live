import { describe, it, expect, vi } from "vitest";

vi.mock("firebase/firestore", () => ({ serverTimestamp: () => "SERVER_TS", Timestamp: class {} }));

import { clamp, formatMMSS, randomCode, randomId, randomSecret } from "@/lib/util";
import { computeRemaining } from "@/lib/timer";
import type { Room } from "@/lib/room";

describe("util", () => {
  it("formats seconds as MM:SS, flooring and clamping negatives", () => {
    expect(formatMMSS(0)).toBe("00:00");
    expect(formatMMSS(59.9)).toBe("00:59");
    expect(formatMMSS(125)).toBe("02:05");
    expect(formatMMSS(-10)).toBe("00:00");
    expect(formatMMSS(3600)).toBe("60:00");
  });

  it("clamps", () => {
    expect(clamp(0, 1, 20)).toBe(1);
    expect(clamp(25, 1, 20)).toBe(20);
    expect(clamp(7, 1, 20)).toBe(7);
  });

  it("generates ids from the expected alphabets", () => {
    expect(randomCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    expect(randomSecret()).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(randomId()).toMatch(/^[A-Za-z0-9]{20}$/);
    expect(randomId(6)).toHaveLength(6);
  });
});

describe("computeRemaining", () => {
  const room = (timer: Partial<Room["timer"]>) =>
    ({ timer: { durationSec: 120, remainingSec: 120, running: false, startedAt: null, ...timer } }) as Room;
  const ts = (ms: number) => ({ toMillis: () => ms });

  it("returns the stored remaining time while paused", () => {
    expect(computeRemaining(room({ remainingSec: 45 }), 1_000_000)).toBe(45);
    expect(computeRemaining(room({ remainingSec: 500 }), 0)).toBe(120);
  });

  it("subtracts whole elapsed seconds while running", () => {
    const r = room({ running: true, remainingSec: 90, startedAt: ts(10_000) });
    expect(computeRemaining(r, 10_000)).toBe(90);
    expect(computeRemaining(r, 40_999)).toBe(60);
    expect(computeRemaining(r, 200_000)).toBe(0);
  });

  it("treats a running timer without a start stamp as paused", () => {
    expect(computeRemaining(room({ running: true, remainingSec: 30, startedAt: null }), 99_999)).toBe(30);
  });
});
