// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessMatrixEditor } from "./access-matrix";

// The editor in a DOM: it loads the matrix, a click drafts a flip, Save sends one request and
// reloads what applies. React's `act` flushes the effects and the promises of each step.

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

const served = {
  roles: ["viewer"],
  actions: ["deals.list", "deals.move"],
  views: ["board"],
  subjects: ["deals.list", "deals.move", "view:board"],
  cells: {
    viewer: {
      "deals.list": { default: true, allowed: true },
      "deals.move": { default: false, allowed: false },
      "view:board": { default: false, override: true, allowed: true },
    },
  },
};

const flush = () => act(async () => {});
const cellButtons = () => [...container.querySelectorAll("tbody button")] as HTMLButtonElement[];
const saveButton = () =>
  [...container.querySelectorAll("button")].find(
    (b) => b.textContent === "Save changes",
  ) as HTMLButtonElement;

describe("AccessMatrixEditor", () => {
  it("drafts a flip, saves it in one request, and shows what applies after", async () => {
    let current = structuredClone(served);
    const sent: unknown[] = [];
    const fetchJson = vi.fn<() => Promise<unknown>>(async () => current);
    const sendJson = vi.fn<(path: string, body: unknown) => Promise<unknown>>(
      async (_path, body) => {
        sent.push(body);
        current = structuredClone(served);
        current.cells.viewer["deals.move"] = {
          default: false,
          override: true,
          allowed: true,
        } as never;
        return current;
      },
    );

    act(() => root.render(createElement(AccessMatrixEditor, { tool: "crm", fetchJson, sendJson })));
    await flush();

    // The columns are the actions, then the view; the view differs from its default.
    expect(container.textContent).toContain("view:board");
    expect(container.textContent).toContain("(default: refused)");
    expect(saveButton().disabled).toBe(true);

    // The cell of `deals.move` flips on a click, and says it differs from the default.
    act(() => cellButtons()[1]!.click());
    expect(saveButton().disabled).toBe(false);
    expect(cellButtons()[1]!.textContent).toContain("(default: refused)");
    expect(sendJson).not.toHaveBeenCalled();

    // Flipping it back is no change at all.
    act(() => cellButtons()[1]!.click());
    expect(saveButton().disabled).toBe(true);
    act(() => cellButtons()[1]!.click());

    await act(async () => saveButton().click());
    await flush();
    expect(sent).toEqual([{ changes: [{ role: "viewer", action: "deals.move", allowed: true }] }]);
    expect(container.textContent).toContain("Saved.");
    expect(saveButton().disabled).toBe(true);
    expect(fetchJson).toHaveBeenCalledTimes(2);
  });

  it("drafts what a workspace role is given, previews its cells, and saves it (D-127)", async () => {
    const withProfiles = {
      ...served,
      roles: ["member"],
      cells: { member: { "deals.list": { default: true, allowed: true } } },
      levels: { "deals.list": "read", "deals.move": "write", "view:board": "write" },
      permissions: ["read", "write"],
      profiles: {
        user: { label: "User", grants: ["read"], default: true },
        manager: { label: "Manager", grants: ["read", "write"], default: false },
      },
      mapping: { member: { kind: "profile", profile: "user" } },
    };
    const sent: unknown[] = [];
    const fetchJson = vi.fn<() => Promise<unknown>>(async () => withProfiles);
    const sendJson = vi.fn<(path: string, body: unknown) => Promise<unknown>>(async (_p, body) => {
      sent.push(body);
      return withProfiles;
    });
    act(() =>
      root.render(
        createElement(AccessMatrixEditor, {
          tool: "crm",
          fetchJson,
          sendJson,
          workspaceRoles: ["admin", "member", "support"],
        }),
      ),
    );
    await flush();
    expect(container.textContent).toContain("Profiles this tool suggests");
    expect(container.textContent).toContain("Manager");
    // The workspace's roles are all there, the ones the tool does not map given nothing.
    const select = (role: string) =>
      container.querySelector(`select[aria-label="What ${role} is given"]`) as HTMLSelectElement;
    expect(select("support").value).toBe("none");
    expect(select("member").value).toBe("profile:user");

    act(() => {
      select("member").value = "profile:manager";
      select("member").dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(saveButton().disabled).toBe(false);
    // `deals.move` needs `write`: the drafted profile opens it.
    expect(container.textContent).toContain("write");
    await act(async () => saveButton().click());
    await flush();
    expect(sent).toEqual([
      { profiles: [{ role: "member", grant: { kind: "profile", profile: "manager" } }] },
    ]);
  });

  it("says why when it cannot save, and keeps the draft", async () => {
    const fetchJson = async () => served;
    const sendJson = async () => {
      throw new Error("/api/tools/crm/access-matrix: 403");
    };
    act(() => root.render(createElement(AccessMatrixEditor, { tool: "crm", fetchJson, sendJson })));
    await flush();
    act(() => cellButtons()[0]!.click());
    await act(async () => saveButton().click());
    await flush();
    expect(container.textContent).toContain("/api/tools/crm/access-matrix: 403");
    expect(saveButton().disabled).toBe(false);
  });

  it("says it could not load", async () => {
    const fetchJson = async () => {
      throw new Error("nope");
    };
    act(() =>
      root.render(
        createElement(AccessMatrixEditor, { tool: "crm", fetchJson, sendJson: async () => {} }),
      ),
    );
    await flush();
    expect(container.textContent).toContain("could not be loaded");
  });
});
