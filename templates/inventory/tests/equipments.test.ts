import { describe, expect, it } from "vitest";
import { manager, createTestTool, reader, technician } from "./helpers";

type Page = { items: Array<{ ref: string; city: string }>; nextCursor: string | null };

async function fleet() {
  const tool = await createTestTool({ as: manager });
  await tool.call("sites.create", { name: "Nantes depot", city: "Nantes" });
  await tool.call("sites.create", { name: "Lyon workshop", city: "Lyon" });
  const rows = ["ref,type,site,next_check"];
  for (let i = 1; i <= 5; i++) rows.push(`N-${i},chiller,Nantes depot,2026-0${i}-10`);
  rows.push("L-1,pump,Lyon workshop,2027-01-01");
  await tool.call("equipments.import", { csv: rows.join("\n"), dryRun: false });
  return tool;
}

describe("equipments.search", () => {
  it("answers 'which equipment at Nantes has an overdue check?'", async () => {
    const tool = await fleet();
    const page = (await tool.call("equipments.search", {
      city: "Nantes",
      checkBefore: "2026-03-01",
    })) as Page;
    expect(page.items.map((i) => i.ref).sort()).toEqual(["N-1", "N-2"]);
    expect(page.nextCursor).toBeNull();
  });

  it("filters on type and site", async () => {
    const tool = await fleet();
    const pumps = (await tool.call("equipments.search", { type: "pump" })) as Page;
    expect(pumps.items.map((i) => i.ref)).toEqual(["L-1"]);
    const lyon = (await tool.call("equipments.search", { site: "Lyon workshop" })) as Page;
    expect(lyon.items).toHaveLength(1);
  });

  it("pages through everything with nextCursor, without gaps or repeats", async () => {
    const tool = await fleet();
    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const page = (await tool.call("equipments.search", { limit: 4, cursor })) as Page;
      seen.push(...page.items.map((i) => i.ref));
      cursor = page.nextCursor ?? undefined;
      pages++;
    } while (cursor);
    expect(pages).toBe(2);
    expect(seen.sort()).toEqual(["L-1", "N-1", "N-2", "N-3", "N-4", "N-5"]);
  });

  it("is open to readers", async () => {
    const tool = await createTestTool({ as: reader });
    expect(await tool.call("equipments.search", {})).toEqual({ items: [], nextCursor: null });
  });
});

describe("equipments.get", () => {
  it("needs exactly one of id or ref", async () => {
    const tool = await fleet();
    await expect(tool.call("equipments.get", {})).rejects.toMatchObject({ code: "INVALID" });
    await expect(tool.call("equipments.get", { id: "a", ref: "b" })).rejects.toMatchObject({
      code: "INVALID",
    });
  });

  it("says when there is no such equipment", async () => {
    const tool = await fleet();
    await expect(tool.call("equipments.get", { ref: "nope" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("equipments.set-attributes", () => {
  it("merges keys, validates known ones and removes with null", async () => {
    const tool = await fleet();
    const { id } = (await tool.call("equipments.get", { ref: "N-1" })) as { id: string };
    await tool.call("equipments.set-attributes", {
      id,
      attributes: { power_kw: 7, colour: "grey" },
    });
    expect(
      await tool.call("equipments.set-attributes", { id, attributes: { refrigerant: "R32" } }),
    ).toEqual({ id, attributes: { power_kw: 7, colour: "grey", refrigerant: "R32" } });
    expect(
      await tool.call("equipments.set-attributes", { id, attributes: { colour: null } }),
    ).toMatchObject({ attributes: { power_kw: 7, refrigerant: "R32" } });
    await expect(
      tool.call("equipments.set-attributes", { id, attributes: { power_kw: "high" } }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("is refused to readers, and NOT_FOUND for an unknown id", async () => {
    const tool = await fleet();
    await expect(
      tool.as(reader).call("equipments.set-attributes", { id: "x", attributes: {} }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      tool.as(technician).call("equipments.set-attributes", { id: "x", attributes: {} }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

// The test platform has no file storage yet (`ctx.files`), so storing a file cannot be run here:
// these are the checks that happen before it.
describe("equipments.attach", () => {
  const file = { name: "a.pdf", content_type: "application/pdf", content_base64: "JVBERg==" };

  it("refuses what is neither a PDF nor an image", async () => {
    const tool = await fleet();
    const { id } = (await tool.call("equipments.get", { ref: "N-1" })) as { id: string };
    await expect(
      tool.call("equipments.attach", { id, ...file, content_type: "text/csv" }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("refuses unknown equipment and bad base64", async () => {
    const tool = await fleet();
    await expect(tool.call("equipments.attach", { id: "nope", ...file })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const { id } = (await tool.call("equipments.get", { ref: "N-1" })) as { id: string };
    await expect(
      tool.call("equipments.attach", { id, ...file, content_base64: "***" }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("is refused to readers", async () => {
    const tool = await createTestTool({ as: reader });
    await expect(tool.call("equipments.attach", { id: "x", ...file })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
