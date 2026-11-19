/**
 * The frozen parity cases (docs/blueprint/engine.md, P4): a SHA-256 of each case's four buffers
 * (`material`, `ink`, `tone`, `color`), written once from frames that equalled the TypeScript
 * reference buffer for buffer (P2, P3), before the reference was deleted. The suites compare the
 * engine's frames with `golden.json`; `BLUEPRINT_GOLDEN=write` records them instead (one suite
 * at a time: each rewrites its own section of the file).
 *
 * A failing case writes the engine's picture to `target/parity/<case>.png`.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { paint, plan, resolvePalette } from "../../src/index";
import type { Frame } from "../../src/core/frame";
import { png } from "./png";

const FILE = new URL("golden.json", import.meta.url);
const repo = new URL("../../../../", import.meta.url);

/** Whether this run records the hashes instead of checking them. */
const WRITE = process.env.BLUEPRINT_GOLDEN === "write";

type Suite = "still" | "animated";

const stored = (): Partial<Record<Suite, Record<string, string>>> =>
  existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};

const bytes = (a: ArrayBufferView) => new Uint8Array(a.buffer, a.byteOffset, a.byteLength);

/** The hash of a frame: its size, then its four buffers as bytes. */
function digest(f: Frame): string {
  const h = createHash("sha256");
  h.update(`${f.width}x${f.height};`);
  for (const k of ["material", "ink", "tone", "color"] as const) h.update(bytes(f[k]));
  return h.digest("hex").slice(0, 24);
}

const colors = resolvePalette(plan().colors);

function dump(name: string, f: Frame): string {
  const dir = new URL("target/parity/", repo);
  mkdirSync(dir, { recursive: true });
  // A case name holds the page's path ("/"): one file name.
  const file = new URL(`${name.replace(/[^\w.=-]+/g, "_")}.png`, dir);
  writeFileSync(file, png(f.width, f.height, paint(f, colors)));
  return file.pathname;
}

/** A suite's golden hashes: `check` a frame against its case, `save` at the end of a write run. */
export function golden(suite: Suite) {
  const known = stored()[suite] ?? {};
  const seen: Record<string, string> = {};
  return {
    /** "" when the frame is the frozen one, else what is wrong. */
    check(name: string, frame: Frame): string {
      const hash = digest(frame);
      if (seen[name] !== undefined && seen[name] !== hash)
        return `${name}: drawn twice, differently`;
      seen[name] = hash;
      if (WRITE) return "";
      const want = known[name];
      if (want === undefined) return `${name}: not in golden.json`;
      return want === hash ? "" : `${name}: differs from golden.json (${dump(name, frame)})`;
    },
    /** The cases of golden.json this run did not draw (a check run over the whole suite). */
    missing(): string[] {
      return Object.keys(known).filter((k) => seen[k] === undefined);
    },
    save(): void {
      if (!WRITE) return;
      const all = stored();
      all[suite] = Object.fromEntries(Object.entries(seen).sort(([a], [b]) => (a < b ? -1 : 1)));
      writeFileSync(FILE, `${JSON.stringify(all, null, 2)}\n`);
    },
    get size(): number {
      return Object.keys(seen).length;
    },
  };
}
