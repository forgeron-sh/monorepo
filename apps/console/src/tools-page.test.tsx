// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, click, fakeApi, mount, refusal } from "./test-utils";
import { ToolPage, ToolsPage } from "./tools-page";

afterEach(cleanup);

const tools = {
  tools: [{ name: "crm", production: "1.0.0", previews: [] }],
};
const matrix = {
  roles: ["admin"],
  actions: ["crm.contacts.list"],
  cells: { admin: { "crm.contacts.list": { default: true, allowed: true } } },
};

describe("ToolsPage", () => {
  it("lists the tools and opens one on a click", async () => {
    const { api } = fakeApi({ "/api/tools": tools });
    const go = vi.fn<(href: string) => void>();
    const page = await mount(<ToolsPage api={api} go={go} />);
    expect(page.textContent).toContain("1.0.0");
    await click(page.querySelector("tbody tr"));
    expect(go).toHaveBeenCalledWith("/tools/crm");
  });
  it("says what to do when there is no tool yet", async () => {
    const { api } = fakeApi({ "/api/tools": { tools: [] } });
    const page = await mount(<ToolsPage api={api} go={() => {}} />);
    expect(page.textContent).toContain("No tool yet");
    expect(page.textContent).toContain("forgeron init");
  });
  it("says what happened when it cannot load", async () => {
    const { api } = fakeApi({
      "/api/tools": () => {
        throw refusal(500);
      },
    });
    const page = await mount(<ToolsPage api={api} go={() => {}} />);
    expect(page.querySelector("[role=alert]")?.textContent).toContain("could not be loaded");
  });
});

describe("ToolPage", () => {
  const routes = {
    "/api/tools": tools,
    "/api/tools/crm/access-matrix": matrix,
    "/api/tools/crm/secrets-status": {
      secrets: [{ name: "ODOO_KEY", environments: { preview: "set" } }],
    },
  };
  it("shows the access matrix, then the secrets status without any value", async () => {
    const { api } = fakeApi(routes);
    const page = await mount(<ToolPage name="crm" api={api} admin />);
    expect(page.textContent).toContain("crm.contacts.list");
    await click(
      [...page.querySelectorAll('[role="tab"]')].find((t) => t.textContent === "Secrets"),
    );
    expect(page.textContent).toContain("ODOO_KEY");
    expect(page.textContent).toContain("forgeron secrets set <NAME>");
  });
  it("keeps the matrix from a non-admin", async () => {
    const { api, reads } = fakeApi(routes);
    const page = await mount(<ToolPage name="crm" api={api} admin={false} />);
    expect(page.textContent).toContain("The access matrix is for admins.");
    expect(reads).not.toContain("/api/tools/crm/access-matrix");
  });
  it("says so when the tool does not exist", async () => {
    const { api } = fakeApi(routes);
    const page = await mount(<ToolPage name="nope" api={api} admin />);
    expect(page.textContent).toContain("There is no tool named nope.");
  });
});
