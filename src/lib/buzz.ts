import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import { TeamId } from "@/lib/room";

export type Buzz = {
  id?: string;
  playerId: string;
  playerName: string;
  teamId: TeamId | null;
  ts: any;
};

export function subscribeBuzzes(roomId: string, cb: (buzzes: Buzz[]) => void) {
  const q = query(collection(db, "rooms", roomId, "buzzes"), orderBy("ts", "asc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Buzz) })));
  });
}

export async function buzz(roomId: string, buzz: Omit<Buzz, "id" | "ts">) {
  await addDoc(collection(db, "rooms", roomId, "buzzes"), {
    ...buzz,
    ts: serverTimestamp()
  });
}

export async function clearBuzzes(roomId: string) {
  const snap = await getDocs(collection(db, "rooms", roomId, "buzzes"));
  await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "rooms", roomId, "buzzes", d.id))));
}
