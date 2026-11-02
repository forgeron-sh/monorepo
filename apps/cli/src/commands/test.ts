import { buildAll } from "@forgeron/compiler";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { Io } from "../io";

/**
 * `forgeron test [vitest args]`: builds the tools, then runs Vitest. `createTestTool` runs the
 * built Worker, so the build comes first. Without arguments it runs once (`vitest run`), as in CI.
 */
export async function test(args: string[], io: Io): Promise<number> {
  const built = await buildAll(io.cwd);
  if (built.length === 0) {
    io.error(`No tool found under ${io.cwd}: a tool is a folder with a forgeron.config.ts.`);
    return 1;
  }

  let vitest: string;
  try {
    const manifest = createRequire(join(io.cwd, "package.json")).resolve("vitest/package.json");
    vitest = join(dirname(manifest), "vitest.mjs");
  } catch {
    io.error("vitest is not installed here: add it to the tool's devDependencies.");
    return 1;
  }
  return io.exec(process.execPath, [vitest, ...(args.length > 0 ? args : ["run"])], io.cwd);
}
