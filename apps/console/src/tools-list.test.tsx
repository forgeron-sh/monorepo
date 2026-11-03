import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { loadTools, ToolsList } from "./tools-list";

describe("loadTools", () => {
  it("asks for the workspace's tools and keeps what is shown", async () => {
    const paths: string[] = [];
    const rows = await loadTools(
      async (path) => (
        paths.push(path),
        {
          tools: [
            {
              name: "crm",
              production: "1.0.0",
              pilot: 3,
              previews: [{ branch: "feat", version: "1.1.0", secret: "x" }],
              other: "dropped",
            },
          ],
        }
      ),
    );
    expect(paths).toEqual(["/api/tools"]);
    expect(rows).toEqual([
      {
        name: "crm",
        production: "1.0.0",
        pilot: null,
        previews: [{ branch: "feat", version: "1.1.0" }],
      },
    ]);
  });
});

describe("ToolsList", () => {
  it("shows the version of each environment, or that it is not deployed", () => {
    const out = renderToStaticMarkup(
      <ToolsList
        rows={[
          {
            name: "crm",
            production: "1.0.0",
            pilot: "1.1.0",
            previews: [{ branch: "feat", version: "1.2.0" }],
          },
          { name: "odoo", production: null, pilot: null, previews: [] },
        ]}
      />,
    );
    for (const text of [
      "crm",
      "1.0.0",
      "1.1.0",
      "feat 1.2.0",
      "odoo",
      "Preview",
      "Pilot",
      "Production",
    ]) {
      expect(out).toContain(text);
    }
    expect(out.match(/not deployed/g)).toHaveLength(3);
  });

  it("says when there is no tool", () => {
    expect(renderToStaticMarkup(<ToolsList rows={[]} />)).toContain("No tool installed yet.");
  });
});
