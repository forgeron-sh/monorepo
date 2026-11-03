import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { loadSecretsStatus, SecretsStatus } from "./secrets-status";

describe("loadSecretsStatus", () => {
  it("keeps names and states, and drops anything else the answer carries", async () => {
    const rows = await loadSecretsStatus(
      async () => ({
        secrets: [
          {
            name: "ODOO_KEY",
            value: "must-not-survive",
            environments: { pilot: "set", production: "set", preview: "nope" },
          },
        ],
      }),
      "crm",
    );
    expect(rows).toEqual([
      { name: "ODOO_KEY", environments: { preview: "missing", pilot: "set", production: "set" } },
    ]);
    expect(JSON.stringify(rows)).not.toContain("must-not-survive");
  });

  it("asks for the status of the tool", async () => {
    const paths: string[] = [];
    await loadSecretsStatus(async (path) => (paths.push(path), { secrets: [] }), "crm");
    expect(paths).toEqual(["/api/tools/crm/secrets-status"]);
  });
});

describe("SecretsStatus", () => {
  it("shows set or missing per environment", () => {
    const out = renderToStaticMarkup(
      <SecretsStatus
        rows={[
          {
            name: "ODOO_KEY",
            environments: { preview: "missing", pilot: "set", production: "set" },
          },
        ]}
      />,
    );
    expect(out).toContain("ODOO_KEY");
    expect(out).toContain("Preview");
    expect(out.match(/>set</g)).toHaveLength(2);
    expect(out.match(/>missing</g)).toHaveLength(1);
  });

  it("says when the tool declares no secret", () => {
    expect(renderToStaticMarkup(<SecretsStatus rows={[]} />)).toContain("declares no secret");
  });
});
