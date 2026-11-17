import { describe, expect, it } from "vitest";
import {
  box,
  dither,
  floorGrid,
  glow,
  grid,
  label,
  line,
  Material,
  palette,
  pixelate,
  plan,
  render,
  renderSvg,
  Slot,
} from "../index";
import { bayer, matrix } from "./bayer";
import { placeLabels } from "./draw";
import { createFrame } from "./frame";
import { paint, parseColor, resolvePalette } from "./palette";
import { fit, project } from "./project";
import { fillConvex, stroke } from "./raster";

/** Pixels of `material`, grouped by row: the x of each. */
function rows(frame: ReturnType<typeof createFrame>, keep: (i: number) => boolean) {
  const out = new Map<number, number[]>();
  for (let y = 0; y < frame.height; y++)
    for (let x = 0; x < frame.width; x++)
      if (keep(y * frame.width + x)) out.set(y, [...(out.get(y) ?? []), x]);
  return out;
}

describe("bayer", () => {
  it("produces the 4×4 table of the lab engine and the 8×8 table of pixel.ts", () => {
    expect([...matrix(4)]).toEqual([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]);
    expect([...matrix(8)].slice(0, 16)).toEqual([
      0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
    ]);
    expect([...matrix(8)].slice(-8)).toEqual([63, 31, 55, 23, 61, 29, 53, 21]);
  });

  it("gives thresholds strictly inside (0, 1), tiled", () => {
    for (const n of [2, 4, 8] as const) {
      const seen = new Set<number>();
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) seen.add(bayer(x, y, n));
      expect(seen.size).toBe(n * n);
      expect(Math.min(...seen)).toBeGreaterThan(0);
      expect(Math.max(...seen)).toBeLessThan(1);
      expect(bayer(n + 1, n + 2, n)).toBe(bayer(1, 2, n));
    }
  });
});

describe("projection and fit", () => {
  it("projects iso 2:1: one unit along x is u across and u/2 down", () => {
    const view = { u: 4, ox: 10, oy: 20 };
    expect(project([0, 0, 0], view)).toEqual([10, 20]);
    expect(project([1, 0, 0], view)).toEqual([14, 22]);
    expect(project([0, 1, 0], view)).toEqual([6, 22]);
    expect(project([0, 0, 1], view)).toEqual([10, 16]);
  });

  it("picks the largest even unit that fits and centres the scene", () => {
    const blocks = [box([0, 0, 0], [10, 10, 10])];
    // At u = 1 the cube spans 20 across and 20 down.
    const view = fit(blocks, 200, 100, { fill: 1 });
    expect(view.u).toBe(4); // min(200 / 20, 100 / 20) = 5, rounded down to even
    const top = project([0, 0, 10], view);
    const bottom = project([10, 10, 0], view);
    expect((top[1] + bottom[1]) / 2).toBe(50);
    expect(fit(blocks, 200, 100, { fill: 1, unit: "any" }).u).toBe(5);
  });

  it("never goes below 2 and ignores decor blocks", () => {
    expect(fit([box([0, 0, 0], [100, 100, 100])], 50, 50).u).toBe(2);
    const framed = fit([box([0, 0, 0], [4, 4, 4])], 300, 300);
    const withGrid = fit([box([0, 0, 0], [4, 4, 4]), ...floorGrid(-50, 50, -50, 50, 5)], 300, 300);
    expect(withGrid).toEqual(framed);
  });
});

