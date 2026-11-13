import { mockFetch } from "@forgeron/sdk/testing";
import { describe, expect, it } from "vitest";
import { manager, createTestTool } from "./helpers";

const FIRST =
  "GET https://graph.microsoft.com/v1.0/sites/acme.sharepoint.com:/sites/fleet:/lists/Equipments/items?expand=fields";
const NEXT = "https://graph.microsoft.com/v1.0/next-page";

// What the nightly job reads: two pages of the SharePoint list, simulated.
function sharepoint() {
  return mockFetch({
    [FIRST]: {
      value: [
        { id: "sp-1", fields: { Ref: "CH-001", NextCheck: "2026-09-01T00:00:00Z" } },
        { id: "sp-2", fields: { Ref: "UNKNOWN", NextCheck: null } },
      ],
      "@odata.nextLink": NEXT,
    },
    [`GET ${NEXT}`]: {
      value: [{ id: "sp-3", fields: { Ref: "PU-014", NextCheck: "2026-10-05" } }],
    },
  });
}

async function withFleet(fetch = sharepoint()) {
  const tool = await createTestTool({
    as: manager,
    fetch,
    secrets: { SHAREPOINT_TOKEN: "test-token" },
  });
  await tool.call("sites.create", { name: "Nantes depot", city: "Nantes" });
  await tool.call("equipments.import", {
    csv: "ref,type,site,next_check\nCH-001,chiller,Nantes depot,2026-01-15\nPU-014,pump,Nantes depot,",
    dryRun: false,
  });
  return { tool, fetch };
}

describe("jobs/sync-sharepoint", () => {
  it("runs at 2 am Paris time, not otherwise", async () => {
    const { tool } = await withFleet();
    expect(await tool.scheduled(new Date("2026-11-03T01:00:00Z"))).toEqual(["sync-sharepoint"]);
    expect(await tool.scheduled(new Date("2026-11-03T02:00:00Z"))).toEqual([]);
  });

  it("links rows to their SharePoint item and updates the check date, across pages", async () => {
    const { tool, fetch } = await withFleet();
    await tool.runJob("sync-sharepoint");
    expect(fetch.calls).toHaveLength(2);
    expect(fetch.calls[0]!.headers.Authorization).toBe("Bearer test-token");
    expect(await tool.call("equipments.get", { ref: "CH-001" })).toMatchObject({
      external_id: "sp-1",
      next_check: "2026-09-01",
    });
    expect(await tool.call("equipments.get", { ref: "PU-014" })).toMatchObject({
      external_id: "sp-3",
      next_check: "2026-10-05",
    });
  });

  it("clears the date when the list has none, then follows external_id", async () => {
    const { tool } = await withFleet();
    await tool.runJob("sync-sharepoint");
    const later = await createTestTool({
      as: manager,
      fetch: mockFetch({
        [FIRST]: { value: [{ id: "sp-1", fields: { NextCheck: null } }] },
      }),
      secrets: { SHAREPOINT_TOKEN: "t" },
    });
    // A separate tool has its own database: redo the link there, then sync by external_id only.
    await later.call("sites.create", { name: "S", city: "C" });
    await later.call("equipments.import", {
      csv: "ref,type,site,next_check\nCH-001,chiller,S,2026-01-01",
      dryRun: false,
    });
    await later.db.updateTable("equipments").set({ external_id: "sp-1" }).execute();
    await later.runJob("sync-sharepoint");
    expect(await later.call("equipments.get", { ref: "CH-001" })).toMatchObject({
      next_check: null,
    });
  });

  it("records the run with what it matched", async () => {
    const { tool } = await withFleet();
    await tool.runJob("sync-sharepoint");
    // The import of the fleet and this run can share a millisecond: do not rely on their order.
    const runs = (await tool.call("sync-runs.list", {})) as Array<{ source: string }>;
    expect(runs.map((r) => r.source).sort()).toEqual(["csv", "sharepoint"]);
    expect(runs.find((r) => r.source === "sharepoint")).toMatchObject({
      items: 3,
      updated: 2,
      by_email: expect.any(String),
    });
    expect(tool.events.at(-1)).toMatchObject({ event: "inventory.synced" });
  });

  it("fails without leaving a half-done run when SharePoint refuses", async () => {
    const { tool } = await withFleet(mockFetch({ [FIRST]: { status: 401 } }));
    const failing = await createTestTool({
      as: manager,
      fetch: mockFetch({ [FIRST]: reply401() }),
      secrets: { SHAREPOINT_TOKEN: "bad" },
    });
    await expect(failing.runJob("sync-sharepoint")).rejects.toThrow(/401/);
    expect(await tool.call("sync-runs.list", {})).toHaveLength(1);
  });

  it("needs its secret", async () => {
    const tool = await createTestTool({ as: manager, fetch: sharepoint() });
    await expect(tool.runJob("sync-sharepoint")).rejects.toThrow(/SHAREPOINT_TOKEN/);
  });
});

function reply401() {
  return reply(401, { error: "unauthorized" });
}
import { reply } from "@forgeron/sdk/testing";
