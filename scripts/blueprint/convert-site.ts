// The mechanical pass of the Blueprint conversion (docs/blueprint/engine.md, §2 and P1): every
// scene of the site's `SCENES` is sampled (`library/samples.ts`), the blocks every sample draws
// become the scene's static part in `apps/site/src/illustrations/library/<scene>.bp.json`, and
// `target/blueprint/convert-report.md` says what varies, which helper drew it, and what it still
// needs in P3. Run: bun scripts/blueprint/convert-site.ts
//
// The pass runs under Node, never Bun: the parity is defined against V8's Math (sin, cos, hypot
// can differ by an ulp under JavaScriptCore, which shifts a block's last bit). Started by Bun, the
// script bundles itself with rolldown and hands over to Node.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import type { Block } from "../../packages/blueprint/src";
import {
  blockKey,
  type Converted,
  convertScene,
  writeBlueprint,
} from "../../packages/blueprint/src/format";
import {
  evaluate,
  type Input,
  inputsOf,
  ROUTED,
  SCENE_NAMES,
  samplesOf,
} from "../../apps/site/src/illustrations/library/samples";

if (process.versions.bun) {
  const { build } = await import("rolldown");
  const bundle = "target/blueprint/convert-site.mjs";
  await build({
    input: "scripts/blueprint/convert-site.ts",
    platform: "node",
    external: ["rolldown"],
    output: { file: bundle, format: "esm" },
    logLevel: "warn",
  });
  const run = spawnSync("node", [bundle], { stdio: "inherit" });
  process.exit(run.status ?? 1);
}

const LIBRARY = "apps/site/src/illustrations/library";
const REPORT = "target/blueprint/convert-report.md";

// ── Which helper drew a block ───────────────────────────────────────────────

const KINDS = new Set(["box", "line", "dot", "label"]);
/** Helpers too small to say anything: the report names their caller. */
const TRIVIAL = new Set(["seg", "dot", "box", "block", "polyline", "push", "chip", "trace"]);

/** Frames that are plumbing, not a helper of the scene. */
const IGNORED = new Set(["map", "forEach", "flatMap", "evaluate", "framed", "<anonymous>", "new"]);

