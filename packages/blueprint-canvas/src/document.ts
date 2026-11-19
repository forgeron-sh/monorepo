// What the viewer knows of an opened `.bp`: the read library and its outline (parts, assemblies,
// scenes with their vars, timelines and machines). The viewer is a tool: it reads files in the page
// with `readBlueprint`, which the site never ships (it plays compiled scenes).

import { type Library, readBlueprint, type Scene, type Var } from "@forgeron/blueprint/format";

/** A file the viewer can list before it is read: the site's library, a file picked or dropped. */
export interface LibraryEntry {
  /** Its key and the name shown: "erp-village.bp". */
  name: string;
  /** Its text (or parsed JSON), read when the file is opened. */
  load: () => Promise<unknown>;
}

export interface OutlineScene {
  name: string;
  title: string;
  depth: Scene["depth"];
  vars: ReadonlyArray<{ name: string; spec: Var }>;
  timelines: ReadonlyArray<{ name: string; length: number | null; clock: string }>;
  machines: ReadonlyArray<{ name: string; states: readonly string[] }>;
  /** Root params, shown as inputs when there are few (the village has 850, written by tracks). */
  params: ReadonlyArray<{
    name: string;
    type: "number" | "flag" | "int";
    default: number | boolean;
  }>;
  /** Timelines or machines: it moves. */
  animated: boolean;
}

export interface Outline {
  parts: ReadonlyArray<{ name: string; title?: string; prims: number }>;
  assemblies: ReadonlyArray<{ name: string; title?: string; instances: number }>;
  scenes: ReadonlyArray<OutlineScene>;
}

export interface OpenedFile {
  name: string;
  lib: Library;
  outline: Outline;
}

export function outlineOf(lib: Library): Outline {
  const scenes: OutlineScene[] = [];
  for (const [name, s] of lib.scenes) {
    const timelines = Object.entries(s.timelines ?? {}).map(([n, t]) => ({
      name: n,
      length: t.length ?? null,
      clock: t.clock ?? "t",
    }));
    const machines = Object.entries(s.machines ?? {}).map(([n, m]) => ({
      name: n,
      states: Object.keys(m.states),
    }));
    scenes.push({
      name,
      title: s.title,
      depth: s.depth,
      vars: Object.entries(s.vars ?? {}).map(([n, spec]) => ({ name: n, spec })),
      timelines,
      machines,
      params: Object.entries(s.root.params ?? {}).map(([n, p]) => ({ name: n, ...p })),
      animated: timelines.length > 0 || machines.length > 0,
    });
  }
  return {
    // Only the file's own definitions: imported ones keep their prefix and stay out of the list.
    parts: [...lib.parts]
      .filter(([n]) => !n.includes(":"))
      .map(([name, p]) => ({
        name,
        ...(p.title ? { title: p.title } : {}),
        prims: p.prims.length,
      })),
    assemblies: [...lib.assemblies]
      .filter(([n]) => !n.includes(":"))
      .map(([name, a]) => ({
        name,
        ...(a.title ? { title: a.title } : {}),
        instances: a.instances.length,
      })),
    scenes,
  };
}

/** Reads a file's text or JSON: validated, imports resolved through `load` when it has any. */
export async function openBlueprint(
  name: string,
  content: unknown,
  load?: (location: string) => unknown,
): Promise<OpenedFile> {
  const lib = await readBlueprint(content, { location: name, ...(load ? { load } : {}) });
  return { name, lib, outline: outlineOf(lib) };
}

/** How long the scrub bar runs for a scene: its longest timeline on `t`, else ten seconds. */
export function scrubLength(scene: OutlineScene | undefined, timeline: string | null): number {
  if (!scene) return 10;
  const on = scene.timelines.filter(
    (t) => t.clock === "t" && t.length !== null && (timeline === null || t.name === timeline),
  );
  const longest = Math.max(0, ...on.map((t) => t.length ?? 0));
  return longest > 0 ? longest : 10;
}
