import { library } from "@forgeron/libraries/blueprints";
import { describe, expect, it } from "vitest";
import { assertDrawn, libraryParts } from "./parts";

describe("the Part library", () => {
  it("draws every part and assembly of the library as a non-empty SVG", async () => {
    const entries = await libraryParts();
    expect(new Set(entries.map((e) => e.file)).size).toBe(library.length);
    expect(entries.filter((e) => e.kind === "assembly").length).toBeGreaterThan(0);
    // The only part without prims: stack6 is drawn by the site's script layer.
    expect(entries.filter((e) => e.size === 0).map((e) => e.id)).toEqual(["stack6.bp/static"]);
    const blank = entries
      .filter((e) => e.size > 0)
      .filter(
        (e) =>
          e.drawn === 0 ||
          !/^<svg [^>]*viewBox="0 0 180 120"/.test(e.svg) ||
          !e.svg.includes('<path fill="var(--'),
      )
      .map((e) => e.id);
    expect(blank).toEqual([]);
    expect(() => assertDrawn(entries)).not.toThrow();
  }, 60_000);

  it("refuses a library entry that draws nothing", () => {
    const blank = {
      id: "x.bp/empty",
      kind: "part" as const,
      name: "empty",
      title: undefined,
      file: "x.bp",
      fileId: "x",
      counts: { box: 1 },
      size: 1,
      params: [],
      sockets: [],
      svg: "",
      drawn: 0,
      from: undefined,
    };
    expect(() => assertDrawn([blank])).toThrow(/x\.bp\/empty/);
  });
});
