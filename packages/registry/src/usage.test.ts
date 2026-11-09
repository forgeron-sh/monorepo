import type { D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, migratePlatform, type Registry } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let registry: Registry;
let clock = new Date("2026-11-03T10:00:00Z");
beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { now: () => clock });
});
afterEach(() => memory.close());

describe("usage (D-093)", () => {
  it("counts calls per tool, person and day, and reports a period by tool and by person", async () => {
    const ana = (
      await registry.addMember({
        workspace: "acme",
        subject: "ana",
        email: "ana@acme.test",
        name: "Ana",
        roles: [],
      })
    ).id;
    await registry.recordUsage("acme", "crm", ana);
    await registry.recordUsage("acme", "crm", ana);
    await registry.recordUsage("acme", "odoo", ana);
    await registry.recordUsage("acme", "crm", "p-gone");
    clock = new Date("2026-11-04T09:00:00Z");
    await registry.recordUsage("acme", "crm", ana);
    await registry.recordUsage("globex", "crm", ana);

    expect(await registry.usageReport("acme", "2026-11-01", "2026-11-30")).toEqual({
      from: "2026-11-01",
      to: "2026-11-30",
      tools: [
        { tool: "crm", calls: 4, people: 2 },
        { tool: "odoo", calls: 1, people: 1 },
      ],
      people: [
        { person: ana, name: "Ana", email: "ana@acme.test", calls: 4 },
        { person: "p-gone", name: "", email: "", calls: 1 },
      ],
    });
    // A period is by UTC day, both ends included; another workspace is never mixed in.
    expect((await registry.usageReport("acme", "2026-11-04", "2026-11-04")).tools).toEqual([
      { tool: "crm", calls: 1, people: 1 },
    ]);
    expect((await registry.usageReport("acme", "2026-10-01", "2026-10-31")).tools).toEqual([]);
  });

  it("counts no call a tool makes on its own behalf, and no anonymous one", async () => {
    await registry.recordUsage("acme", "crm", "tool:odoo");
    await registry.recordUsage("acme", "crm", "");
    expect((await registry.usageReport("acme", "2026-11-01", "2026-11-30")).tools).toEqual([]);
  });
});
