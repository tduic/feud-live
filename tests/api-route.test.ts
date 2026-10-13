import { describe, it, expect, vi, beforeEach } from "vitest";

const openai = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: openai.create } };
  },
}));

import { POST } from "@/app/api/generate-question/route";

const reply = (content: string | null) => ({ choices: [{ message: { content } }] });
const call = () => POST({} as any);

beforeEach(() => {
  openai.create.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/generate-question", () => {
  it("returns the parsed question", async () => {
    const q = { question: "Name a pet", answers: [{ text: "Dog", points: 60 }, { text: "Cat", points: 40 }] };
    openai.create.mockResolvedValue(reply(JSON.stringify(q)));
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(q);
    expect(openai.create.mock.calls[0][0]).toMatchObject({ model: "gpt-4", max_tokens: 500 });
  });

  it.each([
    ["an empty completion", reply(null), "No response from OpenAI"],
    ["a wrong shape", reply(JSON.stringify({ question: "x" })), "Invalid question format from OpenAI"],
    ["non-JSON text", reply("Here is a question!"), "Failed to generate question"],
  ])("returns 500 for %s", async (_label, value, error) => {
    openai.create.mockResolvedValue(value);
    const res = await call();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe(error);
  });

  it("returns 500 when the OpenAI call throws", async () => {
    openai.create.mockRejectedValue(new Error("rate limited"));
    const res = await call();
    expect(res.status).toBe(500);
  });
});
