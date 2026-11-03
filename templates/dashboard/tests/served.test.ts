import { describe, expect, it } from "vitest";
// Written by the build: `bun scripts/build-tool.ts templates/dashboard` (Vitest and typecheck run it first).
import manifest from "../.forgeron/build/manifest.json";
import { createTestTool, crm, management, NOW, nobody } from "./helpers";

describe("the built tool", () => {
  it("lists the Monday view at /monday, for management only, with its owner parameter", () => {
    expect(manifest.views.monday).toMatchObject({
      path: "/monday",
      access: "management",
      entry: "views/monday.js",
      params: { properties: { owner: { type: "string" } } },
    });
    expect(manifest.roles.management.grants).toContain("management");
  });

  it("answers the view's calls through /_f/call, with the person's access", async () => {
    const call = async (as: object) => {
      const tool = await createTestTool({ as, now: NOW, tools: crm });
      return tool.fetch("/_f/call/sales.summary", { method: "POST", body: "{}" });
    };
    const ok = await call(management);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ won: 10_000 });
    expect((await call(nobody)).status).toBe(403);
  });
});
