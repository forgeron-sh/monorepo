// @vitest-environment jsdom
import { PLATFORM_PERMISSIONS, type PlatformPermission } from "@forgeron/permissions";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import {
  DomainsPage,
  loadMembers,
  Members,
  MembersPage,
  parseList,
  type MembershipView,
} from "./members";
import {
  button,
  cleanup,
  click,
  fakeApi,
  field,
  mount,
  NOW,
  refusal,
  submit,
  TEAMS,
  type,
} from "./test-utils";
import type { WorkspaceInfo } from "./workspace";

afterEach(cleanup);

const served = {
  members: [
    { id: "m1", email: "ada@acme.fr", name: "ada", teams: ["admin"], secret: "dropped" },
    { id: "m2", email: "bob@acme.fr", name: "bob", teams: ["developer", "support"] },
  ],
  invitations: [
    { email: "eve@acme.fr", teams: ["developer"], expiresAt: "2026-11-17T10:00:00Z" },
    { email: "old@acme.fr", teams: [], expiresAt: "2026-11-01T10:00:00Z" },
  ],
  settings: { domains: ["acme.fr"], defaultTeams: ["support"], source: "console" },
};

const person = (
  permissions: readonly PlatformPermission[] = PLATFORM_PERMISSIONS,
): WorkspaceInfo["person"] => ({
  id: "m1",
  email: "ada@acme.fr",
  name: "ada",
  teams: [],
  permissions: [...permissions],
});

describe("loadMembers", () => {
  it("keeps what the screen draws and nothing else", async () => {
    const view = await loadMembers(async () => served);
    expect(view.members).toEqual([
      { id: "m1", email: "ada@acme.fr", name: "ada", teams: ["admin"] },
      { id: "m2", email: "bob@acme.fr", name: "bob", teams: ["developer", "support"] },
    ]);
    expect(view).toMatchObject({
      domains: ["acme.fr"],
      defaultTeams: ["support"],
      source: "console",
    });
    expect(JSON.stringify(view)).not.toContain("dropped");
  });

  it("parses domains typed as a list", () => {
    expect(parseList(" acme.fr, acme.com  acme.org,, ")).toEqual([
      "acme.fr",
      "acme.com",
      "acme.org",
    ]);
  });
});

describe("Members", () => {
  const view: MembershipView = {
    members: [
      { id: "m1", email: "ada@acme.fr", name: "ada", teams: ["admin"] },
      { id: "m2", email: "bob@acme.fr", name: "bob", teams: ["developer", "support"] },
      { id: "m3", email: "cy@acme.fr", name: "cy", teams: [] },
    ],
    invitations: [
      { email: "eve@acme.fr", teams: ["developer"], expiresAt: "2026-11-17T10:00:00Z" },
      { email: "old@acme.fr", teams: [], expiresAt: "2026-11-01T10:00:00Z" },
    ],
    domains: [],
    defaultTeams: [],
    source: "install",
  };
  it("draws each person's teams as chips by name, and the status and expiry of each invitation", () => {
    const out = renderToStaticMarkup(
      <Members view={view} selfId="m1" now={NOW} teams={TEAMS as never} />,
    );
    expect(out).toContain("You");
    expect(out).toContain("Active");
    // The admin team is the strong chip; teams show their names, not their ids.
    expect(out).toContain('fg-badge-strong">Admins<');
    expect(out).toContain(">Developers<");
    expect(out).toContain(">Support<");
    expect(out).not.toContain(">developer<");
    // A person in no team says so; no role is shown anywhere.
    expect(out).toContain("No team");
    expect(out).not.toMatch(/\brole/i);
    expect(out).toContain("Pending");
    expect(out).toContain("Expires in 13 days");
    expect(out).toContain("Expired");
    expect(out).not.toContain("Remove");
  });
  it("draws buttons only when it is given the handlers", () => {
    const out = renderToStaticMarkup(
      <Members
        view={view}
        now={NOW}
        onEditTeams={() => {}}
        onRemove={() => {}}
        onWithdraw={() => {}}
      />,
    );
    expect(out).toContain("Change teams");
    expect(out).toContain("Remove");
    expect(out).toContain("Withdraw");
  });
  it("says what to do when nobody is invited", () => {
    const out = renderToStaticMarkup(
      <Members view={{ ...view, invitations: [] }} now={NOW} onInvite={() => {}} />,
    );
    expect(out).toContain("No pending invitation");
    expect(out).toContain("Invite people");
  });
});

