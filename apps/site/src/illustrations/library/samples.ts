/**
 * The inputs at which the mechanical converter (`scripts/blueprint/convert-site.ts`) and its test
 * evaluate each scene of `SCENES`: a block that every sample draws is static and goes into the
 * scene's `.bp.json`; the rest is left to the by-hand pass (docs/blueprint/engine.md, P3).
 *
 * Both walk the samples in the same order from a fresh module, so the scenes that keep state
 * between frames (the village's walkers, `stack6`'s spring) see the same history. Each sample is
 * drawn twice and the second picture kept: `stack6` then sits at its target, whatever came before.
 */
import type { Block } from "@forgeron/blueprint";
import type { Sample } from "@forgeron/blueprint/format";
import { lineStore } from "../objects";
import { SCENES } from "../scenes";
import { villageStore } from "../village";

/** The routed scenes (the parity list of docs/blueprint/engine.md §1); the rest are explorations. */
export const ROUTED = [
  "erp-village",
  "stack6",
  "resources",
  "production-line",
  "web",
  "mcp",
  "cli",
  "api",
  "badge-gate",
  "dashboard",
  "ledger",
  "usage-iso",
  "ai-gateway",
  "safe",
  "permissions-iso",
  "market",
  "approval-plug",
  "host-cloud",
  "host-self",
  "host-servers",
  "isolated",
  "bolt",
  "drawer",
  "fuel-month",
  "fuel-topup",
  "fuel-pool",
  "forge-cta",
  "machine",
] as const;

/** Times: the parity suite's six, then a spread over 30 s that no blink period divides. */
const T = [0, 0.37, 1.7, 4.3, 9.2, 31.4, ...Array.from({ length: 10 }, (_, i) => 0.11 + i * 2.93)];
/** Fewer times for the scroll scenes, which also sweep their progress. */
const T_SCROLL = [0, 0.37, 1.7, 4.3, 9.2, 31.4];
const ACTIVE = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const PROGRESS = Array.from({ length: 33 }, (_, i) => i / 32);

/** The scenes driven by a scroll progress, and the module store the page writes it into. */
const STORES: Record<string, { progress: number }> = {
  "erp-village": villageStore,
  "production-line": lineStore,
};

export interface Input {
  t: number;
  active: number;
  progress?: number;
}

/** The blocks of a scene at one input (drawn twice, the second kept). */
export function evaluate(name: string, input: Input): readonly Block[] {
  const scene = SCENES[name];
  if (!scene) throw new Error(`no scene "${name}"`);
  const store = STORES[name];
  if (store) store.progress = input.progress ?? 0;
  try {
    scene({ t: input.t, active: input.active });
    return scene({ t: input.t, active: input.active }).blocks;
  } finally {
    if (store) store.progress = 0;
  }
}

const same = (a: readonly Block[], b: readonly Block[]) => JSON.stringify(a) === JSON.stringify(b);

/** Whether `active` changes the picture, probed at two times. */
function usesActive(name: string): boolean {
  return [0, 1.7].some((t) => {
    const base = evaluate(name, { t, active: -1 });
    return ACTIVE.some((active) => !same(evaluate(name, { t, active }), base));
  });
}

/** The inputs a scene is sampled at, first one first (it orders the static part). */
export function inputsOf(name: string): Input[] {
  if (STORES[name])
    return PROGRESS.flatMap((progress) => T_SCROLL.map((t) => ({ t, active: -1, progress })));
  const actives = usesActive(name) ? ACTIVE : [-1];
  return T.flatMap((t) => actives.map((active) => ({ t, active })));
}

/** Every sample of a scene, in order. */
export function samplesOf(name: string): Sample[] {
  return inputsOf(name).map((input) => ({
    input: { ...input },
    blocks: evaluate(name, input),
  }));
}

export const SCENE_NAMES = Object.keys(SCENES);
