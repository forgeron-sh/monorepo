import { gunzipSync } from "node:zlib";
import { UsageError } from "./io";

// Catalog templates are npm packages `@forgeron/template-<name>` (docs/sdk.md §18).
// `forgeron init --template <name>` reads the registry's metadata, downloads the tarball and unpacks it.

const DEFAULT_REGISTRY = "https://registry.npmjs.org";

export interface TemplatePackage {
  version: string;
  /** Package files by relative path (the tarball's `package/` prefix removed). */
  files: Map<string, Uint8Array>;
}

export async function fetchTemplate(
  name: string,
  registry = process.env.FORGERON_REGISTRY ?? DEFAULT_REGISTRY,
): Promise<TemplatePackage> {
  const base = registry.replace(/\/+$/, "");
  const meta = await get(`${base}/@forgeron%2Ftemplate-${name}/latest`, name);
  const info = (await meta.json()) as { version?: unknown; dist?: { tarball?: unknown } };
  if (typeof info.version !== "string" || typeof info.dist?.tarball !== "string") {
    throw new UsageError(`The registry's answer for template "${name}" is not a package version.`);
  }
  const tarball = await get(info.dist.tarball, name);
  return {
    version: info.version,
    files: untar(gunzipSync(new Uint8Array(await tarball.arrayBuffer()))),
  };
}

async function get(url: string, name: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new UsageError(
      `Cannot reach the registry for template "${name}": ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (response.status === 404) {
    throw new UsageError(
      `No template named "${name}": @forgeron/template-${name} is not published.`,
    );
  }
  if (!response.ok) {
    throw new UsageError(`The registry answered ${response.status} for template "${name}".`);
  }
  return response;
}

/** Reads the regular files of a tar archive (ustar, as npm writes it). */
function untar(tar: Uint8Array): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  const text = (from: number, length: number) =>
    new TextDecoder().decode(tar.subarray(from, from + length)).replace(/\0.*$/s, "");
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const path = text(offset, 100);
    if (path === "") break;
    const size = Number.parseInt(text(offset + 124, 12).trim() || "0", 8);
    const type = text(offset + 156, 1);
    const prefix = text(offset + 345, 155);
    offset += 512;
    if (type === "0" || type === "") {
      const full = prefix ? `${prefix}/${path}` : path;
      const relative = full.replace(/^[^/]+\//, "");
      if (relative.split("/").includes("..")) {
        throw new UsageError(`The template contains an unsafe path: ${full}`);
      }
      files.set(relative, tar.slice(offset, offset + size));
    }
    offset += Math.ceil(size / 512) * 512;
  }
  return files;
}
