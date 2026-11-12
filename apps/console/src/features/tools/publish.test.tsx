// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount, type } from "../../test-utils";
import { audience, PublishBadge, PublishControl, usePublishing } from "./publish";
import type { Api } from "../../api";

/** The badge next to the title and the control on the right, as the tool page shows them. */
function Publish({ tool, branch, api }: { tool: string; branch?: string; api: Api }) {
  const publishing = usePublishing(api, tool, branch, true);
  const where = branch !== undefined ? { branch } : {};
  return (
    <>
      <PublishBadge publishing={publishing} {...where} />
      <PublishControl tool={tool} api={api} publishing={publishing} {...where} />
    </>
  );
}

afterEach(cleanup);

// Draft and Published, at the right of the tool's header (D-129).

const members = {
  members: [
    { id: "m1", email: "ada@acme.example", name: "Ada", roles: ["admin"] },
    { id: "m2", email: "bob@acme.example", name: "Bob", roles: ["support"] },
    { id: "m3", email: "cleo@acme.example", name: "Cleo", roles: ["developer"] },
    { id: "m4", email: "dan@acme.example", name: "Dan", roles: [] },
  ],
  invitations: [],
  settings: { domains: [], defaultRole: "" },
};
const rule = (mode: string, extra: Record<string, unknown> = {}) => ({
  mode,
  roles: [],
  people: [],
  updatedAt: "x",
  ...extra,
});
/** What the badge next to the title says about who reaches the channel, on hover. */
const who = (view: HTMLElement) =>
  view.querySelector('[role="status"][title]')?.getAttribute("title");
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const inDialog = (label: string) =>
  [...dialog().querySelectorAll("button")].find((b) => b.textContent === label);
const openMenu = async (view: HTMLElement) =>
  click(view.querySelector('button[aria-label="More sharing actions"]'));
const menuItems = () =>
  [...document.querySelectorAll('[role="menu"] [role="menuitem"]')].map((i) => i.textContent);

