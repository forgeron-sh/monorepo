// The gateway's own module, kept in the platform D1 (D-031): a new version of a Worker cannot be
// uploaded without its code, and the gateway needs one to add or remove a tool's service binding.
import type { D1Database } from "@forgeron/hosting";

// A D1 statement is limited in size; the characters are counted, not the bytes, so stay far below.
const CHUNK = 20_000;

/** Replaces the stored module with `code`, in one batch. */
export async function saveGatewayCode(d1: D1Database, code: string): Promise<void> {
  const insert = d1.prepare(`INSERT INTO "gateway_code" ("part", "content") VALUES (?, ?)`);
  const statements = [d1.prepare(`DELETE FROM "gateway_code"`)];
  for (let part = 0; part * CHUNK < code.length; part++) {
    statements.push(insert.bind(part, code.slice(part * CHUNK, (part + 1) * CHUNK)));
  }
  await d1.batch(statements);
}

/** The stored module, or `undefined` if the installation has not stored one. */
export async function loadGatewayCode(d1: D1Database): Promise<string | undefined> {
  const { results } = await d1
    .prepare(`SELECT "content" FROM "gateway_code" ORDER BY "part"`)
    .all();
  const parts = (results ?? []) as Array<{ content: string }>;
  return parts.length ? parts.map((p) => p.content).join("") : undefined;
}
