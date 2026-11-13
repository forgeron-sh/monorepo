// Writes the platform artifact of a release (D-138): `dist/forgeron-platform.json` and its checksum
// `dist/forgeron-platform.json.sha256`, after `bun run --cwd apps/gateway build` and
// `bun run --cwd apps/console build`. The release workflow attaches both to the release `v<version>`;
// a gateway reads them to update itself from the console. The shape is `docs/spikes/self-update.md`, 1.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readAssets } from "../apps/cli/src/commands/console-assets";
import { platformMigrations } from "../packages/registry/src/migrations";

/** The artifact's file names: the release carries both. */
export const ARTIFACT_FILE = "forgeron-platform.json";
export const CHECKSUM_FILE = `${ARTIFACT_FILE}.sha256`;

/** The gateway refuses a bigger artifact: so do we, before it is attached to a release. */
export const MAX_ARTIFACT_BYTES = 20 * 1024 * 1024;

const root = new URL("..", import.meta.url).pathname;

export interface PlatformArtifactOptions {
  /** The built gateway (`apps/gateway/dist/worker.js`). */
  worker?: string;
  /** The built console (`apps/console/dist`). */
  console?: string;
  /** Where the two files are written. */
  out?: string;
  version?: string;
  commit?: string;
  maxBytes?: number;
}

/** The commit: CI's (`GITHUB_SHA`), else the checkout's, else none. */
function currentCommit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

export async function writePlatformArtifact(options: PlatformArtifactOptions = {}) {
  const out = options.out ?? join(root, "dist");
  const version =
    options.version ??
    (JSON.parse(await readFile(join(root, "package.json"), "utf8")) as { version: string }).version;
  const worker = await readFile(options.worker ?? join(root, "apps/gateway/dist/worker.js"));
  const assets = await readAssets(options.console ?? join(root, "apps/console/dist"));
  const json = JSON.stringify({
    format: 1,
    version,
    commit: options.commit ?? currentCommit(),
    worker: worker.toString("base64"),
    assets,
    migrations: platformMigrations,
  });
  const bytes = Buffer.byteLength(json);
  const max = options.maxBytes ?? MAX_ARTIFACT_BYTES;
  if (bytes > max) {
    throw new Error(
      `The platform artifact is ${bytes} bytes, over the ${max} bytes the gateway accepts: nothing was written.`,
    );
  }
  const sha256 = createHash("sha256").update(json).digest("hex");
  await mkdir(out, { recursive: true });
  await writeFile(join(out, ARTIFACT_FILE), json);
  await writeFile(join(out, CHECKSUM_FILE), `${sha256}  ${ARTIFACT_FILE}\n`);
  return { file: join(out, ARTIFACT_FILE), bytes, sha256, version };
}

if (import.meta.main) {
  const { file, bytes, sha256 } = await writePlatformArtifact();
  console.log(`Platform artifact written to ${file} (${bytes} bytes, sha256 ${sha256})`);
}
