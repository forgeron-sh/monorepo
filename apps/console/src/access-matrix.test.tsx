import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AccessMatrix,
  ProfileMapping,
  loadAccessMatrix,
  saveAccessMatrix,
  withDraft,
  type AccessMatrixData,
} from "./access-matrix";

describe("loadAccessMatrix", () => {
  it("asks for the tool and keeps what the screen draws", async () => {
    const paths: string[] = [];
    const matrix = await loadAccessMatrix(
      async (path) => (
        paths.push(path),
        {
          roles: ["sales"],
          actions: ["deals.move", "deals.delete"],
          cells: {
            sales: {
              "deals.move": { allowed: true, default: true, internal: "must-not-survive" },
              "deals.delete": { allowed: true, default: false, override: true },
            },
          },
        }
      ),
      "crm",
    );
    expect(paths).toEqual(["/api/tools/crm/access-matrix"]);
    expect(matrix.cells.sales).toEqual({
      "deals.move": { allowed: true, default: true, changed: false },
      "deals.delete": { allowed: true, default: false, changed: true, override: true },
    });
    expect(JSON.stringify(matrix)).not.toContain("must-not-survive");
    // A platform before D-127 sends no profile: none is shown, nothing breaks.
    expect(matrix.profiles).toEqual({});
    expect(matrix.mapping).toEqual({});
  });

  it("shows the views as columns after the actions", async () => {
    const matrix = await loadAccessMatrix(
      async () => ({
        roles: ["a"],
        actions: ["x"],
        views: ["board"],
        subjects: ["x", "view:board"],
        cells: {
          a: {
            x: { allowed: true, default: true },
            "view:board": { allowed: false, default: false },
          },
        },
      }),
      "t",
    );
    expect(matrix.actions).toEqual(["x", "view:board"]);
  });

  it("treats a missing cell as refused", async () => {
    const matrix = await loadAccessMatrix(async () => ({ roles: ["a"], actions: ["x"] }), "t");
    expect(matrix.cells.a!.x).toEqual({ allowed: false, default: false, changed: false });
  });
});

const empty = { levels: {}, permissions: [], profiles: {}, mapping: {} };

describe("loadAccessMatrix with profiles (D-127)", () => {
  it("keeps the profiles, the permissions and what each role is given", async () => {
    const matrix = await loadAccessMatrix(
      async () => ({
        roles: ["admin", "member"],
        actions: ["deals.move"],
        subjects: ["deals.move"],
        levels: { "deals.move": "write" },
        permissions: ["read", "write"],
        profiles: {
          user: { label: "User", grants: ["read"], default: true },
          manager: { grants: ["read", "write"], default: false },
        },
        mapping: {
          admin: { kind: "all" },
          member: { kind: "profile", profile: "user" },
          odd: { kind: "unknown" },
        },
        cells: {},
      }),
      "crm",
    );
    expect(matrix.profiles).toEqual({
      user: { label: "User", grants: ["read"], default: true },
      manager: { grants: ["read", "write"], default: false },
    });
    expect(matrix.mapping).toEqual({
      admin: { kind: "all" },
      member: { kind: "profile", profile: "user" },
      odd: { kind: "none" },
    });
    expect(matrix.levels).toEqual({ "deals.move": "write" });
  });
});

describe("ProfileMapping", () => {
  const matrix: AccessMatrixData = {
    roles: ["admin", "member", "support"],
    actions: ["deals.move"],
    cells: {},
    levels: { "deals.move": "write" },
    permissions: ["read", "write"],
    profiles: { user: { label: "User", grants: ["read"], default: true } },
    mapping: {
      admin: { kind: "all" },
      member: { kind: "profile", profile: "user" },
      support: { kind: "custom", permissions: ["write"] },
    },
  };

  it("shows what each workspace role is given, with the profiles by their label", () => {
    const out = renderToStaticMarkup(<ProfileMapping matrix={matrix} />);
    expect(out).toContain("All permissions");
    expect(out).toContain("Profile: User (default)");
    expect(out).toContain("Custom permissions");
    expect(out).not.toContain("<select");
  });

  it("offers a select per role, and a checkbox per permission for custom ones", () => {
    const out = renderToStaticMarkup(<ProfileMapping matrix={matrix} onChange={() => {}} />);
    expect(out.match(/<select/g)).toHaveLength(3);
    expect(out.match(/type="checkbox"/g)).toHaveLength(2);
  });
});

