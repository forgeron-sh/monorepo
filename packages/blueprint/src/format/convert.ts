/**
 * The mechanical converter: a scene function sampled at many inputs becomes a file whose one part
 * holds the blocks that never change, with the exact float64 values the code produced. What
 * changes is counted and left to the by-hand pass (rigs, tracks: P3).
 *
 * Blocks are compared as values after `normalizeBlock`: a `false` flag is the same as an absent
 * one and -0 is 0, the two differences no renderer can see and JSON cannot keep.
 */
import { BlueprintError } from "../core/blocks";
import type { Block, FitOptions, Vec3 } from "../core/types";
import {
  type BlueprintFile,
  type BoxLook,
  type BoxPrim,
  type Camera,
  type Prim,
  SCHEMA_URL,
  type Var,
} from "./types";

const z = (x: number) => (x === 0 ? 0 : x);
const v3 = (v: Vec3): Vec3 => [z(v[0]), z(v[1]), z(v[2])];

/** A block without `false` or `undefined` values, with -0 written 0. */
export function normalizeBlock(block: Block): Block {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(block)) {
    if (value === false || value === undefined) continue;
    if (typeof value === "number") out[key] = z(value);
    else if (Array.isArray(value)) out[key] = v3(value as unknown as Vec3);
    else out[key] = value;
  }
  return out as unknown as Block;
}

/** A string equal for two blocks exactly when they are equal as values (key order aside). */
export function blockKey(block: Block): string {
  const b = normalizeBlock(block) as unknown as Record<string, unknown>;
  return JSON.stringify(
    Object.keys(b)
      .sort()
      .map((k) => [k, b[k]]),
  );
}

/**
 * How many copies of each block every sample has: a block is static when each sample draws it
 * (as many times as the poorest sample).
 */
export function staticCounts(samples: readonly (readonly Block[])[]): Map<string, number> {
  let counts: Map<string, number> | undefined;
  for (const blocks of samples) {
    const here = new Map<string, number>();
    for (const b of blocks) {
      const key = blockKey(b);
      here.set(key, (here.get(key) ?? 0) + 1);
    }
    if (!counts) counts = here;
    else for (const [key, n] of counts) counts.set(key, Math.min(n, here.get(key) ?? 0));
  }
  for (const [key, n] of counts ?? []) if (n === 0) counts!.delete(key);
  return counts ?? new Map();
}

/** The static blocks of one sample, normalized, in the sample's order (first copies first). */
export function staticBlocks(
  blocks: readonly Block[],
  counts: ReadonlyMap<string, number>,
): Block[] {
  const left = new Map(counts);
  const out: Block[] = [];
  for (const b of blocks) {
    const key = blockKey(b);
    const n = left.get(key) ?? 0;
    if (n === 0) continue;
    left.set(key, n - 1);
    out.push(normalizeBlock(b));
  }
  return out;
}

const LOOKS = ["accent", "signal", "alert", "ghost"] as const;

/** A normalized block as the prim that flattens back to it at identity. */
export function blockToPrim(block: Block): Prim {
  const b = normalizeBlock(block);
  const common = {
    ...(b.layer !== undefined ? { layer: b.layer } : {}),
    ...(b.decor ? { decor: true } : {}),
  };
  switch (b.kind) {
    case "box": {
      const looks = LOOKS.filter((k) => b[k]);
      if (looks.length > 1)
        throw new BlueprintError(`a box is ${looks.join(" and ")}: a prim has one look`);
      const prim: BoxPrim = { kind: "box", at: b.at, size: b.size };
      if (b.tone) prim.tone = b.tone;
      if (looks[0]) prim.look = looks[0] satisfies BoxLook;
      if (b.plate) prim.plate = true;
      if (b.floors !== undefined) prim.floors = b.floors;
      if (b.vents) prim.vents = "+x";
      return { ...prim, ...common };
    }
    case "line":
      return {
        kind: "line",
        points: [b.a, b.b],
        ...(b.ink !== undefined ? { ink: b.ink } : {}),
        ...(b.dash !== undefined ? { dash: b.dash } : {}),
        ...common,
      };
    case "dot":
      return {
        kind: "dot",
        at: b.at,
        ...(b.ink !== undefined ? { ink: b.ink } : {}),
        ...(b.size !== undefined ? { size: b.size } : {}),
        ...common,
      };
    case "label":
      return {
        kind: "label",
        at: b.at,
        text: b.text,
        ...(b.to ? { to: b.to } : {}),
        ...(b.active ? { active: true } : {}),
        ...(b.plain ? { plain: true } : {}),
        ...(b.fixed ? { fixed: true } : {}),
        ...(b.ink !== undefined ? { ink: b.ink } : {}),
        ...common,
      };
  }
}