describe("MembersPage", () => {
  const open = (routes: Record<string, unknown> = {}) => {
    const fake = fakeApi({ "/api/members": served, "/api/teams": { teams: TEAMS }, ...routes });
    return {
      ...fake,
      shown: mount(<MembersPage api={fake.api} person={person()} now={() => NOW} />),
    };
  };

  it("shows a spinner, then the people", async () => {
    const { shown } = open();
    const page = await shown;
    expect(page.textContent).toContain("ada@acme.fr");
  });

  it("says what happened when the members cannot be loaded, and offers to try again", async () => {
    const { api } = fakeApi({
      "/api/members": () => {
        throw refusal(500);
      },
    });
    const page = await mount(<MembersPage api={api} person={person()} now={() => NOW} />);
    expect(page.querySelector("[role=alert]")?.textContent).toContain("could not be loaded");
    expect(button(page, "Try again")).toBeTruthy();
  });

  it("draws no write control for someone who only holds members:read", async () => {
    const { api } = fakeApi({ "/api/members": served, "/api/teams": { teams: TEAMS } });
    const page = await mount(
      <MembersPage api={api} person={person(["members:read"])} now={() => NOW} />,
    );
    expect(page.textContent).toContain("ada@acme.fr");
    expect(button(page, "Invite people")).toBeUndefined();
    expect(button(page, "Change teams")).toBeUndefined();
    expect(button(page, "Remove")).toBeUndefined();
    expect(button(page, "Withdraw")).toBeUndefined();
  });

  it("invites with the chosen teams and tells it was sent", async () => {
    const { sent, shown } = open({ "POST /api/invitations": { notified: true } });
    const page = await shown;
    await click(button(page, "Invite people"));
    const dialog = document.querySelector("[role=dialog]")!;
    await type(field(dialog, "Email address"), "new@acme.fr");
    // None by default; the built-in teams come first.
    const boxes = [...dialog.querySelectorAll<HTMLInputElement>("input[type=checkbox]")];
    expect(boxes.every((b) => !b.checked)).toBe(true);
    expect(boxes.map((b) => b.closest("label")!.textContent)[0]).toContain("Admins");
    await click(
      [...dialog.querySelectorAll("label")]
        .find((l) => l.textContent?.startsWith("Developers"))!
        .querySelector("input"),
    );
    await click(button(dialog, "Send invitation"));
    expect(sent.at(-1)).toEqual({
      path: "/api/invitations",
      body: { email: "new@acme.fr", teams: ["developer"] },
      method: "POST",
    });
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(page.textContent).toContain("Invitation sent to new@acme.fr.");
  });

  it("refuses an address that is not one before asking the platform", async () => {
    const { sent, shown } = open();
    const page = await shown;
    await click(button(page, "Invite people"));
    const dialog = document.querySelector("[role=dialog]")!;
    await type(field(dialog, "Email address"), "nobody");
    await click(button(dialog, "Send invitation"));
    expect(dialog.textContent).toContain("This is not an email address");
    expect(sent).toEqual([]);
  });

  it("warns when the invitation is saved but the mail could not be sent", async () => {
    const { shown } = open({ "POST /api/invitations": { notified: false } });
    const page = await shown;
    await click(button(page, "Invite people"));
    const dialog = document.querySelector("[role=dialog]")!;
    await type(field(dialog, "Email address"), "new@acme.fr");
    await click(button(dialog, "Send invitation"));
    expect(page.querySelector("[role=alert]")?.textContent).toContain("could not be sent");
  });

  it("changes teams from a multi-select, built-in teams first", async () => {
    const { sent, shown } = open({ "PATCH /api/members/m2": {} });
    const page = await shown;
    await click(button(page.querySelectorAll("tbody tr")[1] as HTMLElement, "Change teams"));
    const dialog = document.querySelector("[role=dialog]")!;
    expect(dialog.textContent).toContain("Change teams of bob@acme.fr");
    const labels = [...dialog.querySelectorAll("label")].map((l) => l.textContent ?? "");
    expect(labels.map((l) => l.split(" ")[0])).toEqual(["Admins", "Developers", "Support"]);
    // Bob is in Developers and Support: they start checked.
    const boxes = [...dialog.querySelectorAll<HTMLInputElement>("input[type=checkbox]")];
    expect(boxes.map((b) => b.checked)).toEqual([false, true, true]);
    await click(boxes[2]);
    await click(button(dialog, "Save teams"));
    expect(sent.at(-1)).toEqual({
      path: "/api/members/m2",
      body: { teams: ["developer"] },
      method: "PATCH",
    });
    expect(page.textContent).toContain("Teams of bob@acme.fr saved.");
  });

  it("does not offer to give what the person does not hold", async () => {
    const fake = fakeApi({ "/api/members": served, "/api/teams": { teams: TEAMS } });
    const page = await mount(
      <MembersPage
        api={fake.api}
        person={person(["members:write", "tools:write"])}
        now={() => NOW}
      />,
    );
    await click(button(page.querySelectorAll("tbody tr")[1] as HTMLElement, "Change teams"));
    const dialog = document.querySelector("[role=dialog]")!;
    const box = (name: string) =>
      [...dialog.querySelectorAll("label")]
        .find((l) => l.textContent?.startsWith(name))!
        .querySelector("input")!;
    // Admins hold everything: not this person's to give. Developers hold tools:write and access:read,
    // and the person lacks access:read.
    expect(box("Admins").disabled).toBe(true);
    expect(box("Developers").disabled).toBe(true);
    expect(box("Support").disabled).toBe(false);
    expect(dialog.textContent).toContain("You can only give what you hold");
  });

  it("asks before removing, and shows why the platform refused", async () => {
    const { sent, shown } = open({
      "DELETE /api/members/m1": () => {
        throw refusal(
          409,
          "The last admin cannot be removed. Add someone else to the Admins team first.",
        );
      },
    });
    const page = await shown;
    await click(button(page.querySelectorAll("tbody tr")[0] as HTMLElement, "Remove"));
    const dialog = document.querySelector("[role=dialog]")!;
    expect(dialog.textContent).toContain("Their sessions stop at once");
    expect(sent).toEqual([]);
    await click(button(dialog, "Remove member"));
    expect(sent.at(-1)).toEqual({ path: "/api/members/m1", body: undefined, method: "DELETE" });
    expect(dialog.querySelector("[role=alert]")?.textContent).toContain("last admin");
    // The dialog stays open, so the person can cancel.
    await click(button(dialog, "Cancel"));
    expect(document.querySelector("[role=dialog]")).toBeNull();
  });

  it("withdraws an invitation in one click", async () => {
    const { sent, shown } = open({ "DELETE /api/invitations/eve%40acme.fr": undefined });
    const page = await shown;
    await click(button(page.querySelectorAll("tbody tr")[2] as HTMLElement, "Withdraw"));
    expect(sent.at(-1)).toEqual({
      path: "/api/invitations/eve%40acme.fr",
      body: undefined,
      method: "DELETE",
    });
    expect(page.textContent).toContain("Invitation to eve@acme.fr withdrawn.");
  });
});

