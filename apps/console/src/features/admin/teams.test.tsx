// @vitest-environment jsdom
import { PLATFORM, PLATFORM_GROUPS, PLATFORM_PERMISSIONS } from "@forgeron/permissions";
import type { PlatformPermission } from "@forgeron/permissions";
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, field, mount, TEAMS, type } from "../../test-utils";
import type { WorkspaceInfo } from "../../workspace";
import TeamPage from "./pages/team";
import TeamsPage from "./pages/teams";

afterEach(cleanup);

const people = {
  members: [
    { id: "m1", email: "ada@acme.fr", name: "Ada", teams: ["admin"] },
    { id: "m2", email: "bob@acme.fr", name: "Bob", teams: ["developer"] },
    { id: "m3", email: "cy@acme.fr", name: "Cy", teams: ["support"] },
  ],
  invitations: [],
  settings: { domains: [], defaultTeams: [], source: "install" },
};

// What `GET /api/permissions` answers: the catalog the platform builds from `PLATFORM_GROUPS`.
const catalog = {
  groups: PLATFORM_GROUPS.map((g) => ({
    label: g.label,
    permissions: g.permissions.map((name) => ({
      name,
      label: PLATFORM.permissions[name].label,
      description: PLATFORM.permissions[name].description,
      implies: [...((PLATFORM.permissions[name] as { implies?: readonly string[] }).implies ?? [])],
    })),
  })),
};

const person = (
  permissions: readonly PlatformPermission[] = PLATFORM_PERMISSIONS,
): WorkspaceInfo => ({
  workspace: "demo",
  endpoint: "https://demo.test",
  person: { id: "m1", email: "ada@acme.fr", name: "Ada", teams: [], permissions: [...permissions] },
  setup: { members: 3, invitations: 0, tools: 0, deployed: 0, called: false },
});

const list = (
  api: ReturnType<typeof fakeApi>["api"],
  ws = person(),
  go: (href: string) => void = () => {},
) => mount(<TeamsPage api={api} ws={ws} go={go} now={() => new Date()} params={{}} />);
const one = (api: ReturnType<typeof fakeApi>["api"], id: string, ws = person()) =>
  mount(<TeamPage api={api} ws={ws} go={() => {}} now={() => new Date()} params={{ id }} />);

const routes = (extra: Record<string, unknown> = {}) => ({
  "/api/teams": { teams: TEAMS },
  "/api/permissions": catalog,
  "/api/members": people,
  ...extra,
});
const box = (scope: ParentNode, label: string) =>
  [...scope.querySelectorAll("label")]
    .find((l) => l.textContent?.startsWith(label))!
    .querySelector("input") as HTMLInputElement;

describe("Teams", () => {
  it("lists the teams: built-ins first with a badge, the member count and what each may do", async () => {
    const { api } = fakeApi(routes());
    const view = await list(api);
    const rows = [...view.querySelectorAll("tbody tr")].map((r) => r.textContent ?? "");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain("Admins");
    expect(rows[0]).toContain("Built in");
    expect(rows[0]).toContain("1 member");
    expect(rows[0]).toContain("Administers everything");
    expect(rows[1]).toContain("Developers");
    // Derived from its groups: builds tools, gives no access, no more.
    expect(rows[1]).toContain("Builds tools");
    expect(rows[1]).toContain("sees who has access");
    expect(rows[2]).toContain("Support");
    expect(rows[2]).toContain("Uses tools only");
    expect(view.textContent).not.toMatch(/\brole/i);
  });

  it("hides New team from someone who cannot manage teams, and opens a team on a click", async () => {
    const { api } = fakeApi(routes());
    const went: string[] = [];
    const view = await list(api, person([]), (href: string) => void went.push(href));
    expect(button(view, "New team")).toBeUndefined();
    await click(view.querySelectorAll("tbody tr")[2]);
    expect(went).toEqual(["/admin/teams/support"]);
  });

  it("creates a team whose address follows its name, then opens it", async () => {
    const { api, sent } = fakeApi(
      routes({
        "/api/teams": { teams: [] },
        "POST /api/teams": () => ({ ...TEAMS[2], id: "design-brand" }),
      }),
    );
    const went: string[] = [];
    const view = await list(api, person(), (href: string) => void went.push(href));
    expect(view.textContent).toContain("No team yet");
    await click(button(view, "New team"));
    const dialog = document.querySelector("[role=dialog]")!;
    await type(field(dialog, "Name"), "Design & Brand");
    await click(button(dialog as HTMLElement, "Create team"));
    expect(sent).toEqual([
      {
        path: "/api/teams",
        method: "POST",
        body: { id: "design-brand", name: "Design & Brand", description: "" },
      },
    ]);
    expect(went).toEqual(["/admin/teams/design-brand"]);
  });
});

