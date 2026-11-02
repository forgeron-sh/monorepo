import { actionNameOfPath } from "@forgeron/manifest";
import type { ActionDefinition, EventDefinition, JobDefinition, ToolConfig } from "@forgeron/sdk";
import { randomUUID } from "node:crypto";
import { access, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { rolldown } from "rolldown";
import { CONFIG_FILE } from "./discover";

// Reads a tool by running it: the config and every action and task are bundled together,
// imported once, and their definitions read. Nothing is guessed from the source text.

export interface LoadedTool {
  config: ToolConfig;
  actions: Record<string, ActionDefinition>;
  jobs: Record<string, JobDefinition>;
  events: Record<string, EventDefinition>;
  /** The tool's `db/schema.ts`, if it has one. */
  schema?: unknown;
  /** The source files of the tool that went into the bundle (not npm packages, not tests). */
  modules: string[];
  /** Turns a Zod schema of the tool into a JSON Schema, with the tool's own copy of Zod. */
  toJsonSchema(schema: unknown, io: "input" | "output"): Record<string, unknown>;
}

const SOURCE = /\.(ts|tsx|js|mjs)$/;

async function files(dir: string): Promise<string[]> {
  const found: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await files(path)));
    else if (entry.isFile() && SOURCE.test(entry.name) && !entry.name.startsWith("_")) {
      found.push(path);
    }
  }
  return found.sort();
}

function named(dir: string, kind: string, entries: Array<{ name: string; file: string }>) {
  const seen = new Map<string, string>();
  for (const { name, file } of entries) {
    const first = seen.get(name);
    if (first) {
      throw new Error(
        `Two files declare the ${kind} "${name}": ${relative(dir, first)} and ${relative(dir, file)}.`,
      );
    }
    seen.set(name, file);
  }
  return entries;
}

const SCHEMA_FILE = ["db", "schema.ts"] as const;

export async function schemaFileOf(dir: string): Promise<string | undefined> {
  const file = join(dir, ...SCHEMA_FILE);
  try {
    await access(file);
    return file;
  } catch {
    return undefined;
  }
}

export async function sourcesOf(dir: string) {
  const actionFiles = await files(join(dir, "actions"));
  const jobFiles = await files(join(dir, "jobs"));
  const eventFiles = await files(join(dir, "events"));
  return {
    actions: named(
      dir,
      "action",
      actionFiles.map((file) => ({
        name: actionNameOfPath(relative(join(dir, "actions"), file)),
        file,
      })),
    ),
    jobs: named(
      dir,
      "task",
      jobFiles.map((file) => ({ name: basename(file, extname(file)), file })),
    ),
    events: named(
      dir,
      "event handler",
      eventFiles.map((file) => ({ name: basename(file, extname(file)), file })),
    ),
  };
}

const inside = (dir: string, path: string) => {
  const rel = relative(dir, path);
  return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
};

/** A tool imports its own files and npm packages: nothing else (sdk.md §14). */
function boundary(dir: string) {
  return {
    name: "forgeron-boundary",
    resolveId(source: string, importer?: string) {
      if (!importer || !inside(dir, importer) || importer.includes(`${sep}node_modules${sep}`)) {
        return null;
      }
      if (!source.startsWith(".") && !isAbsolute(source)) return null;
      if (!inside(dir, resolve(dirname(importer), source))) {
        throw new Error(
          `${relative(dir, importer)} imports "${source}", which is outside the tool folder: a tool imports its own files and npm packages.`,
        );
      }
      return null;
    },
  };
}

export async function loadTool(dir: string, scratch: string): Promise<LoadedTool> {
  const { actions, jobs, events } = await sourcesOf(dir);
  const schemaFile = await schemaFileOf(dir);
  const q = JSON.stringify;
  // Each file is imported on its own so that a failure names the file, not the bundle.
  const guarded = (file: string) =>
    `await load(${q(relative(dir, file))}, () => import(${q(file)}))`;
  const entry = [
    `import { z } from "@forgeron/sdk";`,
    `import config from ${q(join(dir, CONFIG_FILE))};`,
    `const load = async (where, run) => {`,
    `  try { return (await run()).default; }`,
    `  catch (error) { throw new Error(where + ": " + (error instanceof Error ? error.message : error), { cause: error }); }`,
    `};`,
    `export { config };`,
    `export const actions = { ${actions.map((a) => `${q(a.name)}: ${guarded(a.file)}`).join(", ")} };`,
    `export const jobs = { ${jobs.map((j) => `${q(j.name)}: ${guarded(j.file)}`).join(", ")} };`,
    `export const events = { ${events.map((e) => `${q(e.name)}: ${guarded(e.file)}`).join(", ")} };`,
    ...(schemaFile ? [`export const schema = ${guarded(schemaFile)};`] : []),
    `export const toJsonSchema = (schema, io) => z.toJSONSchema(schema, { io });`,
  ].join("\n");

  await mkdir(scratch, { recursive: true });
  const input = join(scratch, "load.ts");
  // A new file name each time: a module is cached by its path, and a rebuild must read the new code.
  const output = join(scratch, `load-${randomUUID()}.mjs`);
  await writeFile(input, entry);
  const bundle = await rolldown({
    input,
    platform: "node",
    logLevel: "silent",
    plugins: [boundary(dir)],
  });
  const { output: chunks } = await bundle.write({
    file: output,
    format: "esm",
    codeSplitting: false,
  });
  await bundle.close();
  const modules = chunks.flatMap((chunk) => (chunk.type === "chunk" ? chunk.moduleIds : []));

  const loaded = (await import(pathToFileURL(output).href)) as LoadedTool;
  await rm(output, { force: true });
  const own = modules.filter(
    (id) =>
      inside(dir, id) &&
      SOURCE.test(id) &&
      !id.includes(`${sep}node_modules${sep}`) &&
      !id.includes(`${sep}.forgeron${sep}`),
  );
  return { ...loaded, modules: own.sort() };
}
