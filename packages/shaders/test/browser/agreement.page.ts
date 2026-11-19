/**
 * The page of `scripts/shaders/check-agreement.ts`, run in headless Chrome: each case runs a
 * preset on the GPU (`createGlPipeline`, `readPixels` flipped to rows from the top) and on the
 * CPU (`runCpu`, `toRgba`), and counts the pixels that differ. The integer and ordered passes
 * must agree exactly; the float ones report their share (docs/shaders/design.md §6).
 */
import type { ImagePixels } from "../../src/core/sources/image";
import {
  bayerMaskPreset,
  chainOf,
  type ColorRef,
  ditheredImagePreset,
  fieldPreset,
  type Preset,
  resolveRef,
  runCpu,
  toRgba,
} from "../../src/index";
import { createGlPipeline } from "../../src/dom/pipeline-gl-ext";

interface Case {
  name: string;
  preset: Preset;
  width: number;
  height: number;
  px: number;
  time?: number;
  image?: ImagePixels;
  /** Cut a stage per pass on the GPU (the framebuffer path). */
  split?: boolean;
  exact: boolean;
}

const TONES: ColorRef[] = ["#0a0a0a", "#2e2e2e", "#ededed", "#ff4f1f", "#5e5e5e", "#8f8f8f"];
const resolve = (ref: ColorRef) => resolveRef(ref);

let seed = 11;
const rnd = () => {
  seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
  return (seed >> 8) & 255;
};
/** A picture of `w × h`: a ramp of every level across, random below, warm patches. */
function picture(w: number, h: number): ImagePixels {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const ramp = y < h / 2;
      const v = ramp ? Math.round((x / Math.max(1, w - 1)) * 255) : rnd();
      data[o] = ramp ? v : rnd();
      data[o + 1] = ramp ? v : (x + y) % 3 === 0 ? 20 : rnd();
      data[o + 2] = ramp ? v : (x * y) % 5 === 0 ? 10 : rnd();
      data[o + 3] = 255;
    }
  return { width: w, height: h, data };
}

const ordered = (
  matrix: 2 | 4 | 8,
  centered: boolean,
  origin: "top" | "bottom",
  steps: [number, number][],
  extra: Preset["passes"] = [],
): Preset => ({
  version: 1,
  source: { type: "image" },
  passes: [
    { type: "ordered", matrix, centered, origin, steps },
    ...extra,
    { type: "palette", tones: TONES.slice(0, steps.length + 1), transparent: [] },
  ],
});

