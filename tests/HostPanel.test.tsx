// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({
  patch: vi.fn(),
  clearBuzzes: vi.fn(),
  generateQuestion: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({ serverTimestamp: () => "SERVER_TS" }));
vi.mock("@/lib/room", () => ({ patchRoomIfHost: m.patch }));
vi.mock("@/lib/buzz", () => ({ clearBuzzes: m.clearBuzzes }));
vi.mock("@/lib/questionGenerator", () => ({ generateQuestion: m.generateQuestion }));

import { HostPanel } from "@/components/HostPanel";
import type { Room } from "@/lib/room";

function makeRoom(over: Partial<Room> = {}, boardOver: Partial<Room["board"]> = {}): Room {
  return {
    createdAt: null,
    status: "live",
    hostSecret: "s",
    round: 1,
    multiplier: 1,
    teams: [
      { id: "A", name: "Team A", score: 10, strikes: 2 },
      { id: "B", name: "Team B", score: 5, strikes: 1 },
    ],
    timer: { durationSec: 120, remainingSec: 120, running: false, startedAt: null },
    board: {
      question: "Name a pet",
      answers: [
        { id: "1", text: "Dog", points: 40, revealed: true },
        { id: "2", text: "Cat", points: 30, revealed: false },
        { id: "3", text: "Fish", points: 12, revealed: true },
      ],
      controlTeamId: "B",
      buzzerOpen: false,
      ...boardOver,
    },
    ...over,
  };
}

const renderPanel = (room: Room) =>
  render(<HostPanel roomId="R1" room={room} hostSecret="s" buzzes={[]} />);
const lastPatch = () => m.patch.mock.calls.at(-1)![2];

beforeEach(() => {
  m.patch.mockReset().mockResolvedValue(undefined);
  m.clearBuzzes.mockReset().mockResolvedValue(undefined);
  m.generateQuestion.mockReset();
});

afterEach(cleanup);

describe("HostPanel scoring", () => {
  it("awards the sum of revealed answers to the control team", async () => {
    renderPanel(makeRoom());
    fireEvent.click(screen.getByText("Award All Revealed"));
    await waitFor(() => expect(m.patch).toHaveBeenCalled());
    expect(m.patch.mock.calls[0].slice(0, 2)).toEqual(["R1", "s"]);
    expect(lastPatch().teams.map((t: any) => [t.id, t.score])).toEqual([["A", 10], ["B", 57]]);
  });

  it("doubles the award on a 2x round", async () => {
    renderPanel(makeRoom({ multiplier: 2 }));
    fireEvent.click(screen.getByText("Award All Revealed"));
    await waitFor(() => expect(m.patch).toHaveBeenCalled());
    expect(lastPatch().teams.find((t: any) => t.id === "B").score).toBe(5 + 2 * 52);
  });

  it("disables the award with no control team or nothing revealed", () => {
    const { unmount } = renderPanel(makeRoom({}, { controlTeamId: null }));
    expect((screen.getByText("Award All Revealed") as HTMLButtonElement).disabled).toBe(true);
    unmount();
    const none = makeRoom();
    none.board.answers = none.board.answers.map((a) => ({ ...a, revealed: false }));
    renderPanel(none);
    expect((screen.getByText("Award All Revealed") as HTMLButtonElement).disabled).toBe(true);
  });

  it("resets scores and clears strikes for every team", async () => {
    renderPanel(makeRoom());
    fireEvent.click(screen.getByText("Reset Scores"));
    await waitFor(() => expect(m.patch).toHaveBeenCalledTimes(1));
    expect(lastPatch().teams.map((t: any) => t.score)).toEqual([0, 0]);
    fireEvent.click(screen.getByText("Clear Strikes"));
    await waitFor(() => expect(m.patch).toHaveBeenCalledTimes(2));
    expect(lastPatch().teams.map((t: any) => t.strikes)).toEqual([0, 0]);
  });
});

