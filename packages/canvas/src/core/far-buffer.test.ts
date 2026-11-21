import { describe, expect, it } from "vitest";
import { FAR_STRIDE, createFarPack, packFar, type FarPrimitive, type PackOptions } from "./far";
import { createFarBuffer, farMoved, type FarGroup } from "./far-buffer";

const options: PackOptions = { resolve: () => 0xff0000ff };

const card = (x: number, y: number, label = "a"): FarPrimitive[] => [
  { type: "rect", x, y, w: 40, h: 20, fill: "--bg", stroke: "--line", strokeWidth: 1 },
  { type: "line", points: [x, y, x + 40, y + 20], color: "--ink", width: 1, dash: [4, 3] },
  { type: "triangle", points: [x, y, x + 4, y, x, y + 4], fill: "--ink" },
  { type: "text", x: x + 4, y: y + 10, text: label, size: 10, color: "--ink" },
];

/** The instances a buffer draws (free ones left out, the group slot zeroed), in order. */
function drawn(data: Float32Array, count: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i < count; i++) {
    const o = i * FAR_STRIDE;
    if (data[o + 8]! >= 1e29) continue;
    const row = [...data.subarray(o, o + FAR_STRIDE)];
    row[24] = 0;
    out.push(row);
  }
  return out;
}

const flat = (groups: FarGroup[]) => {
  const pack = packFar(
    createFarPack(),
    groups.flatMap((g) => g.prims),
    options,
  );
  return drawn(pack.data, pack.count);
};

