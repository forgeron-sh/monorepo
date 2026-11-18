/**
 * Animated parity (docs/blueprint/engine.md, P3): every routed scene of the site, played by the
 * engine's player (one `frame` call per frame), equals the TypeScript reference (`test/reference/`,
 * today's renderer) buffer for buffer at t ∈ {0, 0.37, 1.7, 4.3, 9.2, 31.4} × the active sweep ×
 * progress ∈ {0, 0.05, …, 1} for the scroll scenes, at every size and with the options the page
 * mounts it with (`sizes.json`):
 *
 * - a scene converted by hand (its `.bp.json` has timelines) plays **from data**: a
 *   `BlueprintScene` against the reference drawing the scene function's blocks;
 * - every other scene plays on the **script layer**: its function's blocks packed into the
 *   engine's block buffer each frame (`ScriptScene`), against the reference drawing the same blocks.
 *
 * Stateful scenes (`stack6`'s spring, the village's walkers) are driven frame by frame by a fixed
 * sequence of dt = 1/60 from t = 0, and compared at the frames nearest the six times. The suite
 * writes `status.md` (data or script, parity) beside itself. Under Node only (P1 note 2).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import {
  evaluate,
  inputsOf,
  isScroll,
  ROUTED,
  sceneAtProgress,
} from "../../../../apps/site/src/illustrations/library/samples";
import type { Block, SceneFn } from "../../src/core/types";
import { createScene, createScriptScene } from "../../src/engine/scene";
import { readBlueprint } from "../../src/format/index";
import type { BlueprintFile } from "../../src/format/types";
import { fit as referenceFit } from "../reference/project";
import { render as referenceRender } from "../reference/render";
import { dither, pixelate } from "../../src/index";
import sizes from "./sizes.json";

const repo = new URL("../../../../", import.meta.url);
const TIMES = [0, 0.37, 1.7, 4.3, 9.2, 31.4];
const PROGRESS = Array.from({ length: 21 }, (_, i) => i / 20);
const STATEFUL = new Set(["stack6", "erp-village"]);
const DT = 1 / 60;
const KEYS = ["material", "ink", "tone", "color"] as const;
const FILTERS = [pixelate(2), dither({ matrix: 4 })];

interface Mount {
  page: string;
  options: { pixel: number; fill?: number; unit?: string; labels: boolean };
  sizes: [viewport: number, width: number, height: number][];
}
type Buffers = Record<(typeof KEYS)[number], ArrayLike<number>>;

const mountsOf = (name: string) => (sizes.scenes as unknown as Record<string, Mount[]>)[name] ?? [];

function differing(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let n = Math.abs(a.length - b.length);
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (!Object.is(a[i], b[i])) n++;
  return n;
}

/** "" when equal, else what differs. */
function compare(ref: Buffers, eng: Buffers): string {
  return KEYS.map((k) => [k, differing(ref[k], eng[k])] as const)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k}`)
    .join(", ");
}

function fileOf(name: string): BlueprintFile {
  return JSON.parse(
    readFileSync(new URL(`apps/site/src/illustrations/library/${name}.bp.json`, repo), "utf8"),
  ) as BlueprintFile;
}

const isData = (name: string) =>
  Object.values(fileOf(name).scenes ?? {}).some((s) => s.timelines !== undefined);

/** The actives a scene is swept over: those its samples use. */
const activesOf = (name: string) => [...new Set(inputsOf(name).map((i) => i.active))];

interface Result {
  mode: "data" | "script";
  cases: number;
  failures: string[];
}
const results = new Map<string, Result>();

const fitOf = (m: Mount) => ({
  ...(m.options.fill !== undefined ? { fill: m.options.fill } : {}),
  ...(m.options.unit === "any" ? { unit: "any" as const } : {}),
});

/** Plays a scene function on the script layer at one size; compares at each requested frame. */
function scriptCases(
  name: string,
  m: Mount,
  width: number,
  height: number,
  record: (label: string, diff: string) => void,
): void {
  const [w, h] = [Math.floor(width / 2), Math.floor(height / 2)];
  const fitOptions = fitOf(m);
  const probe = evaluate(name, { t: 0, active: 0 });
  const view = referenceFit(probe, w, h, fitOptions);
  const progresses = isScroll(name) ? PROGRESS : [0];
  const actives = activesOf(name);
  let drawn: readonly Block[] = [];
  const capture =
    (fn: SceneFn): SceneFn =>
    (f) => {
      const s = fn(f);
      drawn = s.blocks;
      return s;
    };
  const scene = createScriptScene(capture(sceneAtProgress(name, 0)), {
    ...fitOptions,
    labels: m.options.labels,
  });
  scene.shading(4, null);
  scene.resize(w, h);
  record("fit", JSON.stringify(scene.view) === JSON.stringify(view) ? "" : "the fit differs");
  const check = (t: number, active: number, progress: number) => {
    const ref = referenceRender(
      { blocks: drawn },
      { width, height, filters: FILTERS, labels: m.options.labels, view },
    ).frame;
    record(`t=${t} a=${active} p=${progress}`, compare(ref, scene.snapshot()));
  };
  if (STATEFUL.has(name)) {
    // A fixed dt sequence from t = 0 per active; the scroll sweep at each compared frame.
    const at = new Set(TIMES.map((t) => Math.round(t / DT)));
    const last = Math.max(...at);
    for (const active of actives) {
      if (name === "erp-village" && active !== actives[0]) break;
      scene.set("active", active);
      const fn = sceneAtProgress(name, 0);
      for (let k = 0; k <= last; k++) {
        const t = k * DT;
        if (!at.has(k)) {
          fn({ t, active });
          continue;
        }
        for (const p of progresses) {
          scene.update(capture(sceneAtProgress(name, p)));
          scene.frame(t, DT);
          check(t, active, p);
        }
      }
    }
  } else
    for (const p of progresses) {
      scene.update(capture(sceneAtProgress(name, p)));
      for (const active of actives) {
        scene.set("active", active);
        for (const t of TIMES) {
          scene.frame(t, DT);
          check(t, active, p);
        }
      }
    }
  scene.dispose();
}

describe("animated parity under Node", () => {
  it("runs under Node, not Bun", () => {
    expect((process.versions as { bun?: string }).bun).toBeUndefined();
  });
});

describe.each(ROUTED)("%s", (name) => {
  const mounts = mountsOf(name);
  const data = isData(name);

  it("plays its animated frames as today", async () => {
    const result: Result = { mode: data ? "data" : "script", cases: 0, failures: [] };
    results.set(name, result);
    const record = (where: string) => (label: string, diff: string) => {
      result.cases++;
      if (diff) result.failures.push(`${where} ${label}: ${diff}`);
    };
    if (!data) {
      for (const m of mounts)
        for (const [viewport, width, height] of m.sizes)
          scriptCases(name, m, width, height, record(`${m.page || "/"} ${viewport}`));
    } else {
      const lib = await readBlueprint(fileOf(name), { location: `${name}.bp.json` });
      for (const m of mounts) {
        const fitOptions = fitOf(m);
        const scene = createScene(lib, name, { ...fitOptions, labels: m.options.labels });
        for (const [viewport, width, height] of m.sizes) {
          const [w, h] = [Math.floor(width / 2), Math.floor(height / 2)];
          scene.resize(w, h);
          const view = referenceFit(evaluate(name, { t: 0, active: 0 }), w, h, fitOptions);
          const rec = record(`${m.page || "/"} ${viewport}`);
          rec("fit", JSON.stringify(scene.view) === JSON.stringify(view) ? "" : "the fit differs");
          for (const active of activesOf(name)) {
            if (scene.scope.includes("active")) scene.set("active", active);
            let last = 0;
            for (const t of TIMES) {
              scene.frame(t, t - last);
              last = t;
              const blocks = evaluate(name, { t, active });
              const ref = referenceRender(
                { blocks },
                { width, height, filters: FILTERS, labels: m.options.labels, view },
              ).frame;
              rec(`t=${t} a=${active}`, compare(ref, scene.snapshot()));
            }
          }
        }
        scene.dispose();
      }
    }
    console.log(
      `${name}: ${result.mode}, ${result.cases} cases, ${result.failures.length ? `${result.failures.length} differ` : "all equal"}`,
    );
    expect(result.cases).toBeGreaterThan(0);
    expect(result.failures.slice(0, 10)).toEqual([]);
  });
});

afterAll(() => {
  if (results.size < ROUTED.length) return; // a filtered run: keep the table as it is
  const cells = [
    ["Scene", "Plays from", "Cases", "Parity"],
    ...ROUTED.map((name) => {
      const r = results.get(name)!;
      const status = r.failures.length === 0 ? "equal" : `${r.failures.length} differ`;
      return [`\`${name}\``, r.mode, String(r.cases), status];
    }),
  ];
  // Padded as oxfmt writes a table, so that the file stays formatted.
  const widths = [0, 1, 2, 3].map((c) => Math.max(...cells.map((row) => row[c]!.length)));
  const line = (row: string[]) =>
    `| ${row.map((v, c) => (c === 2 ? v.padStart(widths[c]!) : v.padEnd(widths[c]!))).join(" | ")} |`;
  const rule = `| ${widths.map((w, c) => (c === 2 ? `${"-".repeat(w - 1)}:` : "-".repeat(w))).join(" | ")} |`;
  const rows = [line(cells[0]!), rule, ...cells.slice(1).map(line)];
  const data = ROUTED.filter((n) => results.get(n)!.mode === "data").length;
  const equal = ROUTED.filter((n) => results.get(n)!.failures.length === 0).length;
  const cases = ROUTED.reduce((n, s) => n + results.get(s)!.cases, 0);
  writeFileSync(
    new URL("status.md", import.meta.url),
    [
      "# Blueprint parity status",
      "",
      "Written by `animated.test.ts` (docs/blueprint/engine.md, P3): each routed scene of the site, how the engine plays it, and whether its animated frames equal the TypeScript reference (`material`, `ink`, `tone`, `color`, exact). **data**: the scene's `.bp.json` (converted by hand, `scripts/blueprint/by-hand.ts`) with its timelines; **script**: the scene function on the script layer, its blocks rasterised by the engine. A scene enters the data column only when it passes.",
      "",
      `${ROUTED.length} scenes: ${data} from data, ${ROUTED.length - data} on the script layer; ${equal} equal over ${cases} cases.`,
      "",
      ...rows,
      "",
    ].join("\n"),
  );
});
