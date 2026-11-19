/**
 * Animated parity (docs/blueprint/engine.md, P3, frozen in P4): every routed scene of the site,
 * played by the engine's player (one `frame` call per frame), gives the frames of `golden.json`
 * (those that equalled the TypeScript reference buffer for buffer until P4 deleted it) at
 * t ∈ {0, 0.37, 1.7, 4.3, 9.2, 31.4} × the active sweep × progress ∈ {0, 0.05, …, 1} for the
 * scroll scenes, at every size and with the options the page mounts it with (`sizes.json`):
 *
 * - a scene converted by hand (its `.bp` has timelines) plays **from data** (`BlueprintScene`);
 * - every other scene plays on the **script layer**: its function's blocks packed into the
 *   engine's block buffer each frame (`ScriptScene`).
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
import type { Frame } from "../../src/core/frame";
import type { SceneFn } from "../../src/core/types";
import { createScene, createScriptScene, type ScriptScene } from "../../src/engine/scene";
import { type Library, readBlueprint } from "../../src/format/index";
import type { BlueprintFile } from "../../src/format/types";
import { fit } from "../../src/index";
import { golden } from "./golden";
import sizes from "./sizes.json";

const repo = new URL("../../../../", import.meta.url);
const TIMES = [0, 0.37, 1.7, 4.3, 9.2, 31.4];
const PROGRESS = Array.from({ length: 21 }, (_, i) => i / 20);
const STATEFUL = new Set(["stack6", "erp-village"]);
const DT = 1 / 60;
const frozen = golden("animated");

interface Mount {
  page: string;
  options: { pixel: number; fill?: number; unit?: string; labels: boolean };
  sizes: [viewport: number, width: number, height: number][];
}

const mountsOf = (name: string) => (sizes.scenes as unknown as Record<string, Mount[]>)[name] ?? [];

function fileOf(name: string): BlueprintFile {
  return JSON.parse(
    readFileSync(new URL(`apps/site/src/illustrations/library/${name}.bp`, repo), "utf8"),
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

/**
 * Plays a scene function on the script layer at one size; compares at each requested frame. With
 * `control` (the site's control file of a scroll or hover scene), the function is the script
 * layer of that data scene, as the site plays it (P4).
 */
