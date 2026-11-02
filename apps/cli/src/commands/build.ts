import { buildAll } from "@forgeron/compiler";
import { relative } from "node:path";
import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";

/** `forgeron build`: every tool under the current folder, into `.forgeron/build/` (sdk.md §14). */
export async function build(args: string[], io: Io): Promise<number> {
  const { positionals } = parseArgs({ args, allowPositionals: true, options: {} });
  if (positionals.length > 0) throw new UsageError("Usage: forgeron build");

  const results = await buildAll(io.cwd);
  if (results.length === 0) {
    io.error(`No tool found under ${io.cwd}: a tool is a folder with a forgeron.config.ts.`);
    return 1;
  }
  for (const result of results) {
    const where = relative(io.cwd, result.outDir) || ".forgeron/build";
    io.log(`${result.name}@${result.version}  ${result.fingerprint.slice(0, 12)}  ${where}`);
  }
  return 0;
}