function cases(): Case[] {
  const out: Case[] = [];
  const W = 256;
  const H = 64;
  for (const matrix of [2, 4, 8] as const)
    for (const centered of [true, false])
      for (const origin of ["top", "bottom"] as const)
        for (const [label, steps] of [
          ["one step", [[0, 1]]],
          [
            "field steps",
            [
              [0, 1],
              [0.86, 0.12],
            ],
          ],
          [
            "dither-field steps",
            [
              [0, 0.9],
              [0.45, 1],
            ],
          ],
        ] as [string, [number, number][]][])
          out.push({
            name: `ordered ${matrix} ${centered ? "centred" : "plain"} ${origin} ${label}`,
            preset: ordered(matrix, centered, origin, steps),
            width: W,
            height: H,
            px: 1,
            image: picture(W, H),
            exact: true,
          });
  for (const px of [4, 6]) {
    const w = 240;
    const h = 120;
    const grid = ordered(
      8,
      false,
      "bottom",
      [
        [0, 1],
        [0.86, 0.12],
      ],
      [{ type: "grid", gap: 0.16, min: 4, tone: 0 }],
    );
    const image = picture(w / px, h / px);
    out.push({ name: `grid px ${px}`, preset: grid, width: w, height: h, px, image, exact: true });
    out.push({
      name: `grid px ${px}, a stage per pass (framebuffers)`,
      preset: grid,
      width: w,
      height: h,
      px,
      image,
      split: true,
      exact: true,
    });
  }
  out.push({
    name: "image-dither + palette (float luminance)",
    preset: ditheredImagePreset(1.1, 1),
    width: 200,
    height: 120,
    px: 1,
    image: picture(200, 120),
    exact: false,
  });
  out.push({
    name: "image-dither gain 1.5",
    preset: ditheredImagePreset(1.5, 1),
    width: 200,
    height: 120,
    px: 1,
    image: picture(200, 120),
    exact: false,
  });
  // S2's passes, each alone on the test picture, then in a chain with the grid.
  const W2 = 240;
  const H2 = 120;
  const pic = picture(W2, H2);
  const on = (passes: Preset["passes"], tones = 3): Preset => ({
    version: 1,
    source: { type: "image" },
    passes: [...passes, { type: "palette", tones: TONES.slice(0, tones), transparent: [] }],
  });
  const FIELD: [number, number][] = [
    [0, 1],
    [0.86, 0.12],
  ];
  const add = (name: string, preset: Preset, exact: boolean, px = 1, split = false) => {
    const image = px === 1 ? pic : picture(Math.ceil(W2 / px), Math.ceil(H2 / px));
    out.push({ name, preset, width: W2, height: H2, px, image, exact, split });
  };
  for (const origin of ["top", "bottom"] as const)
    for (const steps of [[[0, 1]], FIELD] as [number, number][][])
      add(
        `blue-noise ${origin} ${steps.length} step(s)`,
        on([{ type: "blue-noise", origin, steps }]),
        true,
      );
  add(
    "blue-noise + grid px 4",
    on([
      { type: "blue-noise", origin: "bottom", steps: FIELD },
      { type: "grid", gap: 0.16, min: 4, tone: 0 },
    ]),
    true,
    4,
  );
  for (const [size, angle] of [
    [6, 45],
    [4.5, 15],
    [3, 0],
  ] as const)
    add(
      `halftone size ${size} angle ${angle}`,
      on([{ type: "halftone", size, angle, tone: 1 }], 2),
      false,
    );
  add(
    "scanlines on colours",
    {
      version: 1,
      source: { type: "image" },
      passes: [{ type: "scanlines", period: 3, width: 1, strength: 0.55, origin: "top" }],
    },
    false,
  );
  add(
    "ordered + palette + scanlines bottom",
    {
      version: 1,
      source: { type: "image" },
      passes: [
        { type: "ordered", matrix: 4, centered: true, origin: "top", steps: FIELD },
        { type: "palette", tones: TONES.slice(0, 3), transparent: [] },
        { type: "scanlines", period: 4, width: 2, strength: 0.3, origin: "bottom" },
      ],
    },
    false,
  );
  for (const scale of [1, 3])
    add(
      `edges scale ${scale} + ordered`,
      on([
        { type: "edges", scale },
        { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD },
      ]),
      false,
    );
  add(
    "edges + ordered + grid px 4",
    on([
      { type: "edges", scale: 2 },
      { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD },
      { type: "grid", gap: 0.16, min: 4, tone: 0 },
    ]),
    false,
    4,
  );
  for (const [radius, strength, matrix] of [
    [1, 1, 4],
    [2, 1.5, 4],
    [4, 2.5, 8],
  ] as const)
    add(
      `glow radius ${radius} strength ${strength}`,
      on([
        { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD },
        { type: "glow", tones: [2], over: [0], tone: 2, radius, strength, matrix },
      ]),
      true,
    );
  add(
    "glow + grid px 4, a stage per pass",
    on([
      { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD },
      { type: "glow", tones: [2], over: [0, 1], tone: 1, radius: 2, strength: 1.5, matrix: 4 },
      { type: "grid", gap: 0.16, min: 4, tone: 0 },
    ]),
    true,
    4,
    true,
  );
  for (const px of [1, 4])
    add(
      `crt px ${px}`,
      {
        version: 1,
        source: { type: "image" },
        passes: [
          { type: "ordered", matrix: 8, centered: false, origin: "bottom", steps: FIELD },
          { type: "palette", tones: TONES.slice(0, 3), transparent: [] },
          { type: "crt", curvature: 0.12, mask: 0.3, bloom: 0.35, vignette: 0.35 },
        ],
      },
      false,
      px,
    );
  for (const level of [0, 5, 11, 16])
    out.push({
      name: `bayer mask level ${level} (constant source)`,
      preset: {
        ...bayerMaskPreset(level),
        passes: [
          ...bayerMaskPreset(level).passes,
          { type: "palette", tones: TONES.slice(0, 2), transparent: [] },
        ],
      },
      width: 64,
      height: 32,
      px: 1,
      exact: true,
    });
  for (const mode of ["ember", "globe", "dissolve", "field"] as const)
    for (const time of [0, 1.7])
      out.push({
        name: `field ${mode} t=${time} (preset field-${mode})`,
        preset: fieldPreset({ mode, pixel: 4, accent: mode !== "field" }),
        width: 320,
        height: 200,
        px: 4,
        time,
        exact: false,
      });
  return out;
}

interface Result {
  name: string;
  pixels: number;
  differ: number;
  exact: boolean;
  /** Also: the split GPU path against the fused one. */
  error?: string;
}

async function run(): Promise<{ cases: Result[] }> {
  const results: Result[] = [];
  for (const c of cases()) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = c.width;
      canvas.height = c.height;
      const gl = canvas.getContext("webgl2", {
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      });
      if (!gl) throw new Error("no WebGL2");
      const pipeline = createGlPipeline(gl, chainOf(c.preset), {
        resolve,
        split: c.split ?? false,
      });
      const inputs = {
        width: c.width,
        height: c.height,
        px: c.px,
        time: c.time ?? 0,
        mouse: [0.5, 0.2] as const,
        ...(c.image ? { image: c.image } : {}),
      };
      pipeline.render(inputs);
      const raw = new Uint8Array(c.width * c.height * 4);
      gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, raw);
      const gpu = new Uint8Array(raw.length);
      const row = c.width * 4;
      for (let y = 0; y < c.height; y++)
        gpu.set(raw.subarray((c.height - 1 - y) * row, (c.height - y) * row), y * row);
      const cpu = toRgba(
        runCpu(chainOf(c.preset), c.width, c.height, {
          px: c.px,
          time: c.time ?? 0,
          resolve,
          ...(c.image ? { data: { image: c.image } } : {}),
        }),
      );
      let differ = 0;
      for (let i = 0; i < gpu.length; i += 4)
        if (
          gpu[i] !== cpu[i] ||
          gpu[i + 1] !== cpu[i + 1] ||
          gpu[i + 2] !== cpu[i + 2] ||
          gpu[i + 3] !== cpu[i + 3]
        )
          differ++;
      results.push({ name: c.name, pixels: c.width * c.height, differ, exact: c.exact });
      pipeline.dispose();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    } catch (e) {
      results.push({ name: c.name, pixels: 0, differ: -1, exact: c.exact, error: String(e) });
    }
  }
  return { cases: results };
}

run()
  .then((r) => fetch("/result", { method: "POST", body: JSON.stringify(r) }))
  .catch((e) => fetch("/result", { method: "POST", body: JSON.stringify({ error: String(e) }) }));
