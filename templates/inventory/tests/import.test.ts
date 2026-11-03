import { describe, expect, it } from "vitest";
import { admin, createTestTool, CSV, technician, twoSites } from "./helpers";

type Report = {
  rows: number;
  valid: number;
  created: number;
  updated: number;
  errors: string[];
  applied: boolean;
};

describe("equipments.import", () => {
  it("only reports by default (dry run), and writes nothing", async () => {
    const tool = await createTestTool({ as: admin });
    await twoSites(tool);
    const report = (await tool.call("equipments.import", { csv: CSV })) as Report;
    expect(report).toEqual({
      rows: 2,
      valid: 2,
      created: 2,
      updated: 0,
      errors: [],
      applied: false,
    });
    expect(await tool.call("equipments.search", {})).toMatchObject({ items: [] });
  });

  it("imports the rows, matching sites by name without case, with extra columns as attributes", async () => {
    const tool = await createTestTool({ as: admin });
    await twoSites(tool);
    const report = (await tool.call("equipments.import", { csv: CSV, dryRun: false })) as Report;
    expect(report.applied).toBe(true);
    const chiller = await tool.call("equipments.get", { ref: "CH-001" });
    expect(chiller).toMatchObject({
      type: "chiller",
      site: "Nantes depot",
      city: "Nantes",
      next_check: "2026-01-15",
      attributes: { power_kw: 12.5, serial: "S1" },
    });
    expect(await tool.call("equipments.get", { ref: "PU-014" })).toMatchObject({
      site: "Lyon workshop",
      next_check: null,
    });
  });

  it("updates equipment that has the same ref, and records the run", async () => {
    const tool = await createTestTool({ as: admin });
    await twoSites(tool);
    await tool.call("equipments.import", { csv: CSV, dryRun: false });
    const again = (await tool.call("equipments.import", {
      csv: "ref,type,site,next_check\nCH-001,chiller,Lyon workshop,2027-02-01",
      dryRun: false,
    })) as Report;
    expect(again).toMatchObject({ created: 0, updated: 1 });
    expect(await tool.call("equipments.get", { ref: "CH-001" })).toMatchObject({
      city: "Lyon",
      next_check: "2027-02-01",
    });
    const runs = (await tool.call("sync-runs.list", {})) as Array<{ items: number }>;
    expect(runs.map((r) => r.items).sort()).toEqual([1, 2]);
    expect(runs[0]).toMatchObject({ source: "csv", by_email: "ada@acme.fr" });
  });

  it("refuses the whole file when a row is wrong, and says which", async () => {
    const tool = await createTestTool({ as: admin });
    await twoSites(tool);
    const csv = [
      "ref,type,site,next_check",
      "A,pump,Nowhere,",
      "B,pump,Nantes depot,31/12/2026",
      ",pump,Nantes depot,",
      "C,pump,Nantes depot,",
      "C,pump,Nantes depot,",
    ].join("\n");
    const report = (await tool.call("equipments.import", { csv, dryRun: false })) as Report;
    expect(report).toMatchObject({ rows: 5, valid: 1, applied: false });
    expect(report.errors).toEqual([
      'Row 2: unknown site "Nowhere"',
      'Row 3: next_check "31/12/2026" is not a date YYYY-MM-DD',
      "Row 4: ref is empty",
      'Row 6: ref "C" appears twice',
    ]);
    expect(await tool.call("equipments.search", {})).toMatchObject({ items: [] });
  });

  it("reads quoted fields and CRLF line ends", async () => {
    const tool = await createTestTool({ as: admin });
    await tool.call("sites.create", { name: "Paris, HQ", city: "Paris" });
    const csv = 'ref,type,site\r\nX1,"air, handler","Paris, HQ"\r\n';
    expect(await tool.call("equipments.import", { csv, dryRun: false })).toMatchObject({
      applied: true,
    });
    expect(await tool.call("equipments.get", { ref: "X1" })).toMatchObject({
      type: "air, handler",
    });
  });

  it("needs the import level: technicians write but do not import", async () => {
    const tool = await createTestTool({ as: technician });
    await expect(tool.call("equipments.import", { csv: CSV })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
