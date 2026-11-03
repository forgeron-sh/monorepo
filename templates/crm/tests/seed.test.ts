import { describe, expect, it } from "vitest";
import { createTestTool, sales } from "./helpers";

describe("db/seed.ts", () => {
  it("fills the database of a test that asks for it", async () => {
    const tool = await createTestTool({ as: sales, seed: true });
    expect(await tool.call("companies.list", {})).toEqual([
      { id: expect.any(String), name: "Acme", domain: "acme.fr" },
      { id: expect.any(String), name: "Globex", domain: "globex.com" },
    ]);
    expect(await tool.call("deals.list", {})).toHaveLength(2);
  });

  it("leaves the database empty otherwise", async () => {
    const tool = await createTestTool({ as: sales });
    expect(await tool.call("companies.list", {})).toEqual([]);
  });
});