function callers(stack: string): string[] {
  const names: string[] = [];
  for (const line of stack.split("\n").slice(2)) {
    const m = /^\s*at (?:async )?([^\s(]+) \(/.exec(line);
    if (!m) continue;
    const name = m[1]!.replace(/^(Object|Array)\./, "").replace(/\$\d+$/, "");
    if (IGNORED.has(name)) continue;
    if (name === "attributed") break;
    names.push(name);
  }
  return names;
}

/** The blocks of one evaluation, each with the chain of helpers that pushed it (innermost first). */
function attributed(name: string, input: Input): Map<string, string> {
  const pushed: [object, string][] = [];
  const push = Array.prototype.push;
  Array.prototype.push = function (this: unknown[], ...items: unknown[]) {
    for (const item of items)
      if (item && typeof item === "object" && KINDS.has((item as { kind?: string }).kind ?? "")) {
        const chain = callers(new Error().stack ?? "");
        const first = chain.findIndex((n) => !TRIVIAL.has(n));
        const picked = first < 0 ? chain.slice(0, 1) : chain.slice(0, first + 1);
        pushed.push([item as object, picked.join(" ← ") || "(scene body)"]);
      }
    return push.apply(this, items);
  };
  try {
    evaluate(name, input);
  } finally {
    Array.prototype.push = push;
  }
  const byKey = new Map<string, string>();
  for (const [block, chain] of pushed) {
    const b = block as Block;
    byKey.set(blockKey(b), chain);
    if (b.kind === "line" && !b.decor) byKey.set(blockKey({ ...b, decor: true }), chain);
  }
  return byKey;
}

/** Varying blocks of a sample, counted by helper chain and kind. */
function varyingByHelper(name: string, input: Input, c: Converted): Map<string, number> {
  const chains = attributed(name, input);
  const blocks = evaluate(name, input);
  const left = new Map(c.counts);
  const out = new Map<string, number>();
  for (const b of blocks) {
    const key = blockKey(b);
    const n = left.get(key) ?? 0;
    if (n > 0) {
      left.set(key, n - 1);
      continue;
    }
    const label = `${chains.get(key) ?? "(scene body)"} · ${b.kind}`;
    out.set(label, (out.get(label) ?? 0) + 1);
  }
  return out;
}

// ── What a helper becomes in P3 ─────────────────────────────────────────────

const NEEDS: [RegExp, string][] = [
  [/\bwheel\b|\brim\b/, "`wheel` rig + `spin` track"],
  [/\barm\b/, "`arm` rig (target from a `path` or `key` track)"],
  [/\bfan\b/, "`fan` rig + `spin` track"],
  [/\bpiston\b/, "`piston` rig + `spin` track"],
  [/\bpendulum\b/, "`pendulum` rig + `key` track"],
  [/\brack\b|\bracks\b/, "`blink` tracks on the rack lights"],
  [/\btray\b/, "`conveyor` track"],
  [/smoke/i, "`smoke` rig"],
  [/spark|flame|fire/i, "`sparks` rig"],
  [/walker/i, "walkers: a stateful simulation (`stepWalkers`), script layer (not data in v1)"],
  [/person|people/i, "people: `path` tracks (a `key` track on the head for the step)"],
];

const SPECIAL: Record<string, string> = {
  stack6:
    "`spring` track (rate 9) on each plate's spread; `active` from the legend and the pointer",
  "erp-village":
    "`vars.progress` + a machine over the 14 `STEPS`; `camera.shots` from `FOCUS`; `camera.fit.box` from `FRAME`; the walkers are a stateful simulation (`simT`, `stepWalkers`): script layer",
  "production-line": '`vars.progress` driving a `path` timeline (`clock: "progress"`)',
  resources: "`vars.active` with `cycle: { every: 2, count: 9 }`",
  machine: "periods that never repeat: several `spin` tracks at incommensurate rates",
};

// ── Run ─────────────────────────────────────────────────────────────────────

mkdirSync(LIBRARY, { recursive: true });
// A scene converted by hand (P3: its file has timelines, vars or machines) is the by-hand pass's
// work: this pass reports it but never writes over it.
const byHand = new Set<string>();
for (const f of readdirSync(LIBRARY)) {
  if (!f.endsWith(".bp.json")) continue;
  const scenes = Object.values(
    (JSON.parse(readFileSync(`${LIBRARY}/${f}`, "utf8")) as { scenes?: Record<string, object> })
      .scenes ?? {},
  );
  if (scenes.some((s) => "timelines" in s || "vars" in s || "machines" in s))
    byHand.add(f.replace(/\.bp\.json$/, ""));
  else rmSync(`${LIBRARY}/${f}`);
}

const converted = new Map<string, Converted>();
const started = performance.now();
for (const name of SCENE_NAMES) {
  const c = convertScene(samplesOf(name), { name, prefix: "site" });
  converted.set(name, c);
  if (!byHand.has(name)) writeFileSync(`${LIBRARY}/${name}.bp.json`, writeBlueprint(c.file));
  const r = c.report;
  console.log(
    `${name.padEnd(18)} ${String(r.static).padStart(5)} static, ${r.varying[0]}–${r.varying[1]} varying, ${r.samples} samples${r.ordered ? "" : "  (static order differs between samples!)"}`,
  );
}
spawnSync("bunx", ["oxfmt", LIBRARY], { stdio: "inherit" });

const lines: string[] = [
  "# Blueprint conversion report (mechanical pass)",
  "",
  `Written by \`scripts/blueprint/convert-site.ts\`. Each scene of \`SCENES\` was drawn at the inputs of \`apps/site/src/illustrations/library/samples.ts\`; the blocks every sample draws are the static part in \`library/<scene>.bp.json\`, flattened back exactly by \`flatten\`. The rest varies and is listed by the helper that pushed it (sampled at the first, a middle and the last input), with what it needs in P3.`,
  "",
  "| Scene | Routed | Samples | Blocks | Static | Varying | Inputs | Static order stable |",
  "| --- | --- | ---: | ---: | ---: | ---: | --- | --- |",
];
for (const [name, c] of converted) {
  const r = c.report;
  lines.push(
    `| \`${name}\` | ${(ROUTED as readonly string[]).includes(name) ? "yes" : "no"} | ${r.samples} | ${r.blocks[0]}–${r.blocks[1]} | ${r.static} | ${r.varying[0]}–${r.varying[1]} | ${r.inputs.join(", ") || "none"} | ${r.ordered ? "yes" : "**no**"} |`,
  );
}
lines.push("");

for (const [name, c] of converted) {
  const r = c.report;
  lines.push(`## \`${name}\``, "");
  lines.push(
    `${r.static} static blocks of ${r.blocks[0]}–${r.blocks[1]}; varies with ${r.inputs.join(", ") || "nothing"}.`,
    "",
  );
  const inputs = inputsOf(name);
  const probes = [inputs[0]!, inputs[Math.floor(inputs.length / 2)]!, inputs[inputs.length - 1]!];
  const helpers = new Map<string, number>();
  for (const input of probes)
    for (const [label, n] of varyingByHelper(name, input, c))
      helpers.set(label, Math.max(helpers.get(label) ?? 0, n));
  if (helpers.size) {
    lines.push(
      "| Helper (innermost ← caller) · kind | Varying blocks (most in a probe) |",
      "| --- | ---: |",
    );
    for (const [label, n] of [...helpers].sort((a, b) => b[1] - a[1]))
      lines.push(`| \`${label}\` | ${n} |`);
    lines.push("");
  }
  const needs = new Set<string>();
  if (SPECIAL[name]) needs.add(SPECIAL[name]!);
  const unmatched = new Set<string>();
  for (const label of helpers.keys()) {
    const chain = label.split(" · ")[0]!;
    const found = NEEDS.filter(([re]) => re.test(chain));
    for (const [, need] of found) needs.add(need);
    if (found.length === 0) unmatched.add(chain.split(" ← ").at(-1)!);
  }
  if (unmatched.size && r.inputs.includes("t"))
    needs.add(
      `\`key\`, \`path\` or \`visible\` tracks (or the script layer) for what ${[...unmatched].map((n) => `\`${n}\``).join(", ")} moves`,
    );
  if (r.inputs.includes("active") && !SPECIAL[name])
    needs.add(
      "`vars.active` (int) and flag params bound to it (`look`, `ink`, `active` on labels)",
    );
  if (helpers.size === 0) needs.add("nothing: the scene is entirely static");
  lines.push("Still needs in P3:", "", ...[...needs].map((n) => `- ${n}`), "");
}

mkdirSync("target/blueprint", { recursive: true });
writeFileSync(REPORT, lines.join("\n"));
spawnSync("bunx", ["oxfmt", REPORT], { stdio: "inherit" });
console.log(
  `wrote ${converted.size} scenes to ${LIBRARY} and ${REPORT} in ${((performance.now() - started) / 1000).toFixed(1)} s`,
);
