// The platform artifact of a release (D-138, scripts/platform-artifact.ts): the built gateway, the
// console, the platform's migrations. Downloaded from the release and checked before anything is
// touched: the sha256 the release publishes, the format, the version asked for, the size.
import type { Asset, BuildMigration } from "@forgeron/hosting";
import { z } from "zod";
import { ARTIFACT_FILE, CHECKSUM_FILE } from "./releases";

/** Larger than this and the release is refused (the script that writes it refuses it too). */
export const MAX_ARTIFACT_BYTES = 20 * 1024 * 1024;

class ArtifactError extends Error {
  override name = "ArtifactError";
}

const Statement = z.object({ sql: z.string(), parameters: z.array(z.unknown()) });
const ArtifactSchema = z.object({
  format: z.literal(1),
  version: z.string(),
  commit: z.string(),
  /** The gateway's `worker.js`, base64. */
  worker: z.string().min(1),
  assets: z.array(
    z.object({
      path: z.string().startsWith("/"),
      hash: z.string().min(1),
      size: z.number().int().nonnegative(),
      base64: z.string(),
      type: z.string(),
    }),
  ),
  migrations: z.array(
    z.object({
      name: z.string().min(1),
      fingerprint: z.string().min(1),
      destructive: z.boolean(),
      up: z.array(Statement),
      down: z.array(Statement),
    }),
  ),
});

export interface PlatformArtifact {
  version: string;
  commit: string;
  /** The gateway's module, decoded. */
  worker: string;
  assets: Asset[];
  migrations: BuildMigration[];
  /** Bytes downloaded. */
  size: number;
}

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function get(fetcher: typeof fetch, url: string, what: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetcher(url, { headers: { "user-agent": "forgeron-gateway" } });
  } catch {
    throw new ArtifactError(`${what} could not be downloaded: GitHub could not be reached.`);
  }
  if (response.status === 404) {
    throw new ArtifactError(`${what} is not on this release.`);
  }
  if (!response.ok) {
    throw new ArtifactError(`${what} could not be downloaded: GitHub answered ${response.status}.`);
  }
  return response;
}

/** Downloads and checks the artifact of release `v<version>`. Throws `ArtifactError` with a reason fit to show. */
export async function downloadArtifact(options: {
  fetch: typeof fetch;
  repository: string;
  version: string;
}): Promise<PlatformArtifact> {
  const base = `https://github.com/${options.repository}/releases/download/v${options.version}`;

  const checksum = await (
    await get(options.fetch, `${base}/${CHECKSUM_FILE}`, "The checksum")
  ).text();
  const expected = new RegExp(
    `^([0-9a-f]{64})\\s+\\*?${ARTIFACT_FILE.replace(".", "\\.")}\\s*$`,
    "i",
  )
    .exec(checksum.trim())?.[1]
    ?.toLowerCase();
  if (!expected)
    throw new ArtifactError(
      "The release's checksum file is not `<sha256>  forgeron-platform.json`.",
    );

  const response = await get(options.fetch, `${base}/${ARTIFACT_FILE}`, "The platform artifact");
  const announced = Number(response.headers.get("content-length") ?? 0);
  if (announced > MAX_ARTIFACT_BYTES) {
    throw new ArtifactError("The platform artifact is larger than 20 MB: it is refused.");
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_ARTIFACT_BYTES) {
    throw new ArtifactError("The platform artifact is larger than 20 MB: it is refused.");
  }
  if (hex(await crypto.subtle.digest("SHA-256", bytes)) !== expected) {
    throw new ArtifactError(
      "The platform artifact does not match the checksum of the release: it is refused and nothing was changed.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ArtifactError("The platform artifact is not JSON.");
  }
  const artifact = ArtifactSchema.safeParse(parsed);
  if (!artifact.success) {
    const format = (parsed as { format?: unknown } | null)?.format;
    throw new ArtifactError(
      format !== undefined && format !== 1
        ? `The platform artifact has format ${String(format)}, which this gateway does not read: update it with \`forgeron platform install\`.`
        : "The platform artifact is not in the shape this gateway reads.",
    );
  }
  const { data } = artifact;
  if (data.version !== options.version) {
    throw new ArtifactError(
      `The platform artifact is version ${data.version}, not the ${options.version} asked for.`,
    );
  }

  let worker: string;
  try {
    const binary = atob(data.worker);
    worker = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  } catch {
    throw new ArtifactError("The gateway's code in the platform artifact is not base64.");
  }
  return {
    version: data.version,
    commit: data.commit,
    worker,
    assets: data.assets,
    migrations: data.migrations,
    size: bytes.byteLength,
  };
}
