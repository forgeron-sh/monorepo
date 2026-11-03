import type { Asset } from "@forgeron/hosting";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import { UsageError } from "../io";

// The console's build (`apps/console/dist`) is read here; `uploadAssets` (@forgeron/hosting) sends it.

const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".map": "application/json",
};

/** Vite writes its own manifest in `.vite/`: it describes the build, it is not a page. */
const skipped = (path: string) => path.startsWith("/.vite/");

async function list(dir: string, root = dir): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await list(full, root)));
    else found.push(full);
  }
  return found;
}

export async function readAssets(dir: string): Promise<Asset[]> {
  let files: string[];
  try {
    files = await list(dir);
  } catch {
    throw new UsageError(
      `Cannot read the console build ${dir}. Build it first (\`moon run console:build\`).`,
    );
  }
  const assets: Asset[] = [];
  for (const file of files.sort()) {
    const path = `/${relative(dir, file).split(sep).join("/")}`;
    if (skipped(path)) continue;
    const content = await readFile(file);
    assets.push({
      path,
      // Cloudflare asks for 32 hexadecimal characters; the same file always gets the same hash.
      hash: createHash("sha256").update(content).digest("hex").slice(0, 32),
      size: content.byteLength,
      base64: content.toString("base64"),
      type: TYPES[extname(file).toLowerCase()] ?? "application/octet-stream",
    });
  }
  if (!assets.some((a) => a.path === "/index.html")) {
    throw new UsageError(`${dir} has no index.html: it is not a console build.`);
  }
  return assets;
}
