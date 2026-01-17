import { Timestamp, serverTimestamp } from "firebase/firestore";
import { Room } from "@/lib/room";
import { clamp } from "@/lib/util";

export function computeRemaining(room: Room, nowMs: number) {
  const t = room.timer;
  if (!t.running || !t.startedAt) return clamp(t.remainingSec, 0, t.durationSec);
  const started = (t.startedAt as Timestamp).toMillis();
  const elapsed = Math.floor((nowMs - started) / 1000);
  return clamp(t.remainingSec - elapsed, 0, t.durationSec);
}

export const serverNow = serverTimestamp;
