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
  subjects: ["team:viewer"],
  subjectLabels: { "team:viewer": "Viewers" },
  actions: ["deals.list", "deals.move"],
  views: ["board"],
  columns: ["deals.list", "deals.move", "view:board"],
  cells: {
    "team:viewer": {
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
        current.cells["team:viewer"]["deals.move"] = {
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
    expect(sent).toEqual([
      { changes: [{ subject: "team:viewer", action: "deals.move", allowed: true }] },
    ]);
    expect(container.textContent).toContain("Saved.");
    expect(saveButton().disabled).toBe(true);
    expect(fetchJson).toHaveBeenCalledTimes(2);
  });

  it("lists Everyone then each team by name, drafts what one is given, and saves it (D-127, D-136)", async () => {
    const withProfiles = {
      ...served,
      subjects: ["everyone", "team:admin", "team:support"],
      subjectLabels: { everyone: "Everyone", "team:admin": "Admins", "team:support": "Support" },
      cells: { everyone: { "deals.list": { default: true, allowed: true } } },
      levels: { "deals.list": "read", "deals.move": "write", "view:board": "write" },
      permissions: ["read", "write"],
      profiles: {
        user: { label: "User", grants: ["read"], default: true },
        manager: { label: "Manager", grants: ["read", "write"], default: false },
      },
      grants: { everyone: { kind: "profile", profile: "user" }, "team:admin": { kind: "all" } },
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
        }),
      ),
    );
    await flush();
    expect(container.textContent).toContain("Profiles this tool suggests");
    expect(container.textContent).toContain("Manager");
    // Everyone and each team are rows, by name; a team the tool does not map is given nothing.
    const select = (who: string) =>
      container.querySelector(`select[aria-label="What ${who} is given"]`) as HTMLSelectElement;
    const rows = [...container.querySelectorAll("tbody tr")].map((r) => r.textContent ?? "");
    expect(rows.some((r) => r.startsWith("Everyone"))).toBe(true);
    expect(container.textContent).not.toContain("team:support");
    expect(select("Support").value).toBe("none");
    expect(select("Admins").value).toBe("all");
    expect(select("Everyone").value).toBe("profile:user");
    expect(container.textContent).toContain("gives Admins every permission and Everyone");

    act(() => {
      select("Everyone").value = "profile:manager";
      select("Everyone").dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(saveButton().disabled).toBe(false);
    // `deals.move` needs `write`: the drafted profile opens it.
    expect(container.textContent).toContain("write");
    await act(async () => saveButton().click());
    await flush();
    expect(sent).toEqual([
      { grants: [{ subject: "everyone", grant: { kind: "profile", profile: "manager" } }] },
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

  it("only shows the matrix to someone who may not change it (access:read)", async () => {
    const fetchJson = async () => served;
    act(() =>
      root.render(
        createElement(AccessMatrixEditor, {
          tool: "crm",
          fetchJson,
          sendJson: async () => {},
          readOnly: true,
        }),
      ),
    );
    await flush();
    expect(container.textContent).toContain("Viewers");
    expect(container.querySelector("select")).toBeNull();
    expect(cellButtons()).toHaveLength(0);
    expect(saveButton()).toBeUndefined();
    expect(container.textContent).toContain("Changing it needs the permission");
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