describe("rasteriser", () => {
  it("draws a 2:1 edge as runs of exactly two pixels per row", () => {
    const f = createFrame(64, 64);
    const view = { u: 4, ox: 4, oy: 4 };
    stroke(f, project([0, 0, 0], view), project([10, 0, 0], view), Material.Edge, Slot.Ink);
    const byRow = rows(f, (i) => f.material[i] === Material.Edge);
    // 40 across, 20 down: 21 rows; Bresenham's ends hold one pixel, every row between holds two.
    expect(byRow.size).toBe(21);
    const widths = [...byRow.values()].map((xs) => xs.length);
    expect(widths.slice(1, -1).every((w) => w === 2)).toBe(true);
  });

  it("draws the same pixels whichever end a line starts from (shared edges stay thin)", () => {
    const view = { u: 4, ox: 30, oy: 4 };
    const a = project([0, 0, 0], view);
    const b = project([0, 7, 0], view);
    const one = createFrame(64, 64);
    const two = createFrame(64, 64);
    stroke(one, a, b, Material.Edge, Slot.Ink);
    stroke(two, b, a, Material.Edge, Slot.Ink);
    expect([...two.material]).toEqual([...one.material]);
  });

  it("fills a convex polygon with its material, ink and tone, and nothing outside", () => {
    const f = createFrame(10, 10);
    fillConvex(
      f,
      [
        [2, 2],
        [8, 2],
        [8, 8],
        [2, 8],
      ],
      Material.FaceTop,
      Slot.Dim,
      0.3,
    );
    expect(f.material[5 * 10 + 5]).toBe(Material.FaceTop);
    expect(f.tone[5 * 10 + 5]).toBeCloseTo(0.3);
    expect(f.material[0]).toBe(Material.Empty);
    expect(f.material[9 * 10 + 9]).toBe(Material.Empty);
  });

  it("writes no colour: shading is left to the filters", () => {
    const { frame } = render({ blocks: [box([0, 0, 0], [4, 4, 4])] }, { width: 80, height: 80 });
    const faces = [Material.FaceTop, Material.FaceLeft, Material.FaceRight] as number[];
    const tones = new Set<number>();
    frame.material.forEach((m, i) => {
      if (faces.includes(m)) tones.add(Math.round((frame.tone[i] ?? 0) * 100));
    });
    expect([...tones].sort((a, b) => a - b)).toEqual([6, 20, 42]);
  });
});

describe("filter chain", () => {
  it("validates order and duplicates, with messages that name the filter", () => {
    expect(() => plan([dither(), pixelate(3)])).toThrow(/pixelate.*too late/);
    expect(() => plan([dither(), dither()])).toThrow(/dither.*twice/);
    expect(() => plan([pixelate(1.5)])).toThrow(/whole number/);
    expect(() => plan([{ type: "blur" } as never])).toThrow(/Unknown filter "blur"/);
  });

  it("is data: a chain survives JSON", () => {
    const chain = [pixelate(3), dither({ matrix: 8 }), glow(), palette({ accent: "#fff" }), grid()];
    expect(plan(JSON.parse(JSON.stringify(chain)))).toEqual(plan(chain));
  });

  it("hoists pixelate into the raster resolution instead of resampling", () => {
    const scene = { blocks: [box([0, 0, 0], [4, 4, 4])] };
    const r = render(scene, { width: 300, height: 200, filters: [pixelate(3)] });
    expect([r.frame.width, r.frame.height]).toEqual([100, 66]);
    expect(r.view.u % 2).toBe(0);
  });

  it("dithers faces and never an edge, a detail, a dot or a letter", () => {
    const scene = {
      blocks: [
        box([0, 0, 0], [8, 8, 8], { tone: [0.5, 0.5, 0.5], floors: 2, vents: true, plate: true }),
        label([4, 4, 14], "Forge", { to: [4, 4, 8] }),
      ],
    };
    const { frame } = render(scene, { width: 240, height: 240, filters: [pixelate(2), dither()] });
    let faces = 0;
    let lit = 0;
    let wrong = 0;
    for (let i = 0; i < frame.material.length; i++) {
      const m = frame.material[i] ?? 0;
      if (m === Material.FaceTop || m === Material.FaceLeft || m === Material.FaceRight) {
        faces++;
        if (frame.color[i] === frame.ink[i]) lit++;
        else if (frame.color[i] !== Slot.Bg) wrong++;
      } else if (m !== Material.Empty && frame.color[i] !== frame.ink[i]) wrong++;
    }
    expect(wrong).toBe(0);
    expect(faces).toBeGreaterThan(100);
    expect(lit / faces).toBeGreaterThan(0.4);
    expect(lit / faces).toBeLessThan(0.6);
  });

  it("shades faces flat without a dither", () => {
    const scene = { blocks: [box([0, 0, 0], [8, 8, 8], { tone: [0.2, 0.2, 0.7] })] };
    const { frame } = render(scene, { width: 120, height: 120 });
    const colorsOf = (material: number) =>
      new Set(
        [...frame.material.keys()]
          .filter((i) => frame.material[i] === material)
          .map((i) => frame.color[i]),
      );
    expect([...colorsOf(Material.FaceTop)]).toEqual([Slot.Bg]);
    expect([...colorsOf(Material.FaceRight)]).toEqual([Slot.Dim]);
  });

  it("glows around accent pixels, in accent, sparser further, never over a label", () => {
    const scene = {
      blocks: [line([0, 0, 0], [6, 0, 0], { ink: "accent" }), label([20, 20, 0], "AB")],
    };
    const base = render(scene, { width: 160, height: 160, filters: [pixelate(2)] });
    const lit = render(scene, {
      width: 160,
      height: 160,
      filters: [pixelate(2), glow({ density: 1 })],
    });
    const count = (c: Uint8Array) => c.filter((s) => s === Slot.Accent).length;
    expect(count(lit.frame.color)).toBeGreaterThan(count(base.frame.color));
    const fills = [...lit.frame.material.keys()].filter(
      (i) => lit.frame.material[i] === Material.LabelFill,
    );
    expect(fills.length).toBeGreaterThan(0);
    expect(new Set(fills.map((i) => lit.frame.color[i]))).toEqual(new Set([Slot.Bg]));
  });
});