describe("MembersPage invite on open", () => {
  it("opens the invite dialog when asked to", async () => {
    const { api } = fakeApi({ "/api/members": served, "/api/teams": { teams: TEAMS } });
    const page = await mount(
      <MembersPage api={api} person={person()} now={() => NOW} inviteOnOpen />,
    );
    expect(page.ownerDocument.querySelector('[role="dialog"]')?.textContent).toContain("Invite");
  });
});

describe("DomainsPage", () => {
  const open = (routes: Record<string, unknown> = {}) => {
    const fake = fakeApi({ "/api/members": served, "/api/teams": { teams: TEAMS }, ...routes });
    return { ...fake, shown: mount(<DomainsPage api={fake.api} person={person()} />) };
  };

  it("shows who joins by themselves", async () => {
    const page = await open().shown;
    expect(page.querySelector("h1")?.textContent).toBe("Domains");
    expect(page.textContent).toContain("Who joins by themselves");
  });

  it("lets people join with teams, never Admins, and saves them", async () => {
    const { sent, shown } = open({ "PUT /api/membership-settings": {} });
    const page = await shown;
    await type(field(page, "Email domains"), "acme.fr, acme.com");
    const labels = [...page.querySelectorAll("form label")].map((l) => l.textContent ?? "");
    expect(page.textContent).toContain("Join with teams");
    expect(labels.some((l) => l.startsWith("Admins"))).toBe(false);
    // Support is the saved default; add Developers.
    await click(
      [...page.querySelectorAll("form label")]
        .find((l) => l.textContent?.startsWith("Developers"))!
        .querySelector("input"),
    );
    await submit(page.querySelectorAll("form")[0]);
    expect(sent.at(-1)).toEqual({
      path: "/api/membership-settings",
      body: { domains: ["acme.fr", "acme.com"], defaultTeams: ["support", "developer"] },
      method: "PUT",
    });
    expect(page.textContent).toContain("Saved.");
  });

  it("explains a refused domain change in the form", async () => {
    const { shown } = open({
      "PUT /api/membership-settings": () => {
        throw refusal(400, "`domains` is a list of domains.");
      },
    });
    const page = await shown;
    await submit(page.querySelectorAll("form")[0]);
    expect(page.querySelector("form [role=alert]")?.textContent).toContain(
      "`domains` is a list of domains.",
    );
  });
});
