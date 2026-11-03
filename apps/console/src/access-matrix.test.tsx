import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccessMatrix, loadAccessMatrix, type AccessMatrixData } from "./access-matrix";

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
      "deals.move": { allowed: true, changed: false },
      "deals.delete": { allowed: true, changed: true },
    });
    expect(JSON.stringify(matrix)).not.toContain("must-not-survive");
  });

  it("treats a missing cell as refused", async () => {
    const matrix = await loadAccessMatrix(async () => ({ roles: ["a"], actions: ["x"] }), "t");
    expect(matrix.cells.a!.x).toEqual({ allowed: false, changed: false });
  });
});

describe("AccessMatrix", () => {
  const matrix: AccessMatrixData = {
    roles: ["sales", "viewer"],
    actions: ["deals.move"],
    cells: {
      sales: { "deals.move": { allowed: true, changed: false } },
      viewer: { "deals.move": { allowed: true, changed: true } },
    },
  };

  it("shows each role against each action, and marks what an admin changed", () => {
    const out = renderToStaticMarkup(<AccessMatrix matrix={matrix} />);
    expect(out).toContain("sales");
    expect(out).toContain("deals.move");
    expect(out).toContain("(changed)");
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