describe("palette", () => {
  it("parses hex and rgb() colours", () => {
    expect(parseColor("#fff")).toEqual([255, 255, 255]);
    expect(parseColor(" #ff4f1f ")).toEqual([255, 79, 31]);
    expect(parseColor("rgb(1, 2, 3)")).toEqual([1, 2, 3]);
    expect(parseColor("rgb(1 2 3 / 50%)")).toEqual([1, 2, 3]);
    expect(parseColor("oklch(0.5 0.1 30)")).toBeNull();
  });

  it("resolves variables, falling back when missing or unparsable", () => {
    const p = plan([palette({ ink: "#010203" })]);
    const vars: Record<string, string> = { "--accent": "#00ff00", "--bg": "oklch(0 0 0)" };
    const colors = resolvePalette(p.colors, (name) => vars[name]);
    expect(colors.ink).toEqual([1, 2, 3]);
    expect(colors.accent).toEqual([0, 255, 0]);
    expect(colors.bg).toEqual([10, 10, 10]);
  });

  it("paints slots to RGBA, transparent where nothing was drawn", () => {
    const { frame } = render({ blocks: [box([0, 0, 0], [4, 4, 4])] }, { width: 60, height: 60 });
    const rgba = paint(frame, resolvePalette(plan().colors));
    const empty = frame.color.indexOf(Slot.None);
    const ink = frame.color.indexOf(Slot.Ink);
    expect(rgba[empty * 4 + 3]).toBe(0);
    expect([...rgba.slice(ink * 4, ink * 4 + 4)]).toEqual([237, 237, 237, 255]);
  });
});

describe("svg", () => {
  const scene = { blocks: [box([0, 0, 0], [4, 4, 4], { accent: true }), label([2, 2, 8], "a<b")] };

  it("writes one path per slot, colours as CSS variables, the raster as viewBox", () => {
    const svg = renderSvg(scene, {
      width: 120,
      height: 90,
      filters: [pixelate(3)],
      title: "A & B",
    });
    expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 40 30"/);
    expect(svg).toContain('fill="var(--accent, #ff4f1f)"');
    expect(svg).toContain("<title>A &amp; B</title>");
    expect(svg).toContain('role="img"');
    expect(svg.match(/<path /g)?.length).toBeLessThanOrEqual(6);
    expect(renderSvg(scene, { width: 120, height: 90, filters: [pixelate(3)] })).toContain(
      'aria-hidden="true"',
    );
  });

  it("is deterministic and follows a literal palette", () => {
    const opts = { width: 120, height: 90, filters: [pixelate(3), palette({ accent: "#123456" })] };
    expect(renderSvg(scene, opts)).toBe(renderSvg(scene, opts));
    expect(renderSvg(scene, opts)).toContain('fill="#123456"');
  });

  it("draws each pixel smaller than its cell under a grid, with the canvas's whole-pixel gap", () => {
    const svg = renderSvg(scene, { width: 120, height: 90, filters: [pixelate(5), grid()] });
    // floor(5 × 0.84) = 4 pixels drawn out of 5.
    expect(svg).toContain("h0.8v0.8h-0.8z");
  });
});

