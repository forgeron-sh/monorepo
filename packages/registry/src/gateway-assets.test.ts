import type { Asset, D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, expect, it } from "vitest";
import { loadGatewayAssets, migratePlatform, saveGatewayAssets } from "./index";

let memory: MemoryD1;
let d1: D1Database;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
});
afterEach(() => memory.close());

const asset = (path: string, base64: string): Asset => ({
  path,
  hash: path.replace(/\W/g, "").padEnd(32, "0").slice(0, 32),
  size: base64.length,
  type: "text/plain",
  base64,
});

it("stores and returns the assets, those larger than a chunk and an empty one included", async () => {
  const assets = [
    asset("/index.html", "aGk="),
    asset("/assets/app.js", "A".repeat(65_000)),
    asset("/empty.txt", ""),
  ];
  await saveGatewayAssets(d1, assets);
  const loaded = await loadGatewayAssets(d1);
  expect(loaded?.sort((a, b) => a.path.localeCompare(b.path))).toEqual(
    [...assets].sort((a, b) => a.path.localeCompare(b.path)),
  );
});

it("is undefined until assets are stored, and a new save replaces the old ones", async () => {
  expect(await loadGatewayAssets(d1)).toBeUndefined();
  await saveGatewayAssets(d1, [asset("/old.html", "b2xk")]);
  await saveGatewayAssets(d1, [asset("/index.html", "bmV3")]);
  expect((await loadGatewayAssets(d1))?.map((a) => a.path)).toEqual(["/index.html"]);
});