/** One evaluation of a scene function: its inputs (`t`, `active`, `progress`…) and its blocks. */
export interface Sample {
  input: Readonly<Record<string, number>>;
  blocks: readonly Block[];
}

export interface SceneReport {
  name: string;
  samples: number;
  /** Fewest and most blocks a sample drew. */
  blocks: [min: number, max: number];
  static: number;
  /** Fewest and most varying blocks (drawn minus static) in a sample. */
  varying: [min: number, max: number];
  /** The inputs that change the picture, holding the others still. */
  inputs: string[];
  /** Whether every sample orders its static blocks as the first one does (flatten's order). */
  ordered: boolean;
}

export interface ConvertOptions {
  /** Name of the scene; the file id is `${prefix}/${name}`. */
  name: string;
  prefix?: string;
  title?: string;
  fit?: FitOptions;
}

export interface Converted {
  file: BlueprintFile;
  /** The static blocks, normalized, as the first sample orders them. */
  static: Block[];
  counts: Map<string, number>;
  report: SceneReport;
}

/** The inputs whose change, the others held, changes the blocks drawn. */
function sensitivity(samples: readonly Sample[], keys: readonly string[]): string[] {
  const names = [...new Set(samples.flatMap((s) => Object.keys(s.input)))].sort();
  return names.filter((name) => {
    const groups = new Map<string, string>();
    return samples.some((s, i) => {
      const rest = names
        .filter((n) => n !== name)
        .map((n) => s.input[n])
        .join("|");
      const seen = groups.get(rest);
      if (seen === undefined) {
        groups.set(rest, keys[i]!);
        return false;
      }
      return seen !== keys[i];
    });
  });
}

/** Converts the samples of one scene function (the first sample sets the order). */
export function convertScene(samples: readonly Sample[], options: ConvertOptions): Converted {
  if (samples.length === 0) throw new BlueprintError(`${options.name}: no samples`);
  const counts = staticCounts(samples.map((s) => s.blocks));
  const first = staticBlocks(samples[0]!.blocks, counts);
  const firstKey = first.map(blockKey).join("\n");
  let ordered = true;
  const signatures: string[] = [];
  const sizes = samples.map((s) => s.blocks.length);
  const nStatic = first.length;
  for (const s of samples) {
    signatures.push(s.blocks.map(blockKey).join("\n"));
    if (ordered && staticBlocks(s.blocks, counts).map(blockKey).join("\n") !== firstKey)
      ordered = false;
  }
  const inputs = sensitivity(samples, signatures);
  const vars: Record<string, Var> = {};
  if (inputs.includes("active")) vars.active = { type: "int", default: -1 };
  if (inputs.includes("progress")) vars.progress = { type: "progress", default: 0 };
  const fit: Camera["fit"] = {};
  if (options.fit?.fill !== undefined) fit.fill = options.fit.fill;
  if (options.fit?.unit !== undefined) fit.unit = options.fit.unit;
  if (options.fit?.at !== undefined) fit.at = { t: options.fit.at };
  const file: BlueprintFile = {
    $schema: SCHEMA_URL,
    version: 1,
    id: `${options.prefix ?? "site"}/${options.name}`,
    parts: { static: { prims: first.map(blockToPrim) } },
    scenes: {
      [options.name]: {
        title: options.title ?? options.name,
        depth: "painter",
        camera: { view: 0, fit },
        root: { instances: [{ id: "static", use: "static" }] },
        ...(Object.keys(vars).length ? { vars } : {}),
      },
    },
  };
  return {
    file,
    static: first,
    counts,
    report: {
      name: options.name,
      samples: samples.length,
      blocks: [Math.min(...sizes), Math.max(...sizes)],
      static: nStatic,
      varying: [Math.min(...sizes) - nStatic, Math.max(...sizes) - nStatic],
      inputs,
      ordered,
    },
  };
}
