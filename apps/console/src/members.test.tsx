// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import {
  DomainsPage,
  knownRoles,
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
  type,
} from "./test-utils";

afterEach(cleanup);

const served = {
  members: [
    { id: "m1", email: "ada@acme.fr", name: "ada", roles: ["admin"], secret: "dropped" },
    { id: "m2", email: "bob@acme.fr", name: "bob", roles: [] },
  ],
  invitations: [
    { email: "eve@acme.fr", roles: ["developer"], expiresAt: "2026-11-17T10:00:00Z" },
    { email: "old@acme.fr", roles: [], expiresAt: "2026-11-01T10:00:00Z" },
  ],
  settings: { domains: ["acme.fr"], defaultRole: "viewer", source: "console" },
};

describe("loadMembers", () => {
  it("keeps what the screen draws and nothing else", async () => {
    const view = await loadMembers(async () => served);
    expect(view.members).toEqual([
      { id: "m1", email: "ada@acme.fr", name: "ada", roles: ["admin"] },
      { id: "m2", email: "bob@acme.fr", name: "bob", roles: [] },
    ]);
    expect(view).toMatchObject({ domains: ["acme.fr"], defaultRole: "viewer", source: "console" });
    expect(JSON.stringify(view)).not.toContain("dropped");
  });

  it("parses roles and domains typed as a list", () => {
    expect(parseList(" developer, viewer  admin,, ")).toEqual(["developer", "viewer", "admin"]);
  });

  it("offers the base roles and every role people already hold", async () => {
    const view = await loadMembers(async () => served);
    expect(knownRoles(view)).toEqual(["admin", "developer", "viewer"]);
  });
});

describe("Members", () => {
  const view: MembershipView = {
    members: [
      { id: "m1", email: "ada@acme.fr", name: "ada", roles: ["admin"] },
      { id: "m2", email: "bob@acme.fr", name: "bob", roles: [] },
    ],
    invitations: [
      { email: "eve@acme.fr", roles: ["developer"], expiresAt: "2026-11-17T10:00:00Z" },
      { email: "old@acme.fr", roles: [], expiresAt: "2026-11-01T10:00:00Z" },
    ],
    domains: [],
    defaultRole: "",
    source: "install",
  };
  it("draws roles and status, and the expiry of each invitation", () => {
    const out = renderToStaticMarkup(<Members view={view} selfId="m1" now={NOW} />);
    expect(out).toContain("You");
    expect(out).toContain("Active");
    expect(out).toContain("No role");
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
        onEditRoles={() => {}}
        onRemove={() => {}}
        onWithdraw={() => {}}
      />,
    );
    expect(out).toContain("Change roles");
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
    const fake = fakeApi({ "/api/members": served, ...routes });
    return { ...fake, shown: mount(<MembersPage api={fake.api} selfId="m1" now={() => NOW} />) };
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
    const page = await mount(<MembersPage api={api} now={() => NOW} />);
    expect(page.querySelector("[role=alert]")?.textContent).toContain("could not be loaded");
    expect(button(page, "Try again")).toBeTruthy();
  });

  it("invites with the chosen roles and tells it was sent", async () => {
    const { sent, shown } = open({ "POST /api/invitations": { notified: true } });
    const page = await shown;
    await click(button(page, "Invite people"));
    const dialog = document.querySelector("[role=dialog]")!;
    await type(field(dialog, "Email address"), "new@acme.fr");
    await click(
      [...dialog.querySelectorAll("label")]
        .find((l) => l.textContent === "developer")!
        .querySelector("input"),
    );
    await type(field(dialog, "Other roles"), "viewer");
    await click(button(dialog, "Send invitation"));
    expect(sent.at(-1)).toEqual({
      path: "/api/invitations",
      body: { email: "new@acme.fr", roles: ["developer", "viewer"] },
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

  it("changes roles from the checkboxes", async () => {
    const { sent, shown } = open({ "PATCH /api/members/m2": {} });
    const page = await shown;
    await click(button(page.querySelectorAll("tbody tr")[1] as HTMLElement, "Change roles"));
    const dialog = document.querySelector("[role=dialog]")!;
    await click(
      [...dialog.querySelectorAll("label")]
        .find((l) => l.textContent === "developer")!
        .querySelector("input"),
    );
    await click(button(dialog, "Save roles"));
    expect(sent.at(-1)).toEqual({
      path: "/api/members/m2",
      body: { roles: ["developer"] },
      method: "PATCH",
    });
  });

  it("asks before removing, and shows why the platform refused", async () => {
    const { sent, shown } = open({
      "DELETE /api/members/m1": () => {
        throw refusal(
          409,
          "The last administrator cannot be removed. Make someone else an admin first.",
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
    expect(dialog.querySelector("[role=alert]")?.textContent).toContain("last administrator");
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
    const { api } = fakeApi({ "/api/members": served });
    const page = await mount(<MembersPage api={api} now={() => NOW} inviteOnOpen />);
    expect(page.ownerDocument.querySelector('[role="dialog"]')?.textContent).toContain("Invite");
  });
});

describe("DomainsPage", () => {
  const open = (routes: Record<string, unknown> = {}) => {
    const fake = fakeApi({ "/api/members": served, ...routes });
    return { ...fake, shown: mount(<DomainsPage api={fake.api} />) };
  };

  it("shows who joins by themselves", async () => {
    const page = await open().shown;
    expect(page.querySelector("h1")?.textContent).toBe("Domains");
    expect(page.textContent).toContain("Who joins by themselves");
  });

  it("saves the domains and the default role", async () => {
    const { sent, shown } = open({ "PUT /api/membership-settings": {} });
    const page = await shown;
    await type(field(page, "Email domains"), "acme.fr, acme.com");
    await submit(page.querySelectorAll("form")[0]);
    expect(sent.at(-1)).toEqual({
      path: "/api/membership-settings",
      body: { domains: ["acme.fr", "acme.com"], defaultRole: "viewer" },
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
