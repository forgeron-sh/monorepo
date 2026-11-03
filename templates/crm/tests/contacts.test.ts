import { describe, expect, it } from "vitest";
import { createTestTool, sales, support } from "./helpers";

const durand = { first_name: "Ana", last_name: "Durand", email: "ana@acme.fr" };

async function withContacts() {
  const tool = await createTestTool({ as: sales });
  const company = (await tool.call("companies.upsert", {
    name: "Globex",
    domain: "globex.com",
  })) as { id: string };
  await tool.call("contacts.create", { ...durand, company_id: company.id });
  await tool.call("contacts.create", {
    first_name: "Léa",
    last_name: "Martin",
    email: "lea@other.org",
  });
  return tool;
}

const names = (rows: unknown) => (rows as Array<{ last_name: string }>).map((r) => r.last_name);

describe("contacts.search", () => {
  it.each([
    ["last name", "Dura"],
    ["first name", "Léa"],
    ["email", "lea@"],
    ["company", "Globex"],
  ])("finds a contact by its %s", async (_, query) => {
    const tool = await withContacts();
    const found = names(await tool.call("contacts.search", { query }));
    expect(found).toEqual(query === "Léa" || query === "lea@" ? ["Martin"] : ["Durand"]);
  });

  it("gives the company of a contact, and none for one without", async () => {
    const tool = await withContacts();
    const company = async (query: string) =>
      ((await tool.call("contacts.search", { query })) as Array<{ company: string | null }>)[0]!
        .company;
    expect(await company("Durand")).toBe("Globex");
    expect(await company("Martin")).toBeNull();
  });

  it("finds nobody for text that matches nothing", async () => {
    expect(await (await withContacts()).call("contacts.search", { query: "zzz" })).toEqual([]);
  });

  it("asks for at least two characters, and caps the number of results", async () => {
    const tool = await withContacts();
    await expect(tool.call("contacts.search", { query: "a" })).rejects.toMatchObject({
      code: "INVALID",
    });
    await expect(tool.call("contacts.search", { query: "an", limit: 500 })).rejects.toMatchObject({
      code: "INVALID",
    });
    expect(await tool.call("contacts.search", { query: "an", limit: 1 })).toHaveLength(1);
  });

  it("is open to read-only roles", async () => {
    const tool = await withContacts();
    expect(names(await tool.as(support).call("contacts.search", { query: "Durand" }))).toEqual([
      "Durand",
    ]);
  });
});

describe("contacts.create", () => {
  it("answers CONFLICT, not an internal error, when the email is taken", async () => {
    const tool = await withContacts();
    await expect(
      tool.call("contacts.create", { first_name: "Bo", last_name: "Bis", email: "ana@acme.fr" }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "A contact already uses this email.",
    });
  });

  it("refuses an email that is not one, and a contact with no name", async () => {
    const tool = await createTestTool({ as: sales });
    await expect(
      tool.call("contacts.create", { first_name: "A", last_name: "B", email: "nope" }),
    ).rejects.toMatchObject({ code: "INVALID" });
    await expect(
      tool.call("contacts.create", { first_name: "", last_name: "B" }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("is refused to read-only roles", async () => {
    const tool = await createTestTool({ as: support });
    await expect(tool.call("contacts.create", durand)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("contacts.update", () => {
  const find = async (tool: Awaited<ReturnType<typeof withContacts>>, query: string) =>
    ((await tool.call("contacts.search", { query })) as Array<{ id: string }>)[0]!.id;

  it("changes only what is given", async () => {
    const tool = await withContacts();
    const id = await find(tool, "Durand");
    const updated = await tool.call("contacts.update", { id, phone: "+33 1 23 45" });
    expect(updated).toMatchObject({
      id,
      first_name: "Ana",
      last_name: "Durand",
      phone: "+33 1 23 45",
    });
  });

  it("clears a field when given null", async () => {
    const tool = await withContacts();
    const id = await find(tool, "Durand");
    expect(await tool.call("contacts.update", { id, email: null })).toMatchObject({ email: null });
  });

  it("detaches a contact from its company", async () => {
    const tool = await withContacts();
    const id = await find(tool, "Durand");
    expect(await tool.call("contacts.update", { id, company_id: null })).toMatchObject({
      company_id: null,
    });
  });

  it("says when there is nothing to update, and when the contact does not exist", async () => {
    const tool = await withContacts();
    const id = await find(tool, "Durand");
    await expect(tool.call("contacts.update", { id })).rejects.toMatchObject({ code: "INVALID" });
    await expect(tool.call("contacts.update", { id: "nope", phone: "1" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("answers CONFLICT when the new email is taken", async () => {
    const tool = await withContacts();
    const id = await find(tool, "Martin");
    await expect(tool.call("contacts.update", { id, email: "ana@acme.fr" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
