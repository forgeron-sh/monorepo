import { describe, expect, it } from "vitest";
import schemaFile from "../../schema/preset.v1.json";
import {
  bayer,
  chainOf,
  checkPreset,
  compileStages,
  ditheredImagePreset,
  ditherFieldFrame,
  ditherFieldPreset,
  ditherImage,
  ditherPath,
  FIELD_FRAGMENT,
  FIELD_HIGH,
  fieldPreset,
  hearthFrame,
  hearthGrid,
  matrix,
  type PixelFace,
  builtInPresets,
  presetSchema,
  readPreset,
  type RGB,
  runCpu,
  toRgba,
  toTones,
} from "../index";

// The 8×8 table the sub-sites carried (apps/*/src/lib/pixels.ts): the fields must not change.
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28,
  52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7,
  39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];
const bayer8 = (x: number, y: number) => ((BAYER8[(y & 7) * 8 + (x & 7)] ?? 0) + 0.5) / 64;

/** The dither field as the three apps drew it (apps/{font,icon-gallery,ui-gallery}/src/lib/dither-field.ts at 4f0579f6). */
function appField(w: number, h: number, t: number): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const glow = Math.max(0, 1 - Math.hypot((u - 0.92) * 1.3, (v - 1.05) * 1.6));
      const wave = 0.5 + 0.5 * Math.sin(u * 9 + t * 0.6 + Math.sin(v * 5 - t * 0.4) * 1.6);
      const level = glow * 0.9 + wave * 0.18 * glow + (1 - v) * 0.04;
      const d = bayer8(x, y);
      out[y * w + x] = level > d + 0.45 ? 2 : level > d * 0.9 ? 1 : 0;
    }
  }
  return out;
}

/** Blueprint's `ditherImage` at 4f0579f6. */
function oldDitherImage(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  colors: { greys: readonly RGB[]; ember: RGB },
  gain = 1.1,
): void {
  const { greys, ember } = colors;
  const last = greys.length - 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const r = rgba[o] ?? 0;
      const g = rgba[o + 1] ?? 0;
      const b = rgba[o + 2] ?? 0;
      const lum = Math.min(1, ((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * gain);
      const t = bayer(x, y, 4);
      const warm = r > 110 && r - b > 70 && r - g > 30;
      let c: RGB | undefined;
      if (warm) c = Math.min(1, (r / 255) * 1.15) > t ? ember : greys[0];
      else {
        const v = lum * last;
        const lo = Math.floor(v);
        c = v - lo > t ? greys[Math.min(last, lo + 1)] : greys[lo];
      }
      rgba[o] = c?.[0] ?? 0;
      rgba[o + 1] = c?.[1] ?? 0;
      rgba[o + 2] = c?.[2] ?? 0;
      rgba[o + 3] = 255;
    }
  }
}

/** The GLSL `bayerN` formulas of the site's shader, in JS: exact for whole cells. */
const glslBayer2 = (x: number, y: number) => {
  const v = 0.5 * x + y * y * 0.75;
  return v - Math.floor(v);
};
const glslBayer4 = (x: number, y: number) =>
  glslBayer2(Math.floor(x / 2), Math.floor(y / 2)) * 0.25 + glslBayer2(x, y);
const glslBayer8 = (x: number, y: number) =>
  glslBayer4(Math.floor(x / 2), Math.floor(y / 2)) * 0.25 + glslBayer2(x, y);

describe("Bayer", () => {
  it("is the 8×8 table the sub-sites carried", () => {
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++)
        expect(bayer(x, y, 8)).toBe(((BAYER8[y * 8 + x] ?? 0) + 0.5) / 64);
  });

  it("equals the GLSL formulas without the half step", () => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        expect(glslBayer2(x, y)).toBe((matrix(2)[(y & 1) * 2 + (x & 1)] ?? 0) / 4);
        expect(glslBayer4(x, y)).toBe((matrix(4)[(y & 3) * 4 + (x & 3)] ?? 0) / 16);
        expect(glslBayer8(x, y)).toBe((matrix(8)[(y & 7) * 8 + (x & 7)] ?? 0) / 64);
      }
  });
});

