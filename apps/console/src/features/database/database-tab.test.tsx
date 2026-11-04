// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import type { Api } from "../../api";
import { mockDatabase } from "../../mock/database";
import { button, cleanup, click, flush, mount, type } from "../../test-utils";
import { DatabaseTab } from "./database-tab";

afterEach(cleanup);

/** The harness's database behind the `Api` a screen takes, remembering what was asked. */
function api(
  environments = [{ name: "production" }, { name: "preview", branch: "feat-contacts" }],
) {
  const reads: string[] = [];
  const fake: Api = {
    fetchJson: async (path) => {
      reads.push(path);
      const url = new URL(path, "https://console.test");
      if (url.pathname.endsWith("/db/environments")) return { environments };
      const answer = mockDatabase(url.pathname, url.searchParams);
      if (!answer || answer.status !== 200) throw new Error(`${path}: ${answer?.status}`);
      return answer.body;
    },
    sendJson: async () => {
      throw new Error("The database explorer never writes.");
    },
  };
  return { api: fake, reads };
}

/** The tab loads in steps (environments, tables, rows): let each answer land. */
async function open(fake: Api) {
  const page = await mount(<DatabaseTab tool="crm" api={fake} />);
  for (let i = 0; i < 4; i++) await flush();
  return page;
}
const tab = (page: HTMLElement, name: string) =>
  [...page.querySelectorAll('[role="tab"]')].find((t) => t.textContent === name);
const table = (page: HTMLElement, name: string) =>
  [...page.querySelectorAll(".fc-db-table")].find((t) => t.textContent?.startsWith(name));

describe("DatabaseTab", () => {
  it("lists the tables with their counts and shows the first one", async () => {
    const { api: fake } = api();
    const page = await open(fake);
    expect(table(page, "companies")?.textContent).toContain("6");
    expect(table(page, "contacts")?.textContent).toContain("137");
    expect(page.querySelector(".fg-grid")?.textContent).toContain("Primary");
  });

  it("masks the personal columns and says why, in the grid and in the row drawer", async () => {
    const { api: fake } = api();
    const page = await open(fake);
    await click(table(page, "contacts"));
    for (let i = 0; i < 3; i++) await flush();
    await flush();
    const grid = page.querySelector(".fg-grid")!;
    expect(grid.textContent).toContain("masked");
    expect(grid.textContent).not.toContain("@acme");
    await click(grid.querySelector("tbody tr"));
    const drawer = page.querySelector(".fg-drawer")!;
    expect(drawer.textContent).toContain("tagged as personal data in the schema");
    expect(drawer.textContent).toContain("the name suggests personal data");
  });

  it("shows the definition and the relations of the schema", async () => {
    const { api: fake } = api();
    const page = await open(fake);
    await click(table(page, "contacts"));
    for (let i = 0; i < 3; i++) await flush();
    await click(tab(page, "Definition"));
    await flush();
    expect(page.textContent).toContain("contacts_email_unique");
    await click(tab(page, "Schema"));
    await flush();
    expect(page.querySelector(".fc-db-relations")?.textContent).toContain(
      "contacts.company_id → companies.id",
    );
  });

  it("offers an export of the rows that match, as a link to the gateway", async () => {
    const { api: fake } = api();
    const page = await open(fake);
    const link = [...page.querySelectorAll("a")].find((a) => a.textContent === "Export CSV")!;
    expect(link.getAttribute("href")).toContain(
      "/console-api/api/tools/crm/db/tables/companies/export",
    );
  });

  it("says what to do when nothing is deployed", async () => {
    const { api: fake } = api([]);
    const page = await open(fake);
    expect(page.textContent).toContain("Nothing deployed yet");
  });

  it("filters on the server, with a typed operator, and goes back to the first page", async () => {
    const { api: fake, reads } = api();
    const page = await open(fake);
    await click(table(page, "contacts"));
    for (let i = 0; i < 3; i++) await flush();
    await click(button(page, "Add filter"));
    const [column, operator] = [
      ...page.querySelectorAll<HTMLSelectElement>(".fc-db-filter select"),
    ];
    expect([...operator!.options].map((o) => o.value)).toContain("startsWith");
    await act(column!, "visits");
    expect([...operator!.options].map((o) => o.value)).not.toContain("startsWith");
    type(page.querySelector<HTMLInputElement>(".fc-db-filter input")!, "38");
    await click(button(page, "Apply"));
    const last = reads.at(-1)!;
    expect(decodeURIComponent(last)).toContain(`"column":"visits"`);
    expect(page.querySelector(".fg-pager-range")?.textContent).toContain("of ");
  });
});

import { act as reactAct } from "react";
async function act(select: HTMLSelectElement, value: string) {
  await reactAct(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!;
    setter.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
