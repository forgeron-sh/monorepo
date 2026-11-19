/**
 * `@forgeron/blueprint/vite`: imports of Blueprint files (`*.bp`, JSON) for Vite, Astro and
 * Vitest. Node only (it reads files); the package's other entries stay neutral.
 *
 * - `import file from "./scene.bp"`: the file as written, like a JSON import (tools, tests).
 * - `import compiled from "./scene.bp?compiled"`: the file read and validated at build time (its
 *   imports too), each scene compiled to its SceneBin (`compileBlueprint`), and the module is
 *   those bytes, inlined as number literals, with the few names the player needs. A page plays them with
 *   `playCompiled` (or `loadScene`) and ships neither the JSON nor the reader and the writer.
 * - `import meta from "./scene.bp?meta"`: the same without the bytes (`BlueprintMeta`): what a page
 *   reads of a scene a worker plays (its camera, scope, machines' states).
 *
 * Types: `/// <reference types="@forgeron/blueprint/bp" />`.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { isAbsolute } from "node:path";
import { type BlueprintMeta, type CompiledBlueprint, compileBlueprint } from "./format/compile";
import { readBlueprint } from "./format/read";
import { sizeOf } from "./engine/layout";
import { SECTIONS } from "./format/scenebin";

/** The hooks this plugin uses, typed without depending on Vite. */
export interface BlueprintPlugin {
  name: string;
  enforce: "pre";
  load(this: { addWatchFile(id: string): void }, id: string): Promise<string | null>;
}

/** Queries Vite adds on its own; any other query (`?raw`, `?url`) is left to Vite. */
const PASSING = new Set(["compiled", "meta", "import", "t", "v"]);

/** A number as a JavaScript literal that reads back to the same float64 (`-0`, `NaN` included). */
const literal = (x: number) => (Object.is(x, -0) ? "-0" : String(x));

const HEADER = sizeOf("header");
/** Words per record of each section, in SceneBin order. */
const SIZES = SECTIONS.map(sizeOf);

/**
 * A SceneBin as the module writes it: its float64 words as number literals, each section's
 * records transposed (field by field: a field repeats down a section, so gzip finds it), an
 * integer field as differences, and its string bytes as text; `B` puts the bytes back on load.
 * Exact (every word keeps its bits) and, gzipped, about half the bytes in base64 (measured on the
 * site's files: 7.1 KB against 13.4 KB; the differences took the village from 45.6 to 33.1 KB).
 */
function binLiteral(bin: Uint8Array): string {
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const word = (i: number) => view.getFloat64(i * 8, true);
  const textLength = word(HEADER - 1);
  const count = (bin.length - textLength) / 8;
  const out: number[] = [];
  for (let i = 0; i < HEADER; i++) out.push(word(i));
  let at = HEADER;
  // A field whose every value is an integer (indices, counts, codes) is written as differences
  // from the record before: runs of indices become runs of small numbers. Exact: integers, all
  // of them safe, add back exactly (a -0 or a NaN keeps the field as it is).
  const deltas: number[] = [];
  let column = 0;
  SIZES.forEach((size, k) => {
    const records = word(2 + k);
    for (let f = 0; f < size; f++, column++) {
      const values = Array.from({ length: records }, (_, r) => word(at + r * size + f));
      const exact = (v: number) => Number.isSafeInteger(v) && !Object.is(v, -0);
      if (
        records > 1 &&
        values.every((v, r) => exact(v) && (r === 0 || exact(v - values[r - 1]!)))
      ) {
        deltas.push(column);
        values.forEach((v, r) => out.push(r === 0 ? v : v - values[r - 1]!));
      } else out.push(...values);
    }
    at += records * size;
  });
  for (let i = at; i < count; i++) out.push(word(i));
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bin.subarray(count * 8));
  return `B([${out.map(literal).join(",")}],${JSON.stringify(text)},[${deltas.join(",")}])`;
}

/** Puts a SceneBin back from `binLiteral`'s words (sections transposed back) and string text. */
const DECODE = `const Z = ${JSON.stringify(SIZES)};
const B = (w, s, d) => {
  const t = new TextEncoder().encode(s);
  const n = w.length;
  const o = new Uint8Array(n * 8 + t.length);
  const v = new DataView(o.buffer);
  const D = new Set(d);
  let i = 0;
  let col = 0;
  for (; i < ${HEADER}; i++) v.setFloat64(i * 8, w[i], true);
  let at = ${HEADER};
  Z.forEach((z, k) => {
    const c = w[2 + k];
    for (let f = 0; f < z; f++) {
      const delta = D.has(col++);
      let x = 0;
      for (let r = 0; r < c; r++) {
        x = delta && r > 0 ? x + w[i++] : w[i++];
        v.setFloat64((at + r * z + f) * 8, x, true);
      }
    }
    at += c * z;
  });
  for (; i < n; i++) v.setFloat64(i * 8, w[i], true);
  o.set(t, n * 8);
  return o;
};`;

/** The module of a compiled file: its scenes, each SceneBin written by `binLiteral`. */
export function compiledModule(compiled: CompiledBlueprint): string {
  const bins: string[] = [];
  const json = JSON.stringify(compiled, (_key, value: unknown) => {
    if (!(value instanceof Uint8Array)) return value;
    bins.push(binLiteral(value));
    return `\0bin${bins.length - 1}\0`;
  });
  const body = json.replace(/"\\u0000bin(\d+)\\u0000"/g, (_m, i: string) => bins[+i]!);
  return `${DECODE}\nexport default ${body};\n`;
}

/** The module of a file's names without its bytes (`?meta`). */
export function metaModule(compiled: CompiledBlueprint): string {
  const meta: BlueprintMeta = {
    id: compiled.id,
    scenes: Object.fromEntries(
      Object.entries(compiled.scenes).map(([name, { bin: _bin, ...rest }]) => [name, rest]),
    ),
  };
  return `export default ${JSON.stringify(meta)};\n`;
}

export function blueprint(): BlueprintPlugin {
  return {
    name: "forgeron-blueprint",
    enforce: "pre",
    async load(id) {
      const [path = "", query = ""] = id.split("?", 2);
      if (!path.endsWith(".bp")) return null;
      const params = new URLSearchParams(query);
      for (const key of params.keys()) if (!PASSING.has(key)) return null;
      const text = readFileSync(path, "utf8");
      if (!params.has("compiled") && !params.has("meta")) {
        let value: unknown;
        try {
          value = JSON.parse(text);
        } catch (error) {
          throw new Error(`${path}: not JSON (${(error as Error).message})`);
        }
        return `export default ${JSON.stringify(value)};\n`;
      }
      const lib = await readBlueprint(text, {
        location: path,
        // Relative imports arrive resolved against `path`; a package path is resolved from it.
        load: (location) => {
          const file = isAbsolute(location) ? location : createRequire(path).resolve(location);
          this.addWatchFile(file);
          return readFileSync(file, "utf8");
        },
      });
      const compiled = compileBlueprint(lib);
      return params.has("meta") ? metaModule(compiled) : compiledModule(compiled);
    },
  };
}
