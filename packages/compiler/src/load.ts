import type { ActionDefinition, JobDefinition, ToolConfig } from "@forgeron/sdk";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { rolldown } from "rolldown";
import { CONFIG_FILE } from "./discover";

// Reads a tool by running it: the config and every action and task are bundled together,
// imported once, and their definitions read. Nothing is guessed from the source text.

export interface LoadedTool {
  config: ToolConfig;
  actions: Record<string, ActionDefinition>;
  jobs: Record<string, JobDefinition>;
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

/** `actions/deals/move.ts` is `deals.move`: the path under the folder, with dots (sdk.md §2). */
function actionNameOf(folder: string, file: string): string {
  const parts = relative(folder, file).split(/[\\/]/);
  parts[parts.length - 1] = basename(parts[parts.length - 1]!, extname(file));
  if (parts.length > 2) {
    throw new Error(
      `${relative(folder, file)}: an action is at most two levels deep (group.verb).`,
    );
  }
  return parts.join(".");
}

export async function sourcesOf(dir: string) {
  const actionFiles = await files(join(dir, "actions"));
  const jobFiles = await files(join(dir, "jobs"));
  return {
    actions: actionFiles.map((file) => ({ name: actionNameOf(join(dir, "actions"), file), file })),
    jobs: jobFiles.map((file) => ({ name: basename(file, extname(file)), file })),
  };
}

export async function loadTool(dir: string, scratch: string): Promise<LoadedTool> {
  const { actions, jobs } = await sourcesOf(dir);
  const q = JSON.stringify;
  const entry = [
    `import { z } from "@forgeron/sdk";`,
    `import config from ${q(join(dir, CONFIG_FILE))};`,
    ...actions.map((a, i) => `import action${i} from ${q(a.file)};`),
    ...jobs.map((j, i) => `import job${i} from ${q(j.file)};`),
    `export { config };`,
    `export const actions = { ${actions.map((a, i) => `${q(a.name)}: action${i}`).join(", ")} };`,
    `export const jobs = { ${jobs.map((j, i) => `${q(j.name)}: job${i}`).join(", ")} };`,
    `export const toJsonSchema = (schema, io) => z.toJSONSchema(schema, { io });`,
  ].join("\n");

  await mkdir(scratch, { recursive: true });
  const input = join(scratch, "load.ts");
  const output = join(scratch, "load.mjs");
  await writeFile(input, entry);
  const bundle = await rolldown({ input, platform: "node", logLevel: "silent" });
  await bundle.write({ file: output, format: "esm" });
  await bundle.close();

  // A fresh URL each time: Node caches modules by URL.
  const loaded = (await import(`${pathToFileURL(output).href}?t=${Date.now()}`)) as LoadedTool;
  await rm(output, { force: true });
  return loaded;
}
