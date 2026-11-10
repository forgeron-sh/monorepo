import { buildTool } from "@forgeron/compiler";
import { BUNDLE_FORMAT, type ToolBundle } from "@forgeron/hosting";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { readBuild } from "../built";
import { UsageError, type Io } from "../io";

const USAGE = "Usage: forgeron bundle [--out <dir>]";

/**
 * `forgeron bundle`: builds the tool of the current folder and writes it as one file,
 * `<name>-<version>.forgeron.json` (D-115), with its SHA-256: what a marketplace attaches to a release
 * and lists in its index. The file is the body of a deployment; nothing in it is a secret.
 */
export async function bundle(args: string[], io: Io): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: { out: { type: "string" } },
  });
  if (positionals.length > 0) throw new UsageError(USAGE);

  const built = await buildTool(io.cwd);
  const content: ToolBundle = {
    format: BUNDLE_FORMAT,
    name: built.name,
    version: built.version,
    build: await readBuild(built.outDir, built.fingerprint),
  };
  const outDir = resolve(io.cwd, values.out ?? ".forgeron/bundle");
  await mkdir(outDir, { recursive: true });
  const file = join(outDir, `${built.name}-${built.version}.forgeron.json`);
  const text = `${JSON.stringify(content)}\n`;
  await writeFile(file, text);
  const sha256 = createHash("sha256").update(text).digest("hex");
  io.log(`${built.name}@${built.version}  ${relative(io.cwd, file) || file}`);
  io.log(`sha256 ${sha256}`);
  return 0;
}
