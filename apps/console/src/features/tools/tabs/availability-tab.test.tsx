// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount } from "../../../test-utils";
import { tabProps } from "../test-helpers";
import AvailabilityTab from "./availability-tab";

afterEach(cleanup);

const members = {
  members: [
    { id: "m1", email: "ada@acme.example", name: "Ada", roles: ["admin"] },
    { id: "m2", email: "bob@acme.example", name: "Bob", roles: ["support"] },
  ],
  invitations: [],
  settings: { domains: [], defaultRole: "" },
};

describe("the Availability tab (D-117)", () => {
  it("warns that a tool without a rule is open, then saves the roles that may add it", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/odoo/availability": { mode: "open", roles: [], people: [], updatedAt: null },
      "/api/members": members,
      "PUT /api/tools/odoo/availability": (body: unknown) => ({
        ...(body as object),
        people: [],
        updatedAt: "x",
      }),
    });
    const view = await mount(<AvailabilityTab {...tabProps(api, "odoo")} />);
    expect(view.textContent).toContain("open to everyone without being added");
    await click(view.querySelector<HTMLInputElement>("input[value=roles]"));
    const support = [...view.querySelectorAll("label")].find((l) => l.textContent === "support");
    expect([...view.querySelectorAll("label")].some((l) => l.textContent === "admin")).toBe(false);
    await click(support!.querySelector("input"));
    await click(button(view, "Save"));
    expect(sent.map((s) => [s.method, s.path, s.body])).toEqual([
      ["PUT", "/api/tools/odoo/availability", { mode: "roles", roles: ["support"] }],
    ]);
    expect(view.textContent).toContain("Saved.");
  });

  it("lets an admin pick people", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/odoo/availability": { mode: "nobody", roles: [], people: [], updatedAt: "x" },
      "/api/members": members,
      "PUT /api/tools/odoo/availability": {
        mode: "people",
        roles: [],
        people: ["m2"],
        updatedAt: "x",
      },
    });
    const view = await mount(<AvailabilityTab {...tabProps(api, "odoo")} />);
    await click(view.querySelector<HTMLInputElement>("input[value=people]"));
    const bob = [...view.querySelectorAll("label")].find((l) => l.textContent?.startsWith("Bob"));
    await click(bob!.querySelector("input"));
    await click(button(view, "Save"));
    expect(sent[0]!.body).toEqual({ mode: "people", people: ["m2"] });
  });
});

describe("pilots in the Availability tab (D-119, D-120)", () => {
  it("opens the branch the page shows to some people, and nothing else", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/odoo/previews/pilot-a/availability": {
        mode: "open",
        roles: [],
        people: [],
        updatedAt: null,
      },
      "/api/members": members,
      "PUT /api/tools/odoo/previews/pilot-a/availability": {
        mode: "people",
        roles: [],
        people: ["m2"],
        updatedAt: "y",
      },
    });
    const view = await mount(<AvailabilityTab {...tabProps(api, "odoo")} branch="pilot-a" />);
    expect(view.textContent).toContain("Who can use this branch");
    expect(view.textContent).toContain("Admins and developers only");
    expect(view.textContent).not.toContain("Who can add this tool");
    await click(view.querySelector<HTMLInputElement>("input[value=people]"));
    const bob = [...view.querySelectorAll("label")].find((l) => l.textContent?.startsWith("Bob"));
    await click(bob!.querySelector("input"));
    await click(button(view, "Save"));
    expect(sent.map((s) => [s.method, s.path, s.body])).toEqual([
      ["PUT", "/api/tools/odoo/previews/pilot-a/availability", { mode: "people", people: ["m2"] }],
    ]);
  });

  it("points to the channel picker from production", async () => {
    const { api } = fakeApi({
      "/api/tools/odoo/availability": { mode: "nobody", roles: [], people: [], updatedAt: "x" },
      "/api/members": members,
    });
    const view = await mount(<AvailabilityTab {...tabProps(api, "odoo")} />);
    expect(view.textContent).toContain("Who can add this tool");
    expect(view.textContent).toContain("choose it at the top of the page");
    expect(view.querySelector("details")).toBeNull();
  });

  it("opens a permanent channel by its reference, ~<name> (D-125)", async () => {
    const { api } = fakeApi({
      "/api/tools/odoo/previews/~staging/availability": {
        mode: "open",
        roles: [],
        people: [],
        updatedAt: null,
      },
      "/api/members": members,
    });
    const view = await mount(<AvailabilityTab {...tabProps(api, "odoo")} branch="~staging" />);
    expect(view.textContent).toContain("Who can use this channel");
    expect(view.textContent).toContain("It takes the releases of the branch it follows.");
  });
});