describe("AccessMatrix", () => {
  const matrix: AccessMatrixData = {
    roles: ["sales", "viewer"],
    actions: ["deals.move"],
    cells: {
      sales: { "deals.move": { allowed: true, default: true, changed: false } },
      viewer: { "deals.move": { allowed: true, default: false, changed: true } },
    },
    ...empty,
  };

  it("shows each role against each action, and marks what an admin changed", () => {
    const out = renderToStaticMarkup(<AccessMatrix matrix={matrix} />);
    expect(out).toContain("sales");
    expect(out).toContain("deals.move");
    expect(out).toContain("(default: refused)");
    expect(out.match(/allowed/g)).toHaveLength(2);
    expect(out).not.toContain("<button");
  });

  it("makes each cell a button when it can change them", () => {
    const out = renderToStaticMarkup(<AccessMatrix matrix={matrix} onToggle={() => {}} />);
    expect(out.match(/<button/g)).toHaveLength(2);
  });

  it("says when no workspace role is given anything", () => {
    expect(
      renderToStaticMarkup(
        <AccessMatrix matrix={{ roles: [], actions: [], cells: {}, ...empty }} />,
      ),
    ).toContain("No workspace role is given anything");
  });
});

describe("editing", () => {
  const matrix: AccessMatrixData = {
    roles: ["viewer"],
    actions: ["a", "b"],
    cells: {
      viewer: {
        a: { allowed: false, default: false, changed: false },
        b: { allowed: true, default: false, changed: true, override: true },
      },
    },
    levels: { a: "read", b: "write" },
    permissions: ["read", "write"],
    profiles: { manager: { grants: ["read", "write"], default: false } },
    mapping: { viewer: { kind: "none" } },
  };

  it("recomputes the defaults of a role whose mapping is drafted, and adds workspace roles", () => {
    const drafted = withDraft(
      matrix,
      new Map(),
      new Map([["viewer", { role: "viewer", grant: { kind: "profile", profile: "manager" } }]]),
      ["support"],
    );
    expect(drafted.roles).toEqual(["support", "viewer"]);
    expect(drafted.mapping.support).toEqual({ kind: "none" });
    expect(drafted.cells.viewer!.a).toEqual({ allowed: true, default: true, changed: false });
    // The exception stays: it now equals the default.
    expect(drafted.cells.viewer!.b).toEqual({
      allowed: true,
      default: true,
      changed: false,
      override: true,
    });
  });

  it("sends the drafted mapping and cells together", async () => {
    const sent: unknown[] = [];
    await saveAccessMatrix(
      async (path, body) => void sent.push([path, body]),
      "crm",
      matrix,
      [],
      [{ role: "member", grant: { kind: "all" } }],
    );
    expect(sent).toEqual([
      ["/api/tools/crm/access-matrix", { profiles: [{ role: "member", grant: { kind: "all" } }] }],
    ]);
  });

  it("shows a drafted flip as differing from the default, and a flip back as not", () => {
    const flipped = withDraft(
      matrix,
      new Map([["viewer\u0000a", { role: "viewer", action: "a", allowed: true }]]),
    );
    expect(flipped.cells.viewer!.a).toEqual({ allowed: true, default: false, changed: true });
    const back = withDraft(
      matrix,
      new Map([["viewer\u0000b", { role: "viewer", action: "b", allowed: false }]]),
    );
    expect(back.cells.viewer!.b!.changed).toBe(false);
  });

  it("sends the drafted cells in one request, a cell back at its default as null", async () => {
    const sent: unknown[] = [];
    await saveAccessMatrix(async (path, body) => void sent.push([path, body]), "crm", matrix, [
      { role: "viewer", action: "a", allowed: true },
      { role: "viewer", action: "b", allowed: false },
    ]);
    expect(sent).toEqual([
      [
        "/api/tools/crm/access-matrix",
        {
          changes: [
            { role: "viewer", action: "a", allowed: true },
            { role: "viewer", action: "b", allowed: null },
          ],
        },
      ],
    ]);
  });
});
