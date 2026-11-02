import { describe, expect, it } from "vitest";
import { createTestTool, sales, support } from "./helpers";

type Company = { id: string; name: string; domain: string | null };

describe("companies.upsert", () => {
  it("creates a company", async () => {
    const tool = await createTestTool({ as: sales });
    expect(await tool.call("companies.upsert", { name: "Acme", domain: "acme.fr" })).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{32}$/),
      name: "Acme",
      domain: "acme.fr",
    });
  });

  it("updates the company that has the same domain, and keeps its id", async () => {
    const tool = await createTestTool({ as: sales });
    const first = (await tool.call("companies.upsert", {
      name: "Acme",
      domain: "acme.fr",
    })) as Company;
    const second = (await tool.call("companies.upsert", {
      name: "Acme Corp",
      domain: "acme.fr",
    })) as Company;
    expect(second.id).toBe(first.id);
    expect(second.name).toBe("Acme Corp");
    expect(await tool.call("companies.list", {})).toHaveLength(1);
  });

  it("creates a new company each time when there is no domain to match on", async () => {
    const tool = await createTestTool({ as: sales });
    await tool.call("companies.upsert", { name: "Same" });
    await tool.call("companies.upsert", { name: "Same" });
    expect(await tool.call("companies.list", {})).toHaveLength(2);
  });

  it("is refused to read-only roles", async () => {
    const tool = await createTestTool({ as: support });
    await expect(tool.call("companies.upsert", { name: "Acme" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("companies.list", () => {
  it("lists companies by name, and filters on the name or the domain", async () => {
    const tool = await createTestTool({ as: sales });
    for (const [name, domain] of [
      ["Zeta", "zeta.io"],
      ["Acme", "acme.fr"],
      ["Beta", "b.example"],
    ] as const) {
      await tool.call("companies.upsert", { name, domain });
    }
    const all = (await tool.call("companies.list", {})) as Company[];
    expect(all.map((c) => c.name)).toEqual(["Acme", "Beta", "Zeta"]);
    expect(
      ((await tool.call("companies.list", { query: "zeta" })) as Company[]).map((c) => c.name),
    ).toEqual(["Zeta"]);
    expect(
      ((await tool.call("companies.list", { query: "example" })) as Company[]).map((c) => c.name),
    ).toEqual(["Beta"]);
    expect(await tool.call("companies.list", { limit: 2 })).toHaveLength(2);
  });

  it("is open to read-only roles", async () => {
    const tool = await createTestTool({ as: support });
    expect(await tool.call("companies.list", {})).toEqual([]);
  });
});
