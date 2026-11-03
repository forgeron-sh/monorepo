import { describe, expect, it } from "vitest";
import { admin, createTestTool } from "./helpers";

describe("db/seed.ts", () => {
  it("fills the database of a test that asks for it", async () => {
    const tool = await createTestTool({ as: admin, seed: true });
    expect(await tool.call("sites.list", {})).toHaveLength(2);
    const page = (await tool.call("equipments.search", { city: "Nantes" })) as {
      items: unknown[];
    };
    expect(page.items).toHaveLength(2);
  });

  it("leaves the database empty otherwise", async () => {
    const tool = await createTestTool({ as: admin });
    expect(await tool.call("sites.list", {})).toEqual([]);
  });
});
