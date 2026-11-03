import { createDb, type D1Like } from "@forgeron/runtime";
import { rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadTool } from "./load";

/** Runs the tool's `db/seed.ts` on a database whose migrations are applied. Returns false when there is none. */
export async function runSeed(toolDir: string, d1: D1Like): Promise<boolean> {
  const dir = resolve(toolDir);
  const scratch = join(dir, ".forgeron", "seed");
  let seed: { run(ctx: { db: unknown }): void | Promise<void> } | undefined;
  try {
    seed = (await loadTool(dir, scratch)).seed;
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
  if (!seed) return false;
  await seed.run({ db: createDb(d1) });
  return true;
}
