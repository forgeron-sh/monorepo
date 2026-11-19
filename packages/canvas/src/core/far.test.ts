import { describe, expect, it } from "vitest";
import { createFarPack, FAR_KIND, FAR_STRIDE, packFar, parseCssColor, resetFarPack } from "./far";

const resolve = (c: string) => (c === "--none" ? 0 : c === "--half" ? 0x80ff0000 : 0xff00ff00);

describe("the far pack", () => {
  it("packs shapes, one instance per segment, triangles, and a bar for each text", () => {
    const pack = packFar(
      createFarPack(1),
      [
        { type: "rect", x: 1, y: 2, w: 3, h: 4, fill: "--a", stroke: "--b", strokeWidth: 2 },
        { type: "ellipse", x: 0, y: 0, w: 10, h: 10, fill: "--a" },
        { type: "line", points: [0, 0, 10, 0, 10, 10], color: "--a", width: 1, unit: "screen" },
        { type: "line", points: [0, 0, 10, 0, 10, 10], color: "--a", width: 1, closed: true },
        { type: "triangle", points: [0, 0, 1, 0, 0, 1], fill: "--a" },
        { type: "text", x: 5, y: 6, text: "Hello", size: 10, color: "--a", maxWidth: 20 },
        { type: "rect", x: 0, y: 0, w: 1, h: 1, fill: "--none" },
      ],
      { resolve, measure: (t) => t.text.length * 5 },
    );
    // rect, ellipse, 2 + 3 segments, triangle, the text's bar; the transparent rect is dropped.
    expect(pack.count).toBe(9);
    const kind = (i: number) => pack.data[i * FAR_STRIDE + 7];
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map(kind)).toEqual([
      FAR_KIND.rect,
      FAR_KIND.ellipse,
      FAR_KIND.segment,
      FAR_KIND.segment,
      FAR_KIND.segment,
      FAR_KIND.segment,
      FAR_KIND.segment,
      FAR_KIND.triangle,
      FAR_KIND.rect,
    ]);
    const d = pack.data;
    expect([...d.subarray(0, 6)]).toEqual([1, 2, 3, 4, 2, 0]);
    // The screen-unit line says so; the closed one comes back to its start.
    expect(d[2 * FAR_STRIDE + 5]).toBe(1);
    expect([...d.subarray(6 * FAR_STRIDE, 6 * FAR_STRIDE + 4)]).toEqual([10, 10, 0, 0]);
    expect(pack.texts.map((t) => t.text)).toEqual(["Hello"]);
  });

  it("draws a text's bar only below the size where the text is drawn, cut to its width", () => {
    const pack = packFar(
      createFarPack(),
      [{ type: "text", x: 0, y: 10, text: "Hello world", size: 10, color: "--a", maxWidth: 30 }],
      { resolve, measure: (t) => t.text.length * 5 },
    );
    expect(pack.count).toBe(1);
    const d = pack.data;
    // Width min(55, 30), half the size high, centred on the line, shown under 6 / 10 zoom.
    expect([...d.subarray(0, 4)]).toEqual([0, 7.5, 30, 5]);
    expect(d[8]).toBe(0);
    expect(d[9]).toBeCloseTo(0.6);
    // A third of the colour's alpha.
    expect(pack.colors[10]! >>> 24).toBe(Math.round(255 * 0.35));
  });

  it("grows and empties without losing what it holds", () => {
    const pack = createFarPack(1);
    const many = Array.from({ length: 100 }, (_, i) => ({
      type: "rect" as const,
      x: i,
      y: 0,
      w: 1,
      h: 1,
      fill: "--a",
    }));
    packFar(pack, many, { resolve });
    expect(pack.count).toBe(100);
    expect(pack.data[99 * FAR_STRIDE]).toBe(99);
    resetFarPack(pack);
    expect(pack.count).toBe(0);
    expect(pack.texts).toEqual([]);
  });

  it("reads the colours a browser computes", () => {
    expect(parseCssColor("rgb(255, 0, 128)")).toBe(
      (255 | (0 << 8) | (128 << 16) | (255 << 24)) >>> 0,
    );
    expect(parseCssColor("rgba(0, 0, 0, 0)")).toBe(0);
    expect(parseCssColor("rgb(10 20 30 / 50%)")! >>> 24).toBe(128);
    expect(parseCssColor("color(srgb 1 0.5 0 / 0.4)")).toBe(
      (255 | (128 << 8) | (0 << 16) | (102 << 24)) >>> 0,
    );
    expect(parseCssColor("oklch(0.7 0.1 30)")).toBeNull();
  });
});
