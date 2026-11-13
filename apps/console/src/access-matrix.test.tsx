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
  it("asks for the tool and keeps what the screen draws: rows by subject, columns, labels", async () => {
    const paths: string[] = [];
    const matrix = await loadAccessMatrix(
      async (path) => (
        paths.push(path),
        {
          subjects: ["everyone", "team:sales"],
          subjectLabels: { everyone: "Everyone", "team:sales": "Sales" },
          actions: ["deals.move", "deals.delete"],
          views: [],
          columns: ["deals.move", "deals.delete"],
          cells: {
            "team:sales": {
              "deals.move": { allowed: true, default: true, internal: "must-not-survive" },
              "deals.delete": { allowed: true, default: false, override: true },
            },
          },
        }
      ),
      "crm",
    );
    expect(paths).toEqual(["/api/tools/crm/access-matrix"]);
    expect(matrix.subjects).toEqual(["everyone", "team:sales"]);
    expect(matrix.labels).toEqual({ everyone: "Everyone", "team:sales": "Sales" });
    expect(matrix.cells["team:sales"]).toEqual({
      "deals.move": { allowed: true, default: true, changed: false },
      "deals.delete": { allowed: true, default: false, changed: true, override: true },
    });
    expect(JSON.stringify(matrix)).not.toContain("must-not-survive");
    expect(matrix.profiles).toEqual({});
    expect(matrix.grants).toEqual({});
  });

  it("shows the views as columns after the actions", async () => {
    const matrix = await loadAccessMatrix(
      async () => ({
        subjects: ["everyone"],
        actions: ["x"],
        views: ["board"],
        columns: ["x", "view:board"],
        cells: {
          everyone: {
            x: { allowed: true, default: true },
            "view:board": { allowed: false, default: false },
          },
        },
      }),
      "t",
    );
    expect(matrix.columns).toEqual(["x", "view:board"]);
  });

  it("treats a missing cell as refused", async () => {
    const matrix = await loadAccessMatrix(
      async () => ({ subjects: ["everyone"], columns: ["x"] }),
      "t",
    );
    expect(matrix.cells.everyone!.x).toEqual({ allowed: false, default: false, changed: false });
  });

  it("keeps the profiles, the permissions and what each subject is given", async () => {
    const matrix = await loadAccessMatrix(
      async () => ({
        subjects: ["everyone", "team:admin"],
        subjectLabels: { everyone: "Everyone", "team:admin": "Admins" },
        columns: ["deals.move"],
        levels: { "deals.move": "write" },
        permissions: ["read", "write"],
        profiles: {
          user: { label: "User", grants: ["read"], default: true },
          manager: { grants: ["read", "write"], default: false },
        },
        grants: {
          "team:admin": { kind: "all" },
          everyone: { kind: "profile", profile: "user" },
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
    expect(matrix.grants).toEqual({
      "team:admin": { kind: "all" },
      everyone: { kind: "profile", profile: "user" },
      odd: { kind: "none" },
    });
    expect(matrix.levels).toEqual({ "deals.move": "write" });
  });
});

const matrixOf = (overrides: Partial<AccessMatrixData> = {}): AccessMatrixData => ({
  subjects: ["everyone", "team:admin", "team:support"],
  labels: { everyone: "Everyone", "team:admin": "Admins", "team:support": "Support" },
  columns: ["deals.move"],
  cells: {},
  levels: { "deals.move": "write" },
  permissions: ["read", "write"],
  profiles: { user: { label: "User", grants: ["read"], default: true } },
  grants: {
    "team:admin": { kind: "all" },
    everyone: { kind: "profile", profile: "user" },
    "team:support": { kind: "custom", permissions: ["write"] },
  },
  ...overrides,
});

describe("ProfileMapping", () => {
  it("names the rows Everyone and each team by name, never by id", () => {
    const out = renderToStaticMarkup(<ProfileMapping matrix={matrixOf()} />);
    expect(out).toContain("Everyone");
    expect(out).toContain("Admins");
    expect(out).toContain("Support");
    expect(out).not.toContain("team:");
    expect(out).not.toMatch(/\brole/i);
  });

  it("shows what each is given, with the profiles by their label", () => {
    const out = renderToStaticMarkup(<ProfileMapping matrix={matrixOf()} />);
    expect(out).toContain("All permissions");
    expect(out).toContain("Profile: User (default)");
    expect(out).toContain("Custom permissions");
    expect(out).not.toContain("<select");
  });

  it("offers a select per row, and a checkbox per permission for custom ones", () => {
    const out = renderToStaticMarkup(<ProfileMapping matrix={matrixOf()} onChange={() => {}} />);
    expect(out.match(/<select/g)).toHaveLength(3);
    expect(out).toContain('aria-label="What Support is given"');
    expect(out.match(/type="checkbox"/g)).toHaveLength(2);
  });
});

describe("AccessMatrix", () => {
  const matrix = matrixOf({
    subjects: ["everyone", "team:sales"],
    labels: { everyone: "Everyone", "team:sales": "Sales" },
    cells: {
      everyone: { "deals.move": { allowed: true, default: true, changed: false } },
      "team:sales": { "deals.move": { allowed: true, default: false, changed: true } },
    },
  });

  it("shows each subject by name against each action, and marks what was changed", () => {
    const out = renderToStaticMarkup(<AccessMatrix matrix={matrix} />);
    expect(out).toContain("Everyone");
    expect(out).toContain("Sales");
    expect(out).toContain("deals.move");
    expect(out).toContain("(default: refused)");
    expect(out.match(/allowed/g)).toHaveLength(2);
    expect(out).not.toContain("<button");
  });

  it("makes each cell a button when it can change them", () => {
    const out = renderToStaticMarkup(<AccessMatrix matrix={matrix} onToggle={() => {}} />);
    expect(out.match(/<button/g)).toHaveLength(2);
  });

  it("says when nobody is given anything", () => {
    expect(
      renderToStaticMarkup(<AccessMatrix matrix={matrixOf({ subjects: [], columns: [] })} />),
    ).toContain("Nobody is given anything");
  });
});

describe("editing", () => {
  const matrix = matrixOf({
    subjects: ["team:viewer"],
    labels: { "team:viewer": "Viewers" },
    columns: ["a", "b"],
    cells: {
      "team:viewer": {
        a: { allowed: false, default: false, changed: false },
        b: { allowed: true, default: false, changed: true, override: true },
      },
    },
    levels: { a: "read", b: "write" },
    profiles: { manager: { grants: ["read", "write"], default: false } },
    grants: { "team:viewer": { kind: "none" } },
  });

  it("recomputes the defaults of a subject whose grant is drafted", () => {
    const drafted = withDraft(
      matrix,
      new Map(),
      new Map([
        [
          "team:viewer",
          { subject: "team:viewer", grant: { kind: "profile" as const, profile: "manager" } },
        ],
      ]),
    );
    expect(drafted.subjects).toEqual(["team:viewer"]);
    expect(drafted.cells["team:viewer"]!.a).toEqual({
      allowed: true,
      default: true,
      changed: false,
    });
    // The exception stays: it now equals the default.
    expect(drafted.cells["team:viewer"]!.b).toEqual({
      allowed: true,
      default: true,
      changed: false,
      override: true,
    });
  });

  it("sends the drafted grants by subject", async () => {
    const sent: unknown[] = [];
    await saveAccessMatrix(
      async (path, body) => void sent.push([path, body]),
      "crm",
      matrix,
      [],
      [{ subject: "everyone", grant: { kind: "all" } }],
    );
    expect(sent).toEqual([
      [
        "/api/tools/crm/access-matrix",
        { grants: [{ subject: "everyone", grant: { kind: "all" } }] },
      ],
    ]);
  });

  it("shows a drafted flip as differing from the default, and a flip back as not", () => {
    const flipped = withDraft(
      matrix,
      new Map([["team:viewer\u0000a", { subject: "team:viewer", action: "a", allowed: true }]]),
    );
    expect(flipped.cells["team:viewer"]!.a).toEqual({
      allowed: true,
      default: false,
      changed: true,
    });
    const back = withDraft(
      matrix,
      new Map([["team:viewer\u0000b", { subject: "team:viewer", action: "b", allowed: false }]]),
    );
    expect(back.cells["team:viewer"]!.b!.changed).toBe(false);
  });

  it("sends the drafted cells in one request, a cell back at its default as null", async () => {
    const sent: unknown[] = [];
    await saveAccessMatrix(async (path, body) => void sent.push([path, body]), "crm", matrix, [
      { subject: "team:viewer", action: "a", allowed: true },
      { subject: "team:viewer", action: "b", allowed: false },
    ]);
    expect(sent).toEqual([
      [
        "/api/tools/crm/access-matrix",
        {
          changes: [
            { subject: "team:viewer", action: "a", allowed: true },
            { subject: "team:viewer", action: "b", allowed: null },
          ],
        },
      ],
    ]);
  });
});
