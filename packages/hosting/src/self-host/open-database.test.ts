import type { Manifest } from "@forgeron/manifest";
import { createMemoryD1 } from "@forgeron/sdk/testing/d1";
import { describe, expect, it, vi } from "vitest";
import { createSelfHostHosting, type D1Database } from "../index";
import { FakeCloudflare } from "./fake-cloudflare";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const manifest = { resources: { db: { engine: "d1" } } } as unknown as Manifest;

describe("opening the database of a deployed environment", () => {
  it("finds it by name and reads it through the Cloudflare API, a preview apart from production", async () => {
    const databases: Record<string, D1Database> = {
      "acme--crm--production--db": (await createMemoryD1()) as unknown as D1Database,
      "acme--crm--preview-feat-a-": (await createMemoryD1()) as unknown as D1Database,
    };
    const cloud = new FakeCloudflare((name) => {
      const key = Object.keys(databases).find((k) => name.startsWith(k));
      return key ? databases[key] : undefined;
    });
    const hosting = createSelfHostHosting({
      accountId: "acct",
      apiToken: "test-token",
      workspace: "acme",
      fetch: cloud.fetch,
      url: (name) => `https://${name}.example.test`,
    });
    const production = { tool: "crm", name: "production" as const };
    const preview = { tool: "crm", name: "preview" as const, branch: "feat/a" };
    await hosting.provision(production, manifest);
    await hosting.provision(preview, manifest);
    const prod = databases["acme--crm--production--db"]!;
    await prod.batch([
      prod.prepare("CREATE TABLE a (id INTEGER)"),
      prod.prepare("INSERT INTO a (id) VALUES (1)"),
    ]);

    const db = await hosting.openDatabase!(production);
    expect(
      ((await db!.prepare("SELECT COUNT(*) AS n FROM a").all()).results as { n: number }[])[0]!.n,
    ).toBe(1);
    const other = await hosting.openDatabase!(preview);
    await expect(other!.prepare("SELECT COUNT(*) AS n FROM a").all()).rejects.toThrow(
      /no such table|failed/,
    );
  });

  it("answers undefined for an environment with no database", async () => {
    const hosting = createSelfHostHosting({
      accountId: "acct",
      apiToken: "test-token",
      workspace: "acme",
      fetch: new FakeCloudflare().fetch,
      url: (name) => `https://${name}.example.test`,
    });
    expect(await hosting.openDatabase!({ tool: "crm", name: "production" })).toBeUndefined();
  });
});