describe("the far buffer", () => {
  it("draws what one pack of every group draws, in order", () => {
    const b = createFarBuffer();
    const groups = [
      { key: "a", prims: card(0, 0) },
      { key: "b", prims: card(100, 0) },
      { key: "c", prims: card(0, 100) },
    ];
    const u = b.update(groups, options);
    expect(u.full).toBe(true);
    expect(drawn(b.pack.data, b.pack.count)).toEqual(flat(groups));
  });

  it("packs again only a group that changed, in place", () => {
    const b = createFarBuffer();
    const a = { key: "a", prims: card(0, 0) };
    const c = { key: "c", prims: card(0, 100) };
    b.update([a, { key: "b", prims: card(100, 0) }, c], options);
    const changed = { key: "b", prims: card(100, 0, "b") };
    changed.prims[0] = { ...changed.prims[0]!, fill: "--other" } as FarPrimitive;
    const u = b.update([a, changed, c], options);
    expect(u.full).toBe(false);
    expect(u.ranges).toHaveLength(1);
    expect(drawn(b.pack.data, b.pack.count)).toEqual(flat([a, changed, c]));
  });

  it("moves a group drawn the same by an offset, without packing it", () => {
    const b = createFarBuffer();
    b.update(
      [
        { key: "a", prims: card(0, 0) },
        { key: "b", prims: card(100, 0) },
      ],
      options,
    );
    const before = b.pack.data.slice(0, b.pack.count * FAR_STRIDE);
    const u = b.update(
      [
        { key: "a", prims: card(0, 0) },
        { key: "b", prims: card(130, -20) },
      ],
      options,
    );
    expect(u.full).toBe(false);
    expect(u.ranges).toEqual([]);
    expect(u.offsets).not.toBeNull();
    expect(b.pack.data.slice(0, b.pack.count * FAR_STRIDE)).toEqual(before);
    // b's instances name its slot, whose offset is the move.
    const first = b.pack.data.findIndex((_, i) => i % FAR_STRIDE === 0 && b.pack.data[i] === 100);
    const slot = b.pack.data[first + 24]!;
    expect([b.offsets[slot * 2], b.offsets[slot * 2 + 1]]).toEqual([30, -20]);
  });

  it("takes a group's own move (the same primitives, dx and dy) as its offset", () => {
    const b = createFarBuffer();
    const prims = card(0, 0);
    b.update([{ key: "a", prims }], options);
    const u = b.update([{ key: "a", prims, dx: 12, dy: 4 }], options);
    expect(u.ranges).toEqual([]);
    expect([b.offsets[0], b.offsets[1]]).toEqual([12, 4]);
    // Drawn again where it was: the offset back to zero.
    b.update([{ key: "a", prims: card(0, 0) }], options);
    expect([b.offsets[0], b.offsets[1]]).toEqual([0, 0]);
  });

  it("leaves free instances where a group went, and lays out again when one comes", () => {
    const b = createFarBuffer();
    const a = { key: "a", prims: card(0, 0) };
    const bb = { key: "b", prims: card(100, 0) };
    const c = { key: "c", prims: card(0, 100) };
    b.update([a, bb, c], options);
    const gone = b.update([a, c], options);
    expect(gone.full).toBe(false);
    expect(drawn(b.pack.data, b.pack.count)).toEqual(flat([a, c]));
    const back = b.update([a, bb, c], options);
    expect(back.full).toBe(true);
    expect(drawn(b.pack.data, b.pack.count)).toEqual(flat([a, bb, c]));
    // A new stacking order lays out again, in that order.
    b.update([c, a, bb], options);
    expect(drawn(b.pack.data, b.pack.count)).toEqual(flat([c, a, bb]));
  });

  it("keeps a group that left packed, and takes it back without packing it", () => {
    const b = createFarBuffer();
    const a = { key: "a", prims: card(0, 0) };
    const c = { key: "c", prims: card(0, 100) };
    b.update([a, c], options);
    b.update([a], options);
    // Back with a new drawing moved: an offset, no packing (its instances are the same).
    const back = { key: "c", prims: card(10, 100) };
    const u = b.update([a, back], options);
    expect(u.full).toBe(true);
    expect(drawn(b.pack.data, b.pack.count)).toEqual(flat([a, c]));
    expect(u.offsets).not.toBeNull();
  });

  it("tells moved drawings from changed ones", () => {
    expect(farMoved(card(0, 0), card(5, 7))).toEqual({ dx: 5, dy: 7 });
    expect(farMoved(card(0, 0), card(0, 0))).toEqual({ dx: 0, dy: 0 });
    expect(farMoved(card(0, 0), card(5, 7, "b"))).toBeNull();
    const clipped = (x: number, clipX: number): FarPrimitive[] => [
      { type: "rect", x, y: 0, w: 4, h: 4, fill: "--a", clip: { x: clipX, y: 0, w: 50, h: 50 } },
    ];
    // Moved with its frame, or within it (the clip stays: drawn differently).
    expect(farMoved(clipped(0, 0), clipped(10, 10))).toEqual({ dx: 10, dy: 0 });
    expect(farMoved(clipped(0, 0), clipped(10, 0))).toBeNull();
    const words = (x: number, text: string): FarPrimitive[] => [
      {
        type: "glyphs",
        font: { size: 12 },
        color: "--ink",
        lineHeight: 16,
        lines: [
          { x, y: 0, text },
          { x, y: 16, text: "two" },
        ],
      },
    ];
    expect(farMoved(words(0, "one"), words(3, "one"))).toEqual({ dx: 3, dy: 0 });
    expect(farMoved(words(0, "one"), words(3, "uno"))).toBeNull();
    const lasso: FarPrimitive[] = [{ type: "polygon", points: [0, 0, 1, 0, 0, 1], fill: "--a" }];
    expect(farMoved(lasso, [{ ...lasso[0]! } as FarPrimitive])).toBeNull();
  });

  it("keeps the glyphs its groups need, and forgets those of a group gone", () => {
    const ids = new Map<string, number>();
    const glyphs = {
      advance: () => 5,
      kern: () => 0,
      baseline: () => 10,
      id: (_f: unknown, c: string) => {
        if (!ids.has(c)) ids.set(c, ids.size);
        return ids.get(c)!;
      },
      cache: new WeakMap(),
    };
    const o: PackOptions = { ...options, glyphs };
    const text = (x: number, s: string): FarPrimitive[] => [
      {
        type: "glyphs",
        font: { size: 12 },
        color: "--ink",
        lineHeight: 16,
        lines: [{ x, y: 0, text: s }],
      },
    ];
    const b = createFarBuffer();
    b.update(
      [
        { key: "a", prims: text(0, "ab") },
        { key: "b", prims: text(50, "bc") },
      ],
      o,
    );
    expect([...b.pack.glyphs.keys()].sort()).toEqual([0, 1, 2]);
    b.update([{ key: "b", prims: text(50, "bc") }], o);
    expect([...b.pack.glyphs.keys()].sort()).toEqual([1, 2]);
  });

  it("packs again, at a new zoom, only the groups whose words come into view", () => {
    const glyphs = {
      advance: () => 5,
      kern: () => 0,
      baseline: () => 10,
      id: (_f: unknown, c: string) => c.charCodeAt(0),
      cache: new WeakMap(),
    };
    const words: FarPrimitive[] = [
      {
        type: "glyphs",
        font: { size: 12 },
        color: "--ink",
        lineHeight: 16,
        lines: [{ x: 0, y: 0, text: "hi" }],
        minZoom: 0.35,
      },
    ];
    const b = createFarBuffer();
    b.update(
      [
        { key: "w", prims: words },
        { key: "box", prims: card(0, 0) },
      ],
      {
        ...options,
        glyphs,
        zoom: 0.2,
      },
    );
    expect(b.pack.band).toEqual([-Infinity, 0.35]);
    const before = drawn(b.pack.data, b.pack.count).length;
    const u = b.refresh({ ...options, glyphs, zoom: 0.5 });
    expect(u.full || u.ranges.length === 1).toBe(true);
    expect(drawn(b.pack.data, b.pack.count).length).toBe(before + 2);
  });
});
