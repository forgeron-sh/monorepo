// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  button,
  cleanup,
  click,
  fakeApi,
  field,
  mount,
  refusal,
  submit,
  type,
} from "../../../test-utils";
import { tabProps } from "../test-helpers";
import PeopleSecrets from "./people-secrets";

afterEach(cleanup);

// Test values only. Nothing here is a real key.
const VALUE = "typed-by-the-admin-test-value";
const members = {
  members: [
    { id: "m1", email: "ada@acme.test", name: "ada", teams: ["admin"] },
    { id: "m2", email: "bob@acme.test", name: "bob", teams: [] },
  ],
  invitations: [],
  settings: { domains: [], defaultRole: "", source: "install" },
};
const holders = { holders: [{ person: "m2", names: ["ODOO_API_KEY"] }] };

const open = (extra: Record<string, unknown> = {}) => {
  const fake = fakeApi({
    "/api/tools/crm/user-secrets": holders,
    "/api/members": members,
    ...extra,
  });
  return { ...fake, page: mount(<PeopleSecrets {...tabProps(fake.api)} />) };
};
const choose = (page: HTMLElement, value: string) =>
  act(async () => {
    const select = page.querySelector("select")!;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

describe("what people hold for a tool", () => {
  it("lists who holds which secret by name, with the member's name and email, and no value", async () => {
    const page = await open().page;
    expect(page.textContent).toContain("bob (bob@acme.test)");
    expect(page.textContent).toContain("ODOO_API_KEY");
  });

  it("sets a secret for a person, sends the value in a body only, and shows it nowhere", async () => {
    const { page: pending, sent } = open({
      "PUT /api/tools/crm/user-secrets/m2/ODOO_API_KEY": undefined,
    });
    const page = await pending;
    await choose(page, "m2");
    await type(field(page, "Secret name"), "odoo_api_key");
    await type(field(page, "Value"), VALUE);
    await submit(page.querySelector("form"));
    expect(sent).toEqual([
      {
        path: "/api/tools/crm/user-secrets/m2/ODOO_API_KEY",
        body: { value: VALUE },
        method: "PUT",
      },
    ]);
    expect(sent.map((s) => s.path).join()).not.toContain(VALUE);
    expect(page.textContent).toContain("ODOO_API_KEY is set for that person");
    expect(page.innerHTML).not.toContain(VALUE);
    expect(field(page, "Value").value).toBe("");
  });

  it("says what the platform said when it refuses, and shows no value as text", async () => {
    const { page: pending } = open({
      "PUT /api/tools/crm/user-secrets/m2/NOPE": () => {
        throw refusal(404, "The tool declares no such secret.");
      },
    });
    const page = await pending;
    await choose(page, "m2");
    await type(field(page, "Secret name"), "NOPE");
    await type(field(page, "Value"), VALUE);
    await submit(page.querySelector("form"));
    expect(page.textContent).toContain("The tool declares no such secret.");
    // The value stays only in the masked field, so the admin can correct the name and send again.
    expect(page.textContent).not.toContain(VALUE);
    expect(field(page, "Value").type).toBe("password");
  });

  it("does not send without a person, a valid name and a value", async () => {
    const { page: pending, sent } = open();
    const page = await pending;
    await type(field(page, "Secret name"), "ok_name");
    await type(field(page, "Value"), VALUE);
    await submit(page.querySelector("form"));
    expect(sent).toEqual([]);
  });

  it("revokes one secret of one person", async () => {
    const { page: pending, sent } = open({
      "DELETE /api/tools/crm/user-secrets/m2/ODOO_API_KEY": { revoked: 1 },
    });
    const page = await pending;
    await click(button(page, "ODOO_API_KEY · Revoke"));
    expect(sent).toEqual([
      { path: "/api/tools/crm/user-secrets/m2/ODOO_API_KEY", body: undefined, method: "DELETE" },
    ]);
    expect(page.textContent).toContain("ODOO_API_KEY is revoked for bob (bob@acme.test)");
  });
});
