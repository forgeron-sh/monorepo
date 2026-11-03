// The static assets of a Worker (the console, served by the gateway), uploaded through the
// Cloudflare "Direct Upload" API: https://developers.cloudflare.com/workers/static-assets/direct-upload/
//   1. POST workers/scripts/<worker>/assets-upload-session {manifest} -> {jwt, buckets}
//   2. POST workers/assets/upload?base64=true, one multipart request per bucket, authorised with the
//      session `jwt` (not the API token) -> the last answers with the completion `jwt`
//   3. the Worker version carries `assets.jwt` (a bucket list that is empty means the files are
//      already stored: the session `jwt` is the completion token).
// Every version of a Worker needs its own upload: Cloudflare refuses to inherit the assets of an
// earlier one (`keep_assets`, error "Assets cannot be inherited between versions"). Neutral: `fetch`
// only, so `platform install` (CLI) and the gateway (a Worker) share it.
import type { CloudflareClient } from "./cloudflare";

export interface Asset {
  /** `/index.html`: the path the file is served at. */
  path: string;
  hash: string;
  size: number;
  base64: string;
  type: string;
}

/** The routing of the console's assets, as every version of the gateway Worker carries it. */
export const GATEWAY_ASSETS_CONFIG = {
  not_found_handling: "single-page-application",
  run_worker_first: true,
} as const;

/** Registers and uploads the assets; returns the completion token the Worker version carries. */
export async function uploadAssets(
  client: CloudflareClient,
  worker: string,
  assets: readonly Asset[],
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
