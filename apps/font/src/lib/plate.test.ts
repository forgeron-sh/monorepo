import { describe, expect, it } from "vitest";
import { glyphSvg, gridPath, guides, layoutText } from "./plate";

const metrics = { ascender: 900, capHeight: 700, xHeight: 500, descender: -200 };

describe("plate geometry", () => {
  it("places the guides from the top of the line", () => {
    expect(guides(metrics).map((g) => [g.key, g.y])).toEqual([
      ["accent", 0],
      ["cap", 200],
      ["x", 400],
      ["baseline", 900],
      ["descender", 1100],
    ]);
  });

  it("sets glyphs by advance and skips what the font lacks", () => {
    const set = layoutText(
      "ab{c",
      { 97: ["#"], 98: ["#"], 99: ["#"] },
      { 97: 600, 98: 200, 99: 400 },
    );
    expect(set.glyphs.map((g) => [g.cp, g.x])).toEqual([
      [97, 0],
      [98, 600],
      [99, 800],
    ]);
    expect(set.width).toBe(1200);
  });

  it("draws a grid line every unit", () => {
    expect(gridPath(200, 100, 100)).toBe("M0 0V100M100 0V100M200 0V100M0 0H200M0 100H200");
  });

  it("draws a glyph proof with its guides, labelled, and an accessible name", () => {
    const svg = glyphSvg(["#."], { unit: 100, advance: 200, metrics, title: 'A "quote"' });
    expect(svg).toContain('aria-label="A &quot;quote&quot;"');
    expect(svg).toContain('class="g-guide g-base"');
    expect(svg).toContain(">BASE 0<");
    expect(svg).toContain('d="M0 0h100v100h-100z"');
    expect(glyphSvg([], { unit: 100, advance: 0, metrics })).toContain('aria-hidden="true"');
  });
});
