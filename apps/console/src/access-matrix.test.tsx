import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  AccessMatrix,
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
      "deals.delete": { allowed: true, default: false, changed: true },
    });
    expect(JSON.stringify(matrix)).not.toContain("must-not-survive");
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

describe("AccessMatrix", () => {
  const matrix: AccessMatrixData = {
    roles: ["sales", "viewer"],
    actions: ["deals.move"],
    cells: {
      sales: { "deals.move": { allowed: true, default: true, changed: false } },
      viewer: { "deals.move": { allowed: true, default: false, changed: true } },
    },
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

  it("says when the tool has no role", () => {
    expect(
      renderToStaticMarkup(<AccessMatrix matrix={{ roles: [], actions: [], cells: {} }} />),
    ).toContain("declares no role");
  });
});

describe("editing", () => {
  const matrix: AccessMatrixData = {
    roles: ["viewer"],
    actions: ["a", "b"],
    cells: {
      viewer: {
        a: { allowed: false, default: false, changed: false },
        b: { allowed: true, default: false, changed: true },
      },
    },
  };

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
