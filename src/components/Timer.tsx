"use client";

import { useEffect, useMemo, useState } from "react";
import { Room } from "@/lib/room";
import { computeRemaining } from "@/lib/timer";
import { formatMMSS } from "@/lib/util";

export function TimerView({ room }: { room: Room }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remaining = useMemo(() => computeRemaining(room, now), [room, now]);

  return (
    <div className="card" style={{ flex: 1, minWidth: 240 }}>
      <div className="small">Timer</div>
      <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: 1 }}>
        {formatMMSS(remaining)}
      </div>
      <div className="small">
        {room.timer.running ? "Running" : "Paused"} • Duration {formatMMSS(room.timer.durationSec)}
      </div>
    </div>
  );
}