describe("dither field", () => {
  it("is the apps' field, cell for cell", () => {
    for (const [w, h, t] of [
      [64, 48, 0],
      [360, 150, 1.7],
      [97, 31, 12.345],
    ] as const)
      expect(ditherFieldFrame(w, h, t)).toEqual(appField(w, h, t));
  });

  it("paints the apps' colours through the preset", () => {
    const colors: Record<string, RGB> = {
      "--bg": [10, 10, 10],
      "--line-strong": [46, 46, 46],
      "--accent": [255, 79, 31],
    };
    const frame = runCpu(chainOf(ditherFieldPreset()), 120, 40, {
      px: 1,
      time: 2,
      resolve: (ref) => colors[typeof ref === "string" ? ref : ref.var] ?? [0, 0, 0],
    });
    const rgba = toRgba(frame);
    const tones = appField(120, 40, 2);
    const order = [colors["--bg"], colors["--line-strong"], colors["--accent"]];
    tones.forEach((k, i) => {
      const c = order[k] ?? [0, 0, 0];
      expect([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], rgba[i * 4 + 3]]).toEqual([...c, 255]);
    });
    expect(tones.includes(FIELD_HIGH)).toBe(true);
  });
});

describe("ditherPath", () => {
  it("is the ordered dither of the old path, cell for cell", () => {
    const old = (
      cols: number,
      rows: number,
      tone: (x: number, y: number) => number,
      n: 2 | 4 | 8,
    ) => {
      const parts: string[] = [];
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++)
          if (tone(x, y) > bayer(x, y, n)) parts.push(`M${x} ${y}h1v1h-1z`);
      return parts.join("");
    };
    for (const n of [2, 4, 8] as const) {
      const tone = (x: number) => x / 63;
      expect(ditherPath(64, 16, tone, n)).toBe(old(64, 16, tone, n));
    }
    expect(ditherPath(8, 8, () => 0)).toBe("");
    expect(ditherPath(8, 8, () => 1).match(/M/g)).toHaveLength(64);
  });
});

describe("dithered image", () => {
  it("is Blueprint's ditherImage, byte for byte", () => {
    const greys: RGB[] = [
      [10, 10, 10],
      [46, 46, 46],
      [94, 94, 94],
      [143, 143, 143],
      [237, 237, 237],
    ];
    const ember: RGB = [255, 79, 31];
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed & 255;
    };
    const w = 61;
    const h = 37;
    const src = new Uint8ClampedArray(w * h * 4).map(rnd);
    for (const gain of [1.1, 1.5]) {
      const a = src.slice();
      const b = src.slice();
      ditherImage(a, w, h, { greys, ember }, gain);
      oldDitherImage(b, w, h, { greys, ember }, gain);
      expect(a).toEqual(b);
      // And through the preset (image source, image-dither, palette).
      const tones: Record<string, RGB> = {};
      const preset = ditheredImagePreset(gain, 1);
      const pal = preset.passes[2]?.tones as { var: string }[];
      pal.forEach((ref, i) => (tones[ref.var] = i < 5 ? (greys[i] ?? ember) : ember));
      const frame = runCpu(chainOf(preset), w, h, {
        px: 1,
        data: { image: { width: w, height: h, data: src } },
        resolve: (ref) => tones[typeof ref === "string" ? ref : ref.var] ?? [0, 0, 0],
      });
      expect(toRgba(frame)).toEqual(b);
    }
  });
});

