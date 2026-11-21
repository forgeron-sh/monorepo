/**
 * Reading a Blueprint file: parse, validate (`validate.ts`), then resolve its imports into one
 * table of definitions where every name is qualified as the root file sees it (`office:server`,
 * `office:lib:screw`) and every `use` inside points at a qualified name.
 */
import { BlueprintError } from "../core/blocks";
import type { Assembly, BlueprintFile, Instance, Part, Scene } from "./types";
import { validate } from "./validate";

export interface ReadOptions {
  /** Where the file being read lives: the base of its relative imports, and its name in messages. */
  location?: string;
  /** Loads an imported file by its resolved location: parsed JSON or its text. */
  load?: (location: string) => unknown;
}

/** A file with its imports resolved: every part and assembly visible from it, by qualified name. */
export interface Library {
  file: BlueprintFile;
  parts: ReadonlyMap<string, Part>;
  assemblies: ReadonlyMap<string, Assembly>;
  /** The root file's own scenes. */
  scenes: ReadonlyMap<string, Scene>;
}

interface Defs {
  parts: Map<string, Part>;
  assemblies: Map<string, Assembly>;
  /** Names the file's own definitions may refer to: locals and what its imports take. */
  visible: Set<string>;
}

/**
 * Where an import points: a relative path (`./`, `../`) is resolved against the importing file's
 * directory; anything else (a package path) is taken as written.
 */
export function resolveLocation(from: string, base: string | undefined): string {
  if (!from.startsWith("./") && !from.startsWith("../")) return from;
  const parts = (base ?? "").split("/");
  parts.pop();
  for (const piece of from.split("/")) {
    if (piece === ".") continue;
    if (piece === ".." && parts.length && parts[parts.length - 1] !== "..") parts.pop();
    else parts.push(piece);
  }
  return parts.filter((p, i) => p !== "" || i === 0).join("/");
}

const qualify = (prefix: string, name: string) => `${prefix}:${name}`;

function renameInstance(inst: Instance, rename: (n: string) => string): Instance {
  return { ...inst, use: rename(inst.use) };
}

function renameAssembly(a: Assembly, rename: (n: string) => string): Assembly {
  return { ...a, instances: a.instances.map((i) => renameInstance(i, rename)) };
}

async function parse(input: unknown, source: string): Promise<BlueprintFile> {
  let value = await input;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (error) {
      throw new BlueprintError(`${source}: not JSON (${(error as Error).message})`);
    }
  }
  return validate(value, source);
}

/** Every `use` of a file's own definitions names something visible from it. */
function checkUses(file: BlueprintFile, visible: Set<string>, source: string): void {
  const need = (name: string, path: string) => {
    if (!visible.has(name))
      throw new BlueprintError(
        `${source}: ${path}: "${name}" is not defined${name.includes(":") ? " or not imported" : ""}`,
      );
  };
  const assembly = (a: Assembly, path: string) =>
    a.instances.forEach((inst, i) => need(inst.use, `${path}/instances/${i}/use`));
  for (const [n, a] of Object.entries(file.assemblies ?? {})) assembly(a, `/assemblies/${n}`);
  for (const [n, s] of Object.entries(file.scenes ?? {})) {
    assembly(s.root, `/scenes/${n}/root`);
    for (const [tn, tl] of Object.entries(s.timelines ?? {}))
      tl.tracks.forEach((t, i) => {
        if (t.kind === "conveyor") need(t.use, `/scenes/${n}/timelines/${tn}/tracks/${i}/use`);
      });
  }
}

async function resolveFile(
  file: BlueprintFile,
  location: string,
  load: ReadOptions["load"],
  stack: string[],
): Promise<Defs> {
  const defs: Defs = {
    parts: new Map(Object.entries(file.parts ?? {})),
    assemblies: new Map(Object.entries(file.assemblies ?? {})),
    visible: new Set(),
  };
  for (const name of [...defs.parts.keys(), ...defs.assemblies.keys()]) {
    if (defs.visible.has(name))
      throw new BlueprintError(`${location}: /assemblies/${name}: "${name}" is also a part`);
    defs.visible.add(name);
  }
  const prefixes = new Map<string, number>();
  for (const [i, imp] of (file.imports ?? []).entries()) {
    const path = `/imports/${i}`;
    const earlier = prefixes.get(imp.as);
    if (earlier !== undefined)
      throw new BlueprintError(
        `${location}: ${path}/as: the prefix "${imp.as}" is already used by /imports/${earlier}`,
      );
    prefixes.set(imp.as, i);
    if (!load)
      throw new BlueprintError(`${location}: ${path}: imports need a loader (ReadOptions.load)`);
    const target = resolveLocation(imp.from, location);
    if (stack.includes(target))
      throw new BlueprintError(
        `${location}: ${path}/from: import cycle: ${[...stack, target].join(" → ")}`,
      );
    let raw: unknown;
    try {
      raw = await load(target);
    } catch (error) {
      throw new BlueprintError(
        `${location}: ${path}/from: cannot load ${target}: ${(error as Error).message}`,
      );
    }
    const inner = await resolveFile(await parse(raw, target), target, load, [...stack, target]);
    const rename = (n: string) => qualify(imp.as, n);
    for (const [n, part] of inner.parts) defs.parts.set(rename(n), part);
    for (const [n, a] of inner.assemblies)
      defs.assemblies.set(rename(n), renameAssembly(a, rename));
    const own = [...inner.parts.keys(), ...inner.assemblies.keys()];
    const taken = imp.use ?? own;
    taken.forEach((n, k) => {
      if (!inner.parts.has(n) && !inner.assemblies.has(n))
        throw new BlueprintError(
          `${location}: ${path}/use/${k}: "${n}" is not defined in ${target}`,
        );
      defs.visible.add(rename(n));
    });
  }
  checkUses(file, defs.visible, location);
  return defs;
}

/**
 * Reads a Blueprint file: `input` is its text, its parsed JSON, or a promise of either. Validates
 * it and every file it imports (through `options.load`), and returns the resolved library.
 */
export async function readBlueprint(input: unknown, options: ReadOptions = {}): Promise<Library> {
  const location = options.location ?? "blueprint";
  const file = await parse(input, location);
  const defs = await resolveFile(file, location, options.load, [location]);
  return {
    file,
    parts: defs.parts,
    assemblies: defs.assemblies,
    scenes: new Map(Object.entries(file.scenes ?? {})),
  };
}
