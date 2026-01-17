import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

export type TeamId = "A" | "B" | "C" | "D";
export type Team = { id: TeamId; name: string; score: number; strikes: number };
export type Answer = { id: string; text: string; points: number; revealed: boolean };
export type QuestionBoard = {
  question: string;
  answers: Answer[];
  controlTeamId: TeamId | null;
  buzzerOpen: boolean;
};

export type Room = {
  createdAt: any;
  status: "lobby" | "live" | "ended";
  hostSecret: string;

  round: number;
  multiplier: 1 | 2;

  teams: Team[];

  timer: {
    durationSec: number;
    remainingSec: number;
    running: boolean;
    startedAt: any | null;
  };

  board: QuestionBoard;
};

export function defaultTeams(count: number = 2): Team[] {
  const allTeams: Team[] = [
    { id: "A", name: "Team A", score: 0, strikes: 0 },
    { id: "B", name: "Team B", score: 0, strikes: 0 },
    { id: "C", name: "Team C", score: 0, strikes: 0 },
    { id: "D", name: "Team D", score: 0, strikes: 0 }
  ];
  return allTeams.slice(0, count);
}

export function defaultBoard(): QuestionBoard {
  return {
    question: "",
    answers: [
      { id: "1", text: "", points: 0, revealed: false },
      { id: "2", text: "", points: 0, revealed: false },
      { id: "3", text: "", points: 0, revealed: false },
      { id: "4", text: "", points: 0, revealed: false },
      { id: "5", text: "", points: 0, revealed: false },
      { id: "6", text: "", points: 0, revealed: false },
      { id: "7", text: "", points: 0, revealed: false },
      { id: "8", text: "", points: 0, revealed: false }
    ],
    controlTeamId: null,
    buzzerOpen: false
  };
}

export async function createRoom(roomId: string, hostSecret: string, numTeams: number = 2): Promise<void> {
  const room: Room = {
    createdAt: serverTimestamp(),
    status: "lobby",
    hostSecret,
    round: 1,
    multiplier: 1,
    teams: defaultTeams(numTeams),
    timer: { durationSec: 120, remainingSec: 120, running: false, startedAt: null },
    board: defaultBoard()
  };
  await setDoc(doc(db, "rooms", roomId), room);
}

export function subscribeRoom(roomId: string, cb: (room: Room | null) => void) {
  return onSnapshot(doc(db, "rooms", roomId), (snap) => {
    cb((snap.data() as Room) ?? null);
  });
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, "rooms", roomId));
  return (snap.data() as Room) ?? null;
}

export async function patchRoom(roomId: string, patch: Partial<Room>) {
  await updateDoc(doc(db, "rooms", roomId), patch as any);
}

export async function patchRoomIfHost(roomId: string, hostSecret: string, patch: Partial<Room>) {
  const ref = doc(db, "rooms", roomId);
  const snap = await getDoc(ref);
  const room = snap.data() as Room | undefined;
  if (!room) throw new Error("Room not found");
  if (room.hostSecret !== hostSecret) throw new Error("Not host");
  await updateDoc(ref, patch as any);
}
