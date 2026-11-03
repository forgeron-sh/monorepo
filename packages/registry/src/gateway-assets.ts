// The console's files, kept in the platform D1 (D-052): Cloudflare refuses to carry the assets of a
// Worker over to its next version, so the gateway, which uploads a new version of itself whenever a
// tool is bound, needs the files. Written by `platform install` with the gateway's code, read only
// when a tool is bound (the gateway never loads them to serve a request).
import type { Asset, D1Database } from "@forgeron/hosting";

// A D1 statement is limited in size; the characters are counted, not the bytes, so stay far below.
const CHUNK = 20_000;

/** Replaces the stored assets with `assets`, in one batch. */
export async function saveGatewayAssets(d1: D1Database, assets: readonly Asset[]): Promise<void> {
  const insert = d1.prepare(
    `INSERT INTO "gateway_assets" ("path", "part", "hash", "size", "type", "content") VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const statements = [d1.prepare(`DELETE FROM "gateway_assets"`)];
  for (const asset of assets) {
    // An empty file still gets one row: the part loop alone would drop it.
    const parts = Math.max(1, Math.ceil(asset.base64.length / CHUNK));
    for (let part = 0; part < parts; part++) {
      statements.push(
        insert.bind(
          asset.path,
          part,
          asset.hash,
          asset.size,
          asset.type,
          asset.base64.slice(part * CHUNK, (part + 1) * CHUNK),
        ),
      );
    }
  }
  await d1.batch(statements);
}

/** The stored assets, or `undefined` if the installation has not stored any. */
export async function loadGatewayAssets(d1: D1Database): Promise<Asset[] | undefined> {
  const { results } = await d1
    .prepare(
      `SELECT "path", "hash", "size", "type", "content" FROM "gateway_assets" ORDER BY "path", "part"`,
    )
    .all();
  const rows = (results ?? []) as Array<{
    path: string;
    hash: string;
    size: number;
    type: string;
    content: string;
  }>;
  if (!rows.length) return undefined;
  const assets = new Map<string, Asset>();
  for (const row of rows) {
    const known = assets.get(row.path);
    if (known) known.base64 += row.content;
    else {
      assets.set(row.path, {
        path: row.path,
        hash: row.hash,
        size: row.size,
        type: row.type,
        base64: row.content,
      });
    }
  }
  return [...assets.values()];
}
