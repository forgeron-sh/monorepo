import { describe, expect, it } from "vitest";
import { createFarPack, FAR_KIND, FAR_STRIDE, packFar, type FarGlyphSource } from "./far";
import { clusters, ellipsize, lineWidth, placeLine, wrapText, type FarTextMetrics } from "./text";

// One unit a character at size 1, "AV" kerned by -0.5, the baseline 10 down a line box.
const metrics: FarTextMetrics = {
  advance: (font, c) => [...c].length * font.size,
  kern: (font, a, b) => (a === "A" && b === "V" ? -0.5 * font.size : 0),
  baseline: () => 10,
};
const font = { size: 1 };

describe("text without a page", () => {
  it("keeps the f-ligatures whole and places each cluster with its kerning", () => {
    expect(clusters("office fl")).toEqual(["o", "ffi", "c", "e", " ", "fl"]);
    const line = placeLine(metrics, font, "AVA");
    expect(line.xs).toEqual([0, 0.5, 1.5]);
    expect(line.width).toBe(2.5);
    expect(lineWidth(metrics, font, "ab   ")).toBe(2);
  });

  it("wraps as pre-wrap with overflow-wrap anywhere", () => {
    expect(wrapText(metrics, font, "aa bb cc", 5)).toEqual(["aa bb", "cc"]);
    // Spaces hang at the end of a line; a word too long for any line breaks at the edge.
    expect(wrapText(metrics, font, "aa   bb", 4)).toEqual(["aa", "bb"]);
    expect(wrapText(metrics, font, "x abcdefgh", 3)).toEqual(["x", "abc", "def", "gh"]);
    expect(wrapText(metrics, font, "a\n\nb", 9)).toEqual(["a", "", "b"]);
    expect(wrapText(metrics, font, "abc", 0.5)).toEqual(["a", "b", "c"]);
    // Inside a word: after a hyphen (not before a figure), around an em dash.
    expect(wrapText(metrics, font, "XML-RPC", 5)).toEqual(["XML-", "RPC"]);
    expect(wrapText(metrics, font, "v-17x", 3)).toEqual(["v-1", "7x"]);
    expect(wrapText(metrics, font, "ab—cd", 3)).toEqual(["ab—", "cd"]);
    expect(wrapText(metrics, font, "abc—d", 3)).toEqual(["abc", "—d"]);
  });

  it("cuts a line with an ellipsis to fit", () => {
    expect(ellipsize(metrics, font, "abcdef", 6)).toBe("abcdef");
    expect(ellipsize(metrics, font, "abcdef", 4)).toBe("abc…");
  });

  it("packs glyph instances on the baseline, a bar under the readable size", () => {
    const ids = new Map<string, number>();
    const source: FarGlyphSource = {
      ...metrics,
      id: (f, c) => {
        const key = `${f.size}|${c}`;
        if (!ids.has(key)) ids.set(key, ids.size);
        return ids.get(key)!;
      },
    };
    const pack = packFar(
      createFarPack(1),
      [
        {
          type: "glyphs",
          font: { size: 10 },
          color: "--ink",
          lineHeight: 14,
          lines: [{ x: 5, y: 100, text: "A a" }],
          minSize: 5,
          greek: true,
          clip: { x: 0, y: 0, w: 50, h: 50 },
        },
      ],
      { resolve: () => 0xff112233, glyphs: source },
    );
    // The bar, then "A" and "a" (the space draws nothing).
    expect(pack.count).toBe(3);
    const at = (i: number, f: number) => pack.data[i * FAR_STRIDE + f];
    expect(at(0, 7)).toBe(FAR_KIND.rect);
    expect([at(0, 0), at(0, 2), at(0, 8), at(0, 9)]).toEqual([5, 30, 0, 0.5]);
    expect(at(1, 7)).toBe(FAR_KIND.glyph);
    expect([at(1, 0), at(1, 1), at(1, 2), at(1, 3), at(1, 4), at(1, 8)]).toEqual([
      5, 100, 10, 0, 10, 0.5,
    ]);
    expect([at(2, 0), at(2, 3)]).toEqual([25, 1]);
    expect(pack.colors[1 * FAR_STRIDE + 10]).toBe(0xff112233);
    expect([at(2, 12), at(2, 14)]).toEqual([0, 50]);
    expect([...pack.glyphs]).toEqual([
      [0, 0.5],
      [1, 0.5],
    ]);
    // Packed again with a cache: the same instances, copied the second time.
    const cache: NonNullable<FarGlyphSource["cache"]> = new WeakMap();
    const prim = {
      type: "glyphs" as const,
      font: { size: 10 },
      color: "--ink",
      lineHeight: 14,
      lines: [{ x: 5, y: 100, text: "AVa" }],
    };
    const once = packFar(createFarPack(1), [prim], {
      resolve: () => 0xff112233,
      glyphs: { ...source, cache },
    });
    expect(cache.has(prim)).toBe(true);
    const twice = packFar(createFarPack(1), [prim, prim], {
      resolve: () => 0xff112233,
      glyphs: { ...source, id: () => -1, cache },
    });
    expect(twice.count).toBe(once.count * 2);
    expect([...twice.colors.subarray(once.count * FAR_STRIDE, twice.count * FAR_STRIDE)]).toEqual([
      ...once.colors.subarray(0, once.count * FAR_STRIDE),
    ]);
    expect([...twice.glyphs.keys()]).toEqual([...once.glyphs.keys()]);
    // At a known zoom, glyphs out of range are left out, and the pack says until when it holds.
    const far = packFar(createFarPack(1), [prim, { ...prim, minZoom: 0.35 }], {
      resolve: () => 0xff112233,
      glyphs: source,
      zoom: 0.2,
    });
    expect(far.count).toBe(once.count);
    expect(far.band).toEqual([0, 0.35]);
    // Without a glyph source, nothing is drawn.
    const none = packFar(
      createFarPack(1),
      [
        {
          type: "glyphs",
          font: { size: 10 },
          color: "--ink",
          lineHeight: 14,
          lines: [{ x: 0, y: 0, text: "a" }],
        },
      ],
      {
        resolve: () => 0xff112233,
      },
    );
    expect(none.count).toBe(0);
  });
});
