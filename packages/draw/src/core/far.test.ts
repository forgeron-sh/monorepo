import { describe, expect, it } from "vitest";
import { farPrimitives } from "./far";
import type { DrawData, DrawItem } from "./types";

const at = (kind: string, data: DrawData, b = { x: 10, y: 20, w: 100, h: 50 }): DrawItem => ({
  id: `${kind}-1`,
  kind,
  bounds: b,
  z: 0,
  data,
});

describe("the far view of a board", () => {
  it("draws shapes as boxes: a pattern as a wash of its colour, a diamond as its fill", () => {
    const stroke = { color: "ink", width: 2, dash: "solid" as const };
    expect(
      farPrimitives(
        at("rectangle", {
          type: "shape",
          fill: { type: "pattern", pattern: "dots-50", color: "accent" },
          stroke,
        }),
      ),
    ).toEqual([
      {
        type: "rect",
        x: 10,
        y: 20,
        w: 100,
        h: 50,
        fill: "color-mix(in srgb, var(--accent) 40%, transparent)",
        stroke: "var(--ink)",
        strokeWidth: 2,
      },
    ]);
    expect(
      farPrimitives(at("ellipse", { type: "shape", fill: { type: "none" }, stroke }))[0],
    ).toMatchObject({
      type: "ellipse",
      stroke: "var(--ink)",
    });
    expect(farPrimitives(at("diamond", { type: "shape", fill: { type: "none" }, stroke }))).toEqual(
      [
        {
          type: "diamond",
          x: 10,
          y: 20,
          w: 100,
          h: 50,
          fill: "color-mix(in srgb, var(--ink) 35%, transparent)",
        },
      ],
    );
  });

  it("draws a pen stroke as its line, an arrow with its head, a frame with its name, clips to a frame", () => {
    const frame = { x: 0, y: 0, w: 60, h: 60 };
    const pen = farPrimitives(
      at(
        "pen",
        {
          type: "pen",
          points: [0, 0, 9, 4],
          cols: 10,
          rows: 5,
          color: "accent",
          weight: 1,
          frame: "f",
        },
        { x: 0, y: 0, w: 20, h: 10 },
      ),
      frame,
    );
    expect(pen).toEqual([
      { type: "line", points: [1, 1, 19, 9], color: "var(--accent)", width: 1, clip: frame },
    ]);
    const arrow = farPrimitives(
      at("arrow", {
        type: "arrow",
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        head: "end",
        route: "straight",
        stroke: { color: null, width: 2, dash: "dashed" },
      }),
    );
    expect(arrow.map((p) => p.type)).toEqual(["line", "triangle"]);
    expect(arrow[0]).toMatchObject({ points: [10, 20, 110, 20], width: 2, color: "var(--ink)" });
    const named = farPrimitives(at("frame", { type: "frame", name: "Sketch" }));
    expect(named.map((p) => p.type)).toEqual(["rect", "rect", "text"]);
    expect(named[2]).toMatchObject({ text: "Sketch", font: "mono", size: 11 });
    expect(
      farPrimitives(at("text", { type: "text", text: "", size: 20, color: "ink", align: "left" })),
    ).toEqual([]);
  });
});
