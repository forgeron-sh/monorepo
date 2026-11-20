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
  /** The driven value (`uProgress`). */
  progress?: number;
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
  // The role passes, on a flat source so that only they draw.
  const flat = (passes: Preset["passes"], tones = 4): Preset => ({
    version: 1,
    source: { type: "constant", value: 1 },
    passes: [
      { type: "ordered", matrix: 4, centered: true, origin: "top", steps: [[0, 1]] },
      ...passes,
      { type: "palette", tones: TONES.slice(0, tones), transparent: [] },
    ],
  });
  const role = (name: string, preset: Preset, exact: boolean, time: number) =>
    out.push({ name, preset, width: 80, height: 40, px: 1, time, exact });
  for (const direction of ["down", "up"] as const)
    role(
      `hatch ${direction} drifting`,
      flat([
        {
          type: "hatch",
          tone: 2,
          over: [1],
          period: 5,
          width: 2,
          speed: 6,
          direction,
          x0: 0.1,
          x1: 0.7,
          y0: 0.2,
          y1: 0.8,
        },
      ]),
      true,
      1.7,
    );
  role(
    "dissolve held at 0.4",
    flat([{ type: "dissolve", tone: 0, over: [], progress: 0.4, cycle: 0, matrix: 8 }]),
    true,
    0,
  );
  role(
    "dissolve cycle 3",
    flat([{ type: "dissolve", tone: 0, over: [1], progress: 0, cycle: 3, matrix: 4 }]),
    false,
    0.7,
  );
  role(
    "ring spreading",
    flat([
      {
        type: "ring",
        cx: 0.4,
        cy: 0.5,
        speed: 0.4,
        width: 2.5,
        start: 0,
        life: 1,
        repeat: 0,
        tones: [3, 2, 1],
        matrix: 8,
      },
    ]),
    false,
    0.6,
  );
  role(
    "ring repeating",
    flat([
      {
        type: "ring",
        cx: 0.5,
        cy: 0.5,
        speed: 0.4,
        width: 3,
        start: 0.2,
        life: 1,
        repeat: 2,
        tones: [2],
        matrix: 4,
      },
    ]),
    false,
    2.9,
  );
  role(
    "reveal mid-sweep",
    flat([
      {
        type: "reveal",
        duration: 1.5,
        hold: 1.5,
        loop: false,
        front: [3, 2],
        band: 0.06,
        dither: 0.12,
        matrix: 8,
      },
    ]),
    false,
    0.6,
  );
  role(
    "reveal looping",
    flat([
      {
        type: "reveal",
        duration: 1.5,
        hold: 1.5,
        loop: true,
        front: [3],
        band: 0.1,
        dither: 0.2,
        matrix: 4,
      },
    ]),
    false,
    4.1,
  );
  // The burns: a front, its sparks, the 4×4 dither, a palette; both shapes, both directions.
  const burnCase = (name: string, front: Record<string, unknown>, time: number, progress = 0) =>
    out.push({
      name,
      preset: {
        version: 1,
        source: { type: "front", ...front },
        passes: [
          { type: "sparks", tick: 0.18, fly: 0.01 },
          {
            type: "ordered",
            matrix: 4,
            centered: false,
            origin: "top",
            steps: [
              [0, 1],
              [1.5, 0],
              [2.5, 0],
              [3.5, 0],
            ],
          },
          { type: "palette", tones: TONES.slice(0, 5), transparent: [1] },
        ],
      },
      width: 120,
      height: 60,
      px: 1,
      time,
      progress,
      exact: false,
    });
  for (const [shape, direction] of [
    ["rect", "close"],
    ["rect", "open"],
    ["lobed", "open"],
    ["lobed", "close"],
  ] as const)
    for (const t of [0.7, 1.6])
      burnCase(`burn ${shape} ${direction} t=${t}`, { shape, direction, cycle: 3, hold: 0.5 }, t);
  burnCase(
    "burn rect close driven 0.4",
    { shape: "rect", direction: "close", driven: true },
    2.1,
    0.4,
  );
  burnCase(
    "burn lobed open driven 0.7",
    { shape: "lobed", direction: "open", driven: true },
    2.1,
    0.7,
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
        progress: c.progress ?? 0,
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
          progress: c.progress ?? 0,
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