describe("hearth", () => {
  // A toy face: every capital a 3×7 block with a hole, enough to test placement.
  const face: PixelFace = {
    glyph: () => ({ rows: ["###", "#.#", "###", "#.#", "###", "#.#", "###"], top: 0 }),
    glyphWidth: () => 3,
    textWidth: (t) => t.length * 4 - 1,
  };
  it("stands the word on the bottom of its slot and never leaves a letter empty", () => {
    const grid = hearthGrid(face, 120, 40, { x: 0, y: 10, w: 120, h: 28 });
    expect(grid.y + 7 * grid.k).toBe(38);
    const frame = hearthFrame(grid, 2);
    expect(hearthFrame(grid, 2)).toEqual(frame);
    const letters = [...frame].filter((_, i) => grid.word[i]);
    expect(letters.length).toBeGreaterThan(0);
    expect(letters.every((tone) => tone > 1)).toBe(true);
  });

  it("draws the background transparent through its preset", () => {
    const grid = hearthGrid(face, 60, 20, { x: 0, y: 4, w: 60, h: 14 });
    const frame = runCpu(chainOf(builtInPresets().hearth), 60, 20, {
      px: 1,
      time: 1,
      data: { grid, heat: null },
    });
    const tones = hearthFrame(grid, 1);
    const rgba = toRgba(frame);
    tones.forEach((k, i) => expect(rgba[i * 4 + 3]).toBe(k === 0 ? 0 : 255));
  });
});

describe("presets", () => {
  it("are valid and keep their defaults", () => {
    for (const [name, preset] of Object.entries(builtInPresets())) {
      const r = checkPreset(JSON.parse(JSON.stringify(preset)));
      expect("preset" in r ? name : r).toBe(name);
    }
    const filled = readPreset({
      version: 1,
      source: { type: "heat" },
      passes: [{ type: "ordered" }],
    });
    expect(filled.passes[0]).toEqual({
      type: "ordered",
      matrix: 8,
      centered: true,
      origin: "top",
      steps: [[0, 1]],
    });
  });

  it("say what is wrong, with a path", () => {
    const r = checkPreset({
      version: 2,
      source: { type: "smoke" },
      passes: [
        { type: "ordered", matrix: 3 },
        { type: "pixelate", size: 2 },
        { type: "grid" },
        { type: "ordered", bogus: 1 },
      ],
    });
    expect("issues" in r && r.issues.map((i) => i.path)).toEqual([
      "$.version",
      "$.source.type",
      "$.passes[0].matrix",
      "$.passes[1]",
      "$.passes[3]",
      "$.passes[3].bogus",
    ]);
  });

  it("have a schema written from the passes (run scripts/shaders/gen-schema.ts)", () => {
    expect(schemaFile).toEqual(presetSchema());
  });
});

describe("GLSL", () => {
  it("compiles a field preset to one stage with the site's expressions", () => {
    const stages = compileStages(chainOf(fieldPreset({ mode: "ember", pixel: 4 })));
    expect(stages).toHaveLength(1);
    const f = stages[0]?.fragment ?? "";
    expect(f).toContain("float t=bayer8(cell);");
    expect(f).toContain("if(v>t){k=1.0;if(v>0.86+t*0.12){k=2.0;}}");
    expect(f).toContain("if(uPx>=4.0&&(f.x>0.84||f.y>0.84))");
    // The value is the site's shader, line for line.
    const site = FIELD_FRAGMENT.slice(
      FIELD_FRAGMENT.indexOf("vec2 uv="),
      FIELD_FRAGMENT.indexOf("float t=bayer8"),
    ).trim();
    expect(f).toContain(site);
  });

  it("cuts a stage per pass on demand, the grid in the last one", () => {
    const stages = compileStages(chainOf(fieldPreset({ mode: "globe" })), { split: true });
    expect(stages.map((s) => s.cellResolution)).toEqual([true, false]);
    expect(stages.at(-1)?.fragment).toContain("fract(frag/uPx)");
  });

  it("refuses a CPU-only source", () => {
    expect(() => compileStages(chainOf(ditherFieldPreset()))).toThrow(/CPU only/);
  });
});

describe("CPU grid", () => {
  it("leaves the gap of the site's field on the right and top edges", () => {
    const frame = runCpu(chainOf(fieldPreset({ mode: "field", pixel: 4 })), 16, 8, { px: 4 });
    const tones = toTones(frame);
    // Column 3 of each cell and row 0 of each cell (top) are background.
    for (let y = 0; y < 8; y++) {
      expect(tones[y * 16 + 3]).toBe(0);
      expect(tones[y * 16 + 7]).toBe(0);
    }
    for (let x = 0; x < 16; x++) {
      expect(tones[x]).toBe(0);
      expect(tones[4 * 16 + x]).toBe(0);
    }
  });
});