describe("HostPanel board controls", () => {
  it("toggles an answer's reveal state", async () => {
    renderPanel(makeRoom());
    fireEvent.click(screen.getAllByText("Hidden")[0]);
    await waitFor(() => expect(m.patch).toHaveBeenCalled());
    expect(lastPatch().board.answers.find((a: any) => a.id === "2").revealed).toBe(true);
  });

  it("resets the board and clears buzzes", async () => {
    renderPanel(makeRoom());
    fireEvent.click(screen.getByText("Reset Board"));
    await waitFor(() => expect(m.clearBuzzes).toHaveBeenCalledWith("R1"));
    const board = lastPatch().board;
    expect(board).toMatchObject({ question: "", controlTeamId: null });
    expect(board.answers.every((a: any) => a.text === "" && a.points === 0 && !a.revealed)).toBe(true);
  });

  it("loads a generated question padded to eight hidden slots", async () => {
    m.generateQuestion.mockResolvedValue({
      question: "Name a color",
      answers: [{ text: "Red", points: 50 }, { text: "Blue", points: 30 }],
    });
    renderPanel(makeRoom());
    fireEvent.click(screen.getByText(/Generate AI Question/));
    await waitFor(() => expect(m.patch).toHaveBeenCalled());
    const board = lastPatch().board;
    expect(board.question).toBe("Name a color");
    expect(board.answers).toHaveLength(8);
    expect(board.answers.slice(0, 2).map((a: any) => [a.text, a.points])).toEqual([["Red", 50], ["Blue", 30]]);
    expect(board.answers.every((a: any) => !a.revealed)).toBe(true);
    await waitFor(() => expect(screen.getByText(/Generate AI Question/)).toBeTruthy());
  });

  it("opens the buzzer and clears previous buzzes", async () => {
    renderPanel(makeRoom());
    fireEvent.click(screen.getByText("Open + Clear"));
    await waitFor(() => expect(m.clearBuzzes).toHaveBeenCalled());
    expect(lastPatch().board.buzzerOpen).toBe(true);
  });
});

describe("HostPanel round and timer", () => {
  it("keeps the round within 1..20", async () => {
    renderPanel(makeRoom({ round: 1 }));
    fireEvent.click(screen.getByText("-"));
    await waitFor(() => expect(m.patch).toHaveBeenCalled());
    expect(lastPatch()).toEqual({ round: 1 });
    cleanup();
    renderPanel(makeRoom({ round: 20 }));
    fireEvent.click(screen.getByText("+"));
    await waitFor(() => expect(m.patch).toHaveBeenCalledTimes(2));
    expect(lastPatch()).toEqual({ round: 20 });
  });

  it("starts the timer with a server timestamp", async () => {
    renderPanel(makeRoom());
    fireEvent.click(screen.getByText("Start"));
    await waitFor(() => expect(m.patch).toHaveBeenCalled());
    expect(lastPatch().timer).toMatchObject({ running: true, startedAt: "SERVER_TS" });
  });

  it("pauses by banking the elapsed time", async () => {
    vi.spyOn(Date, "now").mockReturnValue(100_000);
    renderPanel(
      makeRoom({
        timer: { durationSec: 120, remainingSec: 120, running: true, startedAt: { toMillis: () => 70_000 } },
      }),
    );
    fireEvent.click(screen.getByText("Pause"));
    await waitFor(() => expect(m.patch).toHaveBeenCalled());
    expect(lastPatch().timer).toEqual({ durationSec: 120, remainingSec: 90, running: false, startedAt: null });
    vi.restoreAllMocks();
  });

  it("clamps a new duration to 10s..30min", async () => {
    renderPanel(makeRoom());
    const input = screen.getByDisplayValue("120");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByText("Set"));
    await waitFor(() => expect(m.patch).toHaveBeenCalled());
    expect(lastPatch().timer).toEqual({ durationSec: 10, remainingSec: 10, running: false, startedAt: null });
  });
});
