// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount, TEAMS, type } from "../../test-utils";
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
    { id: "m1", email: "ada@acme.example", name: "Ada", teams: ["admin"] },
    { id: "m2", email: "bob@acme.example", name: "Bob", teams: ["support"] },
    { id: "m3", email: "cleo@acme.example", name: "Cleo", teams: ["developer"] },
    { id: "m4", email: "dan@acme.example", name: "Dan", teams: [] },
  ],
  invitations: [],
  settings: { domains: [], defaultTeams: [] },
};
// Ada holds every permission, Cleo may see and build tools; Bob and Dan hold none (D-136).
const teams = { teams: TEAMS };
const rule = (mode: string, extra: Record<string, unknown> = {}) => ({
  mode,
  teams: [],
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
      "/api/teams": teams,
      "PUT /api/tools/crm/availability": rule("everyone"),
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    expect(view.textContent).toContain("Draft");
    expect(who(view)).toContain("People who give access");
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

  it("publishes to teams, counting who they reach, and never offers the admin team", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/crm/availability": rule("nobody"),
      "/api/members": members,
      "/api/teams": teams,
      "PUT /api/tools/crm/availability": rule("teams", { teams: ["support"] }),
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    await click(button(view, "Publish"));
    await click(dialog().querySelector<HTMLInputElement>("input[value=teams]"));
    const labels = [...dialog().querySelectorAll(".fc-checks label")].map((l) => l.textContent);
    expect(labels).toEqual(["Developers", "Support"]);
    expect(inDialog("Publish")?.hasAttribute("disabled")).toBe(true);
    const support = [...dialog().querySelectorAll("label")].find(
      (l) => l.textContent === "Support",
    );
    await click(support!.querySelector("input"));
    expect(dialog().textContent).toContain(
      "2 people will have access, of 4: people who give access, and the members of Support.",
    );
    await click(inDialog("Publish"));
    expect(sent[0]!.body).toEqual({ mode: "teams", teams: ["support"] });
  });

  it("finds people by a search and publishes to them", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/crm/availability": rule("nobody"),
      "/api/members": members,
      "/api/teams": teams,
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
      "/api/tools/crm/availability": rule("teams", { teams: ["developer", "support"] }),
      "/api/members": members,
      "/api/teams": teams,
      "PUT /api/tools/crm/availability": rule("nobody"),
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    expect(view.textContent).toContain("Published");
    expect(who(view)).toContain("Developers, Support");
    expect(button(view, "Manage sharing")).toBeTruthy();
    await openMenu(view);
    expect(menuItems()).toEqual(["Who has access", "Unpublish"]);
    await click(
      [...document.querySelectorAll('[role="menuitem"]')].find(
        (i) => i.textContent === "Unpublish",
      ),
    );
    expect(dialog().textContent).toContain("2 people will lose access");
    await click(inDialog("Unpublish"));
    expect(sent[0]!.body).toEqual({ mode: "nobody" });
  });

  it("lists who has access", async () => {
    const { api } = fakeApi({
      "/api/tools/crm/availability": rule("people", { people: ["m2"] }),
      "/api/members": members,
      "/api/teams": teams,
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

  it("treats a channel with no rule as a draft, open to those who see tools on a branch only", async () => {
    const open = rule("open", { updatedAt: null });
    const permanent = await mount(
      <Publish
        tool="crm"
        branch="~staging"
        api={
          fakeApi({
            "/api/tools/crm/previews/~staging/availability": open,
            "/api/members": members,
            "/api/teams": teams,
          }).api
        }
      />,
    );
    expect(permanent.textContent).toContain("Draft");
    expect(who(permanent)).toContain("People who give access");
    await cleanup();
    const branch = await mount(
      <Publish
        tool="crm"
        branch="feat-x"
        api={
          fakeApi({
            "/api/tools/crm/previews/feat-x/availability": open,
            "/api/members": members,
            "/api/teams": teams,
          }).api
        }
      />,
    );
    expect(who(branch)).toContain("People who see tools");
  });

  it("shows production with no rule as published to everyone, as before libraries", async () => {
    const { api } = fakeApi({
      "/api/tools/crm/availability": rule("open", { updatedAt: null }),
      "/api/members": members,
      "/api/teams": teams,
    });
    const view = await mount(<Publish tool="crm" api={api} />);
    expect(view.textContent).toContain("Published");
    expect(who(view)).toContain("everyone, without adding it");
    await click(button(view, "Manage sharing"));
    expect(dialog().textContent).toContain("open to everyone without being added");
  });
});

describe("audience (D-136)", () => {
  const nobody = { mode: "nobody" as const, teams: [], people: [] };
  const ids = (list: Array<{ id: string }>) => list.map((m) => m.id);
  it("always has those who give access, and those who see tools on a branch only", () => {
    expect(ids(audience(nobody, members.members, TEAMS as never))).toEqual(["m1"]);
    expect(ids(audience(nobody, members.members, TEAMS as never, "~staging"))).toEqual(["m1"]);
    expect(ids(audience(nobody, members.members, TEAMS as never, "feat-x"))).toEqual(["m1", "m3"]);
  });
  it("adds the members of the teams it names, and everyone when it says so", () => {
    expect(
      ids(
        audience(
          { mode: "teams", teams: ["support"], people: [] },
          members.members,
          TEAMS as never,
        ),
      ),
    ).toEqual(["m1", "m2"]);
    expect(
      audience({ mode: "everyone", teams: [], people: [] }, members.members, TEAMS as never),
    ).toHaveLength(4);
  });
});
