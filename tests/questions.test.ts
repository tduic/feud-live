import { describe, it, expect, vi, afterEach } from "vitest";
import {
  familyFeudQuestions,
  generateAIQuestion,
  generateQuestion,
  generateRandomQuestion,
} from "@/lib/questionGenerator";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("built-in question bank", () => {
  it("has well-formed boards that fit the 8-slot host board", () => {
    expect(familyFeudQuestions.length).toBeGreaterThan(100);
    for (const q of familyFeudQuestions) {
      expect(q.question.trim(), q.question).not.toBe("");
      expect(q.answers.length, q.question).toBeGreaterThanOrEqual(3);
      expect(q.answers.length, q.question).toBeLessThanOrEqual(8);
      for (const a of q.answers) {
        expect(a.text.trim(), q.question).not.toBe("");
        expect(a.points, q.question).toBeGreaterThan(0);
      }
      const total = q.answers.reduce((s, a) => s + a.points, 0);
      expect(total, q.question).toBeLessThanOrEqual(100);
    }
  });

  it("lists answers from most to least popular", () => {
    for (const q of familyFeudQuestions) {
      const pts = q.answers.map((a) => a.points);
      expect(pts, q.question).toEqual([...pts].sort((a, b) => b - a));
    }
  });

  it("has no duplicate questions", () => {
    const qs = familyFeudQuestions.map((q) => q.question.toLowerCase());
    expect(new Set(qs).size).toBe(qs.length);
  });
});

describe("question selection", () => {
  it("picks from the bank by Math.random", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(generateRandomQuestion()).toBe(familyFeudQuestions[0]);
    vi.spyOn(Math, "random").mockReturnValue(0.9999);
    expect(generateRandomQuestion()).toBe(familyFeudQuestions[familyFeudQuestions.length - 1]);
  });

  it("returns the API question when it is valid", async () => {
    const q = { question: "Name a fruit", answers: [{ text: "Apple", points: 60 }] };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(q), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await generateAIQuestion()).toEqual(q);
    expect(fetchMock).toHaveBeenCalledWith("/api/generate-question", expect.objectContaining({ method: "POST" }));
  });

  it.each([
    ["an HTTP error", () => new Response("{}", { status: 500 })],
    ["a malformed body", () => new Response(JSON.stringify({ question: "x" }), { status: 200 })],
  ])("falls back to the bank on %s", async (_label, make) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(make()));
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(await generateAIQuestion()).toBe(familyFeudQuestions[0]);
  });

  it("uses AI 70% of the time and the bank otherwise", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ question: "AI", answers: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(Math, "random").mockReturnValue(0.69);
    expect((await generateQuestion()).question).toBe("AI");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.spyOn(Math, "random").mockReturnValue(0.7);
    expect(familyFeudQuestions).toContain(await generateQuestion());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