function scriptCases(
  name: string,
  m: Mount,
  width: number,
  height: number,
  record: (label: string, frame: Frame | string) => void,
  control?: Library,
): void {
  const [w, h] = [Math.floor(width / 2), Math.floor(height / 2)];
  const fitOptions = fitOf(m);
  const probe = evaluate(name, { t: 0, active: 0 });
  const view = fit(probe, w, h, fitOptions);
  const progresses = isScroll(name) ? PROGRESS : [0];
  const actives = activesOf(name);
  const options = { ...fitOptions, labels: m.options.labels };
  const hybrid = control ? createScene(control, name, options) : null;
  const scene = hybrid ?? createScriptScene(sceneAtProgress(name, 0), options);
  const use = (fn: SceneFn) => (hybrid ? hybrid.script(fn) : (scene as ScriptScene).update(fn));
  const setActive = (active: number) => {
    if (!hybrid || hybrid.scope.includes("active")) scene.set("active", active);
  };
  use(sceneAtProgress(name, 0));
  scene.shading(4, null);
  scene.resize(w, h);
  record("fit", JSON.stringify(scene.view) === JSON.stringify(view) ? "" : "the fit differs");
  const check = (t: number, active: number, progress: number) =>
    record(`t=${t} a=${active} p=${progress}`, scene.snapshot());
  if (STATEFUL.has(name)) {
    // A fixed dt sequence from t = 0 per active; the scroll sweep at each compared frame.
    const at = new Set(TIMES.map((t) => Math.round(t / DT)));
    const last = Math.max(...at);
    for (const active of actives) {
      if (name === "erp-village" && active !== actives[0]) break;
      setActive(active);
      const fn = sceneAtProgress(name, 0);
      for (let k = 0; k <= last; k++) {
        const t = k * DT;
        if (!at.has(k)) {
          fn({ t, active });
          continue;
        }
        for (const p of progresses) {
          use(sceneAtProgress(name, p));
          scene.frame(t, DT);
          check(t, active, p);
        }
      }
    }
  } else
    for (const p of progresses) {
      use(sceneAtProgress(name, p));
      for (const active of actives) {
        setActive(active);
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
    // A frame is checked against golden.json; a string is a failure of its own ("" for none).
    const record = (where: string) => (label: string, got: Frame | string) => {
      result.cases++;
      const diff = typeof got === "string" ? got : frozen.check(`${name} ${where} ${label}`, got);
      if (diff) result.failures.push(`${where} ${label}: ${diff}`);
    };
    if (!data) {
      for (const m of mounts)
        for (const [viewport, width, height] of m.sizes)
          scriptCases(
            name,
            m,
            width,
            height,
            record(`${m.page || "/"} f${m.options.fill ?? "-"} ${viewport}`),
          );
    } else {
      const lib = await readBlueprint(fileOf(name), { location: `${name}.bp` });
      for (const m of mounts) {
        const fitOptions = fitOf(m);
        const scene = createScene(lib, name, { ...fitOptions, labels: m.options.labels });
        for (const [viewport, width, height] of m.sizes) {
          const [w, h] = [Math.floor(width / 2), Math.floor(height / 2)];
          scene.resize(w, h);
          const view = fit(evaluate(name, { t: 0, active: 0 }), w, h, fitOptions);
          const rec = record(`${m.page || "/"} f${m.options.fill ?? "-"} ${viewport}`);
          rec("fit", JSON.stringify(scene.view) === JSON.stringify(view) ? "" : "the fit differs");
          // A scroll scene sweeps its progress at each time; a stateful one is compared at the
          // frames of the script layer's fixed dt sequence (the same case names).
          const times = STATEFUL.has(name) ? TIMES.map((t) => Math.round(t / DT) * DT) : TIMES;
          const progresses = isScroll(name) ? PROGRESS : [undefined];
          for (const active of activesOf(name)) {
            if (scene.scope.includes("active")) scene.set("active", active);
            let last = 0;
            for (const t of times)
              for (const p of progresses) {
                if (p !== undefined) scene.set("progress", p);
                scene.frame(t, t - last);
                last = t;
                rec(`t=${t} a=${active}${p === undefined ? "" : ` p=${p}`}`, scene.snapshot());
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

// The site's control files (P4): the scroll and hover scenes play their function as the script
// layer of a data scene with their vars and machines. Same frames as the script layer. The
// village is left out: its walkers keep the history of every frame drawn before (P1 note 8), so
// a second run cannot start from the state the first run started from.
describe.each(["production-line", "resources", "stack6"])("%s from its control file", (name) => {
  it("plays the frames of the script layer", async () => {
    const file = JSON.parse(
      readFileSync(new URL(`apps/site/src/illustrations/library/control/${name}.bp`, repo), "utf8"),
    ) as BlueprintFile;
    const control = await readBlueprint(file, { location: `${name}.bp` });
    const failures: string[] = [];
    let cases = 0;
    for (const m of mountsOf(name))
      for (const [viewport, width, height] of m.sizes) {
        const where = `${m.page || "/"} f${m.options.fill ?? "-"} ${viewport}`;
        const record = (label: string, got: Frame | string) => {
          cases++;
          const diff =
            typeof got === "string" ? got : frozen.check(`${name} ${where} ${label}`, got);
          if (diff) failures.push(`${where} ${label}: ${diff}`);
        };
        scriptCases(name, m, width, height, record, control);
      }
    console.log(
      `${name} from its control file: ${cases} cases, ${failures.length || "all"} ${failures.length ? "differ" : "equal"}`,
    );
    expect(cases).toBeGreaterThan(0);
    expect(failures.slice(0, 10)).toEqual([]);
  });
});

describe("golden.json", () => {
  it("has every frozen case drawn", () => {
    if (results.size < ROUTED.length) return; // a filtered run
    expect(frozen.missing()).toEqual([]);
  });
});

afterAll(() => {
  frozen.save();
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
      "Written by `animated.test.ts` (docs/blueprint/engine.md, P3): each routed scene of the site, how the engine plays it, and whether its animated frames equal the frozen ones of `golden.json` (`material`, `ink`, `tone`, `color`, exact; frozen in P4 from frames equal to the TypeScript reference). **data**: the scene's `.bp` (converted by hand, `scripts/blueprint/by-hand.ts`) with its timelines; **script**: the scene function on the script layer, its blocks rasterised by the engine. A scene enters the data column only when it passes.",
      "",
      `${ROUTED.length} scenes: ${data} from data, ${ROUTED.length - data} on the script layer; ${equal} equal over ${cases} cases.`,
      "",
      ...rows,
      "",
    ].join("\n"),
  );
});
