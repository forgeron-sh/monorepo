import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { loadPendingApprovals, PendingApprovals } from "./pending-approvals";

describe("loadPendingApprovals", () => {
  it("asks for the tool and keeps added and broadened resources only", async () => {
    const paths: string[] = [];
    const versions = await loadPendingApprovals(
      async (path) => (
        paths.push(path),
        {
          versions: [
            {
              id: "v1",
              version: "1.1.0",
              secretToken: "must-not-survive",
              approvals: [
                { resource: "resources.network", kind: "resource.added" },
                { resource: "resources.connectors.hubspot", kind: "resource.broadened" },
                { resource: "resources.cache", kind: "resource.removed" },
              ],
            },
          ],
        }
      ),
      "crm",
    );
    expect(paths).toEqual(["/api/tools/crm/approvals"]);
    expect(versions).toEqual([
      {
        id: "v1",
        version: "1.1.0",
        requests: [
          { resource: "resources.network", kind: "added" },
          { resource: "resources.connectors.hubspot", kind: "broadened" },
        ],
      },
    ]);
    expect(JSON.stringify(versions)).not.toContain("must-not-survive");
  });
});

describe("PendingApprovals", () => {
  const versions = [
    {
      id: "v1",
      version: "1.1.0",
      requests: [{ resource: "resources.network", kind: "added" as const }],
    },
  ];

  it("lists each pending version with what it asks for", () => {
    const out = renderToStaticMarkup(<PendingApprovals versions={versions} />);
    expect(out).toContain("1.1.0");
    expect(out).toContain("resources.network");
    expect(out).toContain("added");
    expect(out).not.toContain("Approve");
  });

  it("draws an approve button when it can approve", () => {
    expect(
      renderToStaticMarkup(<PendingApprovals versions={versions} onApprove={() => {}} />),
    ).toContain("Approve");
  });

  it("says when nothing waits", () => {
    expect(renderToStaticMarkup(<PendingApprovals versions={[]} />)).toContain(
      "No version is waiting for approval.",
    );
  });
});
