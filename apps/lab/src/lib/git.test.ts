import { describe, expect, it } from "vitest";
import { parseSubject } from "./git";

describe("parseSubject", () => {
  it("reads type, scope and subject", () => {
    expect(parseSubject("perf(draw): draw words on the GPU")).toEqual({
      type: "perf",
      scope: "draw",
      subject: "draw words on the GPU",
    });
  });

  it("reads a commit without scope, and a breaking one", () => {
    expect(parseSubject("feat: add the lab")).toEqual({ type: "feat", subject: "add the lab" });
    expect(parseSubject("refactor(ui)!: rename tokens")).toEqual({
      type: "refactor",
      scope: "ui",
      subject: "rename tokens",
    });
  });

  it("keeps a free-form line", () => {
    expect(parseSubject("Merge branch main")).toEqual({ type: "", subject: "Merge branch main" });
  });
});
