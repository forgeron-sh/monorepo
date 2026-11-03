import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import type { D1Database } from "@forgeron/hosting";
import { afterEach, beforeEach, expect, it } from "vitest";
import { loadGatewayCode, migratePlatform, saveGatewayCode } from "./index";

let memory: MemoryD1;
let d1: D1Database;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
});
afterEach(() => memory.close());

it("stores a module larger than a chunk and reads it back whole", async () => {
  const code = `export default { fetch: () => new Response("é") };\n`.repeat(2000);
  await saveGatewayCode(d1, code);
  expect(await loadGatewayCode(d1)).toBe(code);
});

it("replaces what was stored, and has nothing before the first install", async () => {
  expect(await loadGatewayCode(d1)).toBeUndefined();
  await saveGatewayCode(d1, "a".repeat(50_000));
  await saveGatewayCode(d1, "short");
  expect(await loadGatewayCode(d1)).toBe("short");
});