describe("A team's permissions on Forgeron", () => {
  it("draws one card per group with a checkbox per permission and its description", async () => {
    const { api } = fakeApi(routes());
    const view = await one(api, "support");
    expect(view.textContent).toContain("Permissions on Forgeron");
    const cards = [...view.querySelectorAll("section[aria-label]")].map((c) =>
      c.getAttribute("aria-label"),
    );
    expect(cards).toEqual(PLATFORM_GROUPS.map((g) => g.label));
    expect(view.querySelectorAll(".fc-perm-card input[type=checkbox]")).toHaveLength(
      PLATFORM_PERMISSIONS.length,
    );
    expect(view.textContent).toContain(PLATFORM.permissions["tools:publish"].description);
  });

  it("checks and locks what a permission implies, and saves only the fewest grants", async () => {
    const { api, sent } = fakeApi(routes({ "PATCH /api/teams/support": () => TEAMS[2] }));
    const view = await one(api, "support");
    expect(box(view, "Manage members").checked).toBe(false);
    await click(box(view, "Manage members"));
    // Manage members implies See members: it is checked, and locked until the write is unchecked.
    expect(box(view, "Manage members").checked).toBe(true);
    expect(box(view, "See members").checked).toBe(true);
    expect(box(view, "See members").disabled).toBe(true);
    expect(view.textContent).toContain("Included in Manage members");
    // Build tools implies See tools, which Publish tools implies as well.
    await click(box(view, "Publish tools"));
    await click(box(view, "Build tools"));
    expect(box(view, "See tools").checked).toBe(true);
    expect(box(view, "See tools").disabled).toBe(true);
    await click(button(view, "Save changes"));
    expect(sent).toHaveLength(1);
    expect(sent[0]!.method).toBe("PATCH");
    expect(sent[0]!.body).toMatchObject({
      name: "Support",
      permissions: ["tools:write", "tools:publish", "members:write"],
    });
  });

  it("lets a person give only what they hold: the rest is disabled with a hint", async () => {
    const { api } = fakeApi(routes());
    const holder = person(["teams:write", "members:read", "tools:read", "tools:write"]);
    const view = await one(api, "support", holder);
    expect(box(view, "Build tools").disabled).toBe(false);
    expect(box(view, "Publish tools").disabled).toBe(true);
    expect(box(view, "Manage members").disabled).toBe(true);
    expect(view.textContent).toContain("You can only give what you hold");
    expect(
      [...view.querySelectorAll("span[title]")].some(
        (s) => s.getAttribute("title") === "You can only give what you hold",
      ),
    ).toBe(true);
  });

  it("shows the admin team as every permission, now and to come, without checkboxes", async () => {
    const { api } = fakeApi(routes());
    const view = await one(api, "admin");
    expect(view.textContent).toContain("Every permission, now and to come");
    expect(view.querySelectorAll(".fc-perm-card")).toHaveLength(0);
    // Built in: it cannot be deleted.
    expect(button(view, "Delete team")).toBeUndefined();
  });

  it("is read-only without teams:write: no save, no delete, disabled boxes", async () => {
    const { api } = fakeApi(routes());
    const view = await one(api, "support", person([]));
    expect(view.textContent).toContain("Changing teams needs the permission");
    expect(button(view, "Save changes")).toBeUndefined();
    expect(button(view, "Delete team")).toBeUndefined();
    const boxes = [...view.querySelectorAll<HTMLInputElement>(".fc-perm-card input")];
    expect(boxes.every((b) => b.disabled)).toBe(true);
    // Without members:read it shows how many people are in, not who.
    expect(view.textContent).toContain("1 member");
    expect(view.textContent).toContain("See members");
  });

  it("changes who is in the team, and deletes a team of its own after a second click", async () => {
    const { api, sent } = fakeApi(
      routes({
        "PATCH /api/teams/support": () => TEAMS[2],
        "DELETE /api/teams/support": undefined,
      }),
    );
    const view = await one(api, "support");
    await click(box(view, "Bob"));
    await click(button(view, "Save changes"));
    expect(sent.at(-1)!.body).toMatchObject({ members: ["m3", "m2"] });
    await click(button(view, "Delete team"));
    expect(sent.some((s) => s.method === "DELETE")).toBe(false);
    await click(button(view, "Delete for good"));
    expect(sent.at(-1)).toMatchObject({ path: "/api/teams/support", method: "DELETE" });
  });
});
