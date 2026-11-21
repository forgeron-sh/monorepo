import { describe, expect, it } from "vitest";
import {
  bayer,
  ditherImage,
  FIELD_FRAGMENT,
  FIELD_MODES,
  GLYPHS,
  type RGB,
  textSvg,
  textWidth,
} from "../index";

/** `bayer8` of the field shader, evaluated in double precision: what the GPU computes per cell. */
function shaderBayer8(x: number, y: number): number {
  const fract = (v: number) => v - Math.floor(v);
  const b2 = (ax: number, ay: number) => {
    const fx = Math.floor(ax);
    const fy = Math.floor(ay);
    return fract(fx * 0.5 + fy * (fy * 0.75));
  };
  const b4 = (ax: number, ay: number) => b2(0.5 * ax, 0.5 * ay) * 0.25 + b2(ax, ay);
  return b4(0.5 * x, 0.5 * y) * 0.25 + b2(x, y);
}

describe("field generators", () => {
  it("quantise with the core's 8×8 Bayer matrix, without its half-step offset", () => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) expect(shaderBayer8(x, y)).toBe(bayer(x, y, 8) - 0.5 / 64);
  });

  it("name one shader branch per mode", () => {
    expect(Object.keys(FIELD_MODES)).toEqual(["ember", "globe", "dissolve", "field"]);
    expect(FIELD_FRAGMENT).toContain("uniform float uMode");
    expect(FIELD_FRAGMENT).toContain("bayer8(cell)");
  });
});

describe("ditherImage", () => {
  const greys: RGB[] = [
    [0, 0, 0],
    [60, 60, 60],
    [120, 120, 120],
    [180, 180, 180],
    [240, 240, 240],
  ];
  const ember: RGB = [255, 80, 30];

  it("maps luminance to the greys and warm pixels to ember over the background, all opaque", () => {
    const w = 4;
    const h = 4;
    const px = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      // Left half white, right half a saturated red.
      px.set(i % w < 2 ? [255, 255, 255, 128] : [250, 40, 20, 0], i * 4);
    }
    ditherImage(px, w, h, { greys, ember });
    const at = (i: number) => [...px.subarray(i * 4, i * 4 + 3)];
    const all = [...Array(w * h).keys()];
    expect(all.map((i) => px[i * 4 + 3])).toEqual(all.map(() => 255));
    expect(all.filter((i) => i % w < 2).map(at)).toEqual(
      all.filter((i) => i % w < 2).map(() => greys[4]),
    );
    for (const i of all.filter((i) => i % w >= 2)) expect([greys[0], ember]).toContainEqual(at(i));
  });

  it("dithers a mid grey between its two neighbouring greys", () => {
    const px = new Uint8ClampedArray(8 * 8 * 4);
    // 87 / 255 × 1.1 × 4 ≈ 1.5: half way between greys 1 and 2 once the gain is applied.
    for (let i = 0; i < 64; i++) px.set([87, 87, 87, 255], i * 4);
    ditherImage(px, 8, 8, { greys, ember });
    const seen = new Set<number>();
    for (let i = 0; i < 64; i++) seen.add(px[i * 4] ?? -1);
    expect([...seen].sort((a, b) => a - b)).toEqual([60, 120]);
  });
});

describe("Forge Sans", () => {
  it("draws text as one-unit pixels, upper-cased and stripped of accents by default", () => {
    const svg = textSvg("Forgé");
    expect(svg).toContain('viewBox="0 0 29 7"');
    expect(svg).toBe(textSvg("FORGE"));
    expect(svg).toContain('fill="currentColor"');
  });

  it("keeps case and accents on request, on rows -2 to 8", () => {
    const svg = textSvg("é", { keepCase: true });
    expect(svg).toContain('viewBox="0 -2 5 11"');
    expect(svg).toContain("M3 0h1v1h-1z");
  });

  it("measures labels with the same face", () => {
    expect(textWidth("API")).toBe(5 + 1 + 5 + 1 + 3);
    expect(GLYPHS.A?.rows).toHaveLength(7);
  });
});
