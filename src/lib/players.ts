import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { TeamId } from "@/lib/room";

export type Player = {
  id: string;
  name: string;
  teamId: TeamId | null;
  joinedAt: any;
  lastSeenAt: any;
};

export function subscribePlayers(roomId: string, cb: (players: Player[]) => void) {
  return onSnapshot(collection(db, "rooms", roomId, "players"), (snap) => {
    cb(snap.docs.map((d) => d.data() as Player));
  });
}

export async function ensurePlayer(roomId: string, playerId: string, name: string) {
  const ref = doc(db, "rooms", roomId, "players", playerId);
  await setDoc(
    ref,
    {
      id: playerId,
      name,
      teamId: null,
      joinedAt: serverTimestamp(),
      lastSeenAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function touchPlayer(roomId: string, playerId: string) {
  const ref = doc(db, "rooms", roomId, "players", playerId);
  await updateDoc(ref, { lastSeenAt: serverTimestamp() } as any);
}

export async function setPlayerTeam(roomId: string, playerId: string, teamId: TeamId) {
  const ref = doc(db, "rooms", roomId, "players", playerId);
  await updateDoc(ref, { teamId, lastSeenAt: serverTimestamp() } as any);
}
