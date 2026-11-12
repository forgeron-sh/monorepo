import { describe, expect, it } from "vitest";
import { viewsProblem } from "./check";

describe("viewsProblem", () => {
  it("accepts none, or a map of view files", () => {
    expect(viewsProblem(undefined)).toBeUndefined();
    expect(viewsProblem({})).toBeUndefined();
    expect(viewsProblem({ "views/a.js": "x", "views/chunks/b-1.js": "y" })).toEqual({
      "views/a.js": "x",
      "views/chunks/b-1.js": "y",
    });
  });

  it("refuses what is not a view file, not text, or too big", () => {
    for (const bad of [
      { "worker.js": "x" },
      { "views/../a.js": "x" },
      { "views/a.html": "x" },
      { "views/a.js": 5 },
      [],
    ]) {
      expect(typeof viewsProblem(bad)).toBe("string");
    }
    expect(typeof viewsProblem({ "views/a.js": "x".repeat(2 * 1024 * 1024 + 1) })).toBe("string");
    expect(
      typeof viewsProblem(
        Object.fromEntries(Array.from({ length: 51 }, (_, i) => [`views/${i}.js`, "x"])),
      ),
    ).toBe("string");
  });
});