describe("label placement", () => {
  const view = { u: 4, ox: 50, oy: 40 };
  const disjoint = (a: { x0: number; y0: number; x1: number; y1: number }, b: typeof a) =>
    a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0;

  it("keeps every plate inside the raster, near an edge included", () => {
    const labels = [
      label([-30, 0, 0], "Left edge"),
      label([0, 0, 20], "Top"),
      label([30, 30, 0], "Corner"),
    ];
    const plates = placeLabels(labels, view, 100, 80);
    for (const r of plates) {
      expect(r).not.toBeNull();
      if (!r) continue;
      expect(r.x0).toBeGreaterThanOrEqual(0);
      expect(r.y0).toBeGreaterThanOrEqual(0);
      expect(r.x1).toBeLessThanOrEqual(99);
      expect(r.y1).toBeLessThanOrEqual(79);
    }
  });

  it("never lets two plates touch: the later one moves up past the earlier one", () => {
    const labels = [
      label([5, 5, 2], "Repository"),
      label([5, 5, 2], "Preview"),
      label([6, 5, 2], "Production"),
    ];
    const plates = placeLabels(labels, view, 200, 160);
    expect(plates.every((r) => r !== null)).toBe(true);
    for (let i = 0; i < plates.length; i++)
      for (let j = i + 1; j < plates.length; j++)
        expect(disjoint(plates[i]!, plates[j]!)).toBe(true);
    expect(plates[1]!.y1).toBeLessThan(plates[0]!.y0);
  });

  it("rises off the drawing: a plate covers no pixel of a box under its anchor", () => {
    const scene = {
      blocks: [box([0, 0, 0], [8, 8, 6]), label([4, 4, 7], "Tool", { to: [4, 4, 6] })],
    };
    const { frame } = render(scene, { width: 120, height: 120 });
    const boxPixels = new Set<number>();
    const bare = render({ blocks: [scene.blocks[0]!] }, { width: 120, height: 120 }).frame;
    bare.material.forEach((m, i) => m !== Material.Empty && boxPixels.add(i));
    let covered = 0;
    frame.material.forEach((m, i) => {
      if (
        (m === Material.LabelFill || m === Material.LabelFrame || m === Material.LabelText) &&
        boxPixels.has(i)
      )
        covered++;
    });
    expect(covered).toBe(0);
  });

  it("leaves out a label that cannot be placed rather than drawing it over another", () => {
    const labels = [label([0, 0, 0], "Wide label"), label([0, 0, 0], "Wide label")];
    const plates = placeLabels(labels, { u: 2, ox: 40, oy: 8 }, 80, 16);
    expect(plates[0]).not.toBeNull();
    expect(plates[1]).toBeNull();
  });

  it("draws whole plates: as many frame pixels as the perimeter of each placed plate", () => {
    const scene = {
      blocks: [box([0, 0, 0], [6, 6, 2]), label([0, 0, 2], "Edge", { to: [0, 0, 2] })],
    };
    const { frame, view: v } = render(scene, { width: 60, height: 40 });
    const [r] = placeLabels([scene.blocks[1] as never], v, frame.width, frame.height);
    expect(r).toBeTruthy();
    const frameCount = frame.material.filter((m) => m === Material.LabelFrame).length;
    expect(frameCount).toBe(2 * (r!.x1 - r!.x0) + 2 * (r!.y1 - r!.y0));
  });
});
