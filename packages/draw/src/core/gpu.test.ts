import { describe, expect, it } from "vitest";
import type { FarLine, FarRuns, FarShape } from "@forgeron/canvas";
import {
  arrowItem,
  frameItem,
  imageItem,
  registryOf,
  shapeItem,
  stickyItem,
  strokePath,
  textItem,
} from "../index";
import { penRuns } from "../plugins/pen";
import { gpuPrimitives } from "./far";
import { overlayClip, patternBits } from "./gpu";
import type { DrawItem, PenData } from "./types";

const at = (n: { kind: string; bounds: DrawItem["bounds"]; data: DrawItem["data"] }, z = 0) =>
  ({ id: "x", z, ...n }) as DrawItem;

describe("the GPU drawing of the kinds", () => {
  it("reads a pattern's map as bits, row by row", () => {
    expect(patternBits("dots-25")).toBe((1 << 0) | (1 << 10));
    expect(patternBits("lines-h")).toBe(0x0f0f);
    expect(patternBits("unknown")).toBe(0);
  });

  it("draws a shape with its fill, pattern, opacity, stroke and dash, crisp when a box", () => {
    const frame = { x: 0, y: 0, w: 50, h: 50 };
    const [rect] = gpuPrimitives(
      at(
        shapeItem(
          "rectangle",
          { x: 0, y: 0, w: 100, h: 60 },
          {
            fill: { type: "pattern", pattern: "hatch", color: "muted", opacity: 0.5 },
            stroke: { color: "accent", width: 2, dash: "dashed" },
          },
        ),
      ),
      frame,
    ) as FarShape[];
    expect(rect).toMatchObject({
      type: "rect",
      fill: "var(--ink-muted)",
      opacity: 0.5,
      pattern: patternBits("hatch"),
      patternPixel: 2,
      stroke: "var(--accent)",
      strokeWidth: 2,
      dash: [8, 6],
      crisp: true,
      clip: frame,
    });
    const [ellipse] = gpuPrimitives(
      at(shapeItem("ellipse", { x: 0, y: 0, w: 10, h: 10 }, { fill: { type: "none" } })),
    ) as FarShape[];
    expect(ellipse).toMatchObject({ type: "ellipse", crisp: false });
    expect(ellipse!.fill).toBeUndefined();
  });

  it("draws an arrow butt-ended with its dash and its heads", () => {
    const a = at(
      arrowItem({ x: 0, y: 0 }, { x: 100, y: 40 }, () => undefined, {
        route: "elbow",
        head: "both",
        stroke: { color: "ink", width: 2, dash: "dashed" },
      }),
    );
    const prims = gpuPrimitives(a);
    expect(prims.map((p) => p.type)).toEqual(["line", "triangle", "triangle"]);
    expect(prims[0]).toMatchObject({ cap: "butt", width: 2, dash: [8, 6] });
    expect((prims[0] as FarLine).points).toHaveLength(8);
  });

  it("draws a pen stroke as the runs its SVG path draws", () => {
    const data: PenData = {
      type: "pen",
      points: [0, 0, 6, 2, 9, 9],
      cols: 11,
      rows: 11,
      color: "ink",
      weight: 2,
    };
    const runs = penRuns(data);
    const fromPath = [...strokePath(data).matchAll(/M(-?\d+) (-?\d+)h(\d+)/g)].flatMap((m) =>
      m.slice(1, 4).map(Number),
    );
    expect(runs).toEqual(fromPath);
    expect(penRuns(data)).toBe(runs);
    const [prim] = gpuPrimitives(at({ kind: "pen", bounds: { x: 8, y: 4, w: 44, h: 22 }, data }));
    expect(prim).toMatchObject({
      type: "runs",
      x: 8,
      y: 4,
      sx: 4,
      sy: 2,
    } satisfies Partial<FarRuns>);
  });

  it("leaves words to the DOM above the far zoom, and draws images and stickies", () => {
    expect(gpuPrimitives(at(textItem({ x: 0, y: 0 }, "Hello", 20)))).toEqual([
      expect.objectContaining({ maxZoom: 0.35 }),
    ]);
    const frame = gpuPrimitives(at(frameItem({ x: 0, y: 0, w: 200, h: 100 }, "Plan")));
    expect(frame.at(-1)).toMatchObject({ type: "text", text: "Plan", maxZoom: 0.35 });
    expect(gpuPrimitives(at(imageItem({ x: 0, y: 0, w: 4, h: 3 }, "data:,", "a")))).toEqual([
      expect.objectContaining({ type: "image", src: "data:," }),
    ]);
    expect(gpuPrimitives(at(stickyItem({ x: 0, y: 0 }, "a")))).toHaveLength(2);
  });

  it("knows which boxes hide what is under them", () => {
    const r = registryOf();
    const opaque = (i: DrawItem) => r.kind(i.kind)?.opaque?.(i) ?? false;
    expect(opaque(at(stickyItem({ x: 0, y: 0 }, "a")))).toBe(true);
    expect(opaque(at(shapeItem("rectangle", { x: 0, y: 0, w: 1, h: 1 })))).toBe(false);
    expect(
      opaque(
        at(
          shapeItem(
            "rectangle",
            { x: 0, y: 0, w: 1, h: 1 },
            { fill: { type: "solid", color: "raised" } },
          ),
        ),
      ),
    ).toBe(true);
    expect(opaque(at(shapeItem("ellipse", { x: 0, y: 0, w: 1, h: 1 })))).toBe(false);
  });

  it("cuts an item's words where opaque boxes lie above it, each overlap once", () => {
    const box = { x: 100, y: 100, w: 100, h: 100 };
    expect(overlayClip(box, undefined, [])).toBeUndefined();
    expect(
      overlayClip(box, undefined, [
        { x: 150, y: 150, w: 100, h: 100 },
        { x: 170, y: 120, w: 100, h: 60 },
      ]),
    ).toBe(
      'path(evenodd, "M0 0H100V100H0Z' +
        "M70 20H100V50H70Z" +
        "M50 50H100V80H50Z" +
        'M50 80H100V100H50Z")',
    );
    expect(overlayClip(box, { x: 0, y: 0, w: 150, h: 1000 }, [])).toBe(
      'path(evenodd, "M0 0H50V100H0Z")',
    );
  });
});
