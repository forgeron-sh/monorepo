import type { CloudflareClient } from "@forgeron/hosting";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import { UsageError } from "../io";

// The console's build (`apps/console/dist`) is uploaded as the static assets of the gateway Worker:
// https://developers.cloudflare.com/workers/static-assets/direct-upload/
//   1. POST workers/scripts/<worker>/assets-upload-session {manifest} -> {jwt, buckets}
//   2. POST workers/assets/upload?base64=true, one multipart request per bucket, authorised with the
//      session `jwt` (not the API token) -> the last answers with the completion `jwt`
//   3. the Worker version carries `assets.jwt` (a bucket list that is empty means the files are
//      already stored: the session `jwt` is the completion token).

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

interface Asset {
  /** `/index.html`: the path the file is served at. */
  path: string;
  hash: string;
  size: number;
  base64: string;
  type: string;
}

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

/** Registers and uploads the assets; returns the completion token the Worker version carries. */
export async function uploadAssets(
  client: CloudflareClient,
  worker: string,
  assets: Asset[],
): Promise<string> {
  const manifest = Object.fromEntries(assets.map((a) => [a.path, { hash: a.hash, size: a.size }]));
  const session = await client.request<{ jwt: string; buckets?: string[][] }>(
    "POST",
    `/workers/scripts/${worker}/assets-upload-session`,
    { manifest },
  );
  const byHash = new Map(assets.map((a) => [a.hash, a]));
  let completion = session.buckets?.length ? undefined : session.jwt;
  for (const bucket of session.buckets ?? []) {
    const form = new FormData();
    for (const hash of bucket) {
      const asset = byHash.get(hash);
      if (!asset) throw new Error("Cloudflare asked for a file that is not in the console build.");
      form.append(hash, new Blob([asset.base64], { type: asset.type }), hash);
    }
    const result = await client.form<{ jwt?: string }>(
      "POST",
      "/workers/assets/upload?base64=true",
      form,
      session.jwt,
    );
    if (result.jwt) completion = result.jwt;
  }
  if (!completion) throw new Error("Cloudflare did not return the completion token of the assets.");
  return completion;
}
