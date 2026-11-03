// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadMembers, Members, MembersEditor, parseList, type MembershipView } from "./members";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const served = {
  members: [
    { id: "m1", email: "ada@acme.fr", name: "ada", roles: ["admin"], secret: "dropped" },
    { id: "m2", email: "bob@acme.fr", name: "bob", roles: [] },
  ],
  invitations: [{ email: "eve@acme.fr", roles: ["developer"], expiresAt: "2026-11-17T10:00:00Z" }],
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
});

describe("Members", () => {
  const view: MembershipView = {
    members: [{ id: "m1", email: "ada@acme.fr", name: "ada", roles: [] }],
    invitations: [
      { email: "eve@acme.fr", roles: ["developer"], expiresAt: "2026-11-17T10:00:00Z" },
    ],
    domains: [],
    defaultRole: "",
    source: "install",
  };
  it("lists members and invitations, with buttons only when it is given the handlers", () => {
    const plain = renderToStaticMarkup(<Members view={view} />);
    expect(plain).toContain("ada@acme.fr");
    expect(plain).toContain("no role");
    expect(plain).toContain("eve@acme.fr");
    expect(plain).not.toContain("Remove");
    const editable = renderToStaticMarkup(
      <Members view={view} onEditRoles={() => {}} onRemove={() => {}} onWithdraw={() => {}} />,
    );
    expect(editable).toContain("Remove");
    expect(editable).toContain("Withdraw");
  });
});

describe("MembersEditor", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const flush = () => act(async () => {});

  it("invites, saves the domains and removes, each as one request, then reloads", async () => {
    const sent: Array<[string, unknown, string | undefined]> = [];
    const fetchJson = vi.fn<() => Promise<unknown>>(async () => served);
    const sendJson = vi.fn<(path: string, body: unknown, method?: string) => Promise<unknown>>(
      async (path, body, method) => {
        sent.push([path, body, method]);
        return undefined;
      },
    );
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await act(async () =>
      root.render(<MembersEditor fetchJson={fetchJson} sendJson={sendJson as never} />),
    );
    await flush();
    expect(container.textContent).toContain("ada@acme.fr");

    const set = (input: HTMLInputElement, value: string) =>
      act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          input,
          value,
        );
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    const inputs = [...container.querySelectorAll("input")] as HTMLInputElement[];
    await set(inputs[0]!, "new@acme.fr");
    await set(inputs[1]!, "developer");
    const forms = [...container.querySelectorAll("form")];
    await act(async () =>
      forms[0]!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    await flush();
    expect(sent.at(-1)).toEqual([
      "/api/invitations",
      { email: "new@acme.fr", roles: ["developer"] },
      "POST",
    ]);

    await act(async () =>
      forms[1]!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    await flush();
    expect(sent.at(-1)).toEqual([
      "/api/membership-settings",
      { domains: ["acme.fr"], defaultRole: "viewer" },
      "PUT",
    ]);

    const remove = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "Remove",
    )!;
    await act(async () => remove.click());
    await flush();
    expect(sent.at(-1)).toEqual(["/api/members/m1", undefined, "DELETE"]);
    expect(fetchJson.mock.calls.length).toBeGreaterThan(1);
  });

  it("shows what the platform said when it refuses a change", async () => {
    const sendJson = vi.fn<() => Promise<unknown>>(async () => {
      throw new Error("/api/members/m1: 409 A workspace needs at least one administrator.");
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await act(async () =>
      root.render(<MembersEditor fetchJson={async () => served} sendJson={sendJson as never} />),
    );
    await flush();
    const remove = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "Remove",
    )!;
    await act(async () => remove.click());
    await flush();
    expect(container.querySelector("[role=alert]")?.textContent).toContain(
      "at least one administrator",
    );
  });
});