describe("the publish control (D-129)", () => {
  it("shows a draft, and publishes it to everyone after saying who gets access", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/crm/availability": rule("nobody"),
      "/api/members": members,
      "PUT /api/tools/crm/availability": rule("everyone"),
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    expect(view.textContent).toContain("Draft");
    expect(who(view)).toContain("Admins only");
    await openMenu(view);
    expect(menuItems()).toEqual(["Who has access"]);
    await click(document.querySelector('button[aria-label="More sharing actions"]'));
    await click(button(view, "Publish"));
    expect(dialog().textContent).toContain("Publish crm");
    expect(dialog().textContent).toContain("4 people will have access: everyone in the workspace.");
    await click(inDialog("Publish"));
    expect(sent.map((s) => [s.method, s.path, s.body])).toEqual([
      ["PUT", "/api/tools/crm/availability", { mode: "everyone" }],
    ]);
  });

  it("publishes to roles, counting who they reach, and never offers admin or member", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/crm/availability": rule("nobody"),
      "/api/members": members,
      "PUT /api/tools/crm/availability": rule("roles", { roles: ["support"] }),
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    await click(button(view, "Publish"));
    await click(dialog().querySelector<HTMLInputElement>("input[value=roles]"));
    const labels = [...dialog().querySelectorAll(".fc-checks label")].map((l) => l.textContent);
    expect(labels).toEqual(["developer", "support"]);
    expect(inDialog("Publish")?.hasAttribute("disabled")).toBe(true);
    const support = [...dialog().querySelectorAll("label")].find(
      (l) => l.textContent === "support",
    );
    await click(support!.querySelector("input"));
    expect(dialog().textContent).toContain(
      "2 people will have access, of 4: admins, and the people who hold support.",
    );
    await click(inDialog("Publish"));
    expect(sent[0]!.body).toEqual({ mode: "roles", roles: ["support"] });
  });

  it("finds people by a search and publishes to them", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/crm/availability": rule("nobody"),
      "/api/members": members,
      "PUT /api/tools/crm/availability": rule("people", { people: ["m4"] }),
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    await click(button(view, "Publish"));
    await click(dialog().querySelector<HTMLInputElement>("input[value=people]"));
    expect(dialog().textContent).toContain("Type a name or an email");
    await type(dialog().querySelector<HTMLInputElement>("input[type=search]")!, "dan");
    const dan = [...dialog().querySelectorAll("label")].find((l) =>
      l.textContent?.startsWith("Dan"),
    );
    await click(dan!.querySelector("input"));
    await click(inDialog("Publish"));
    expect(sent[0]!.body).toEqual({ mode: "people", people: ["m4"] });
  });

  it("says who it is published to, manages the sharing, and unpublishes after a confirmation", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/crm/availability": rule("roles", { roles: ["developer", "support"] }),
      "/api/members": members,
      "PUT /api/tools/crm/availability": rule("nobody"),
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    expect(view.textContent).toContain("Published");
    expect(who(view)).toContain("developer, support");
    expect(button(view, "Manage sharing")).toBeTruthy();
    await openMenu(view);
    expect(menuItems()).toEqual(["Who has access", "Unpublish"]);
    await click(
      [...document.querySelectorAll('[role="menuitem"]')].find(
        (i) => i.textContent === "Unpublish",
      ),
    );
    expect(dialog().textContent).toContain("2 people other than admins will lose access");
    await click(inDialog("Unpublish"));
    expect(sent[0]!.body).toEqual({ mode: "nobody" });
  });

  it("lists who has access", async () => {
    const { api } = fakeApi({
      "/api/tools/crm/availability": rule("people", { people: ["m2"] }),
      "/api/members": members,
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    expect(who(view)).toContain("Bob");
    await openMenu(view);
    await click(
      [...document.querySelectorAll('[role="menuitem"]')].find(
        (i) => i.textContent === "Who has access",
      ),
    );
    expect(dialog().textContent).toContain("2 people");
    expect(dialog().textContent).toContain("Ada");
    expect(dialog().textContent).toContain("Bob");
    expect(dialog().textContent).not.toContain("Dan");
  });

  it("treats a channel with no rule as a draft, open to developers on a branch only", async () => {
    const open = rule("open", { updatedAt: null });
    const permanent = await mount(
      <Publish
        tool="crm"
        branch="~staging"
        api={
          fakeApi({
            "/api/tools/crm/previews/~staging/availability": open,
            "/api/members": members,
          }).api
        }
      />,
    );
    expect(permanent.textContent).toContain("Draft");
    expect(who(permanent)).toContain("Admins only");
    await cleanup();
    const branch = await mount(
      <Publish
        tool="crm"
        branch="feat-x"
        api={
          fakeApi({
            "/api/tools/crm/previews/feat-x/availability": open,
            "/api/members": members,
          }).api
        }
      />,
    );
    expect(who(branch)).toContain("Admins and developers");
  });

  it("shows production with no rule as published to everyone, as before libraries", async () => {
    const { api } = fakeApi({
      "/api/tools/crm/availability": rule("open", { updatedAt: null }),
      "/api/members": members,
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    expect(view.textContent).toContain("Published");
    expect(who(view)).toContain("everyone, without adding it");
    await click(button(view, "Manage sharing"));
    expect(dialog().textContent).toContain("open to everyone without being added");
  });
});

describe("audience", () => {
  it("always has the admins, and developers on a branch only", () => {
    const nobody = { mode: "nobody" as const, roles: [], people: [] };
    expect(audience(nobody, members.members).map((m) => m.id)).toEqual(["m1"]);
    expect(audience(nobody, members.members, "~staging").map((m) => m.id)).toEqual(["m1"]);
    expect(audience(nobody, members.members, "feat-x").map((m) => m.id)).toEqual(["m1", "m3"]);
    // Everyone holds member (D-128).
    expect(
      audience({ mode: "roles", roles: ["member"], people: [] }, members.members),
    ).toHaveLength(4);
  });
});
