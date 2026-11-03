// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { ApprovalsPage } from "./approvals-page";
import { decideVersion, loadPendingApprovals, PendingApprovals } from "./pending-approvals";
import { button, cleanup, click, fakeApi, mount, refusal } from "./test-utils";

afterEach(cleanup);

const served = {
  versions: [
    {
      tool: "crm",
      id: "v1",
      version: "1.1.0",
      secretToken: "must-not-survive",
      approvals: [
        { id: "a1", resource: "resources.network", kind: "resource.added" },
        { id: "a2", resource: "resources.connectors.hubspot", kind: "resource.broadened" },
        { id: "a3", resource: "resources.cache", kind: "resource.removed" },
      ],
    },
  ],
};

describe("loadPendingApprovals", () => {
  it("asks for the workspace and keeps added and broadened resources only", async () => {
    const paths: string[] = [];
    const versions = await loadPendingApprovals(async (path) => (paths.push(path), served));
    expect(paths).toEqual(["/api/approvals"]);
    expect(versions).toEqual([
      {
        id: "v1",
        tool: "crm",
        version: "1.1.0",
        requests: [
          { id: "a1", resource: "resources.network", kind: "added" },
          { id: "a2", resource: "resources.connectors.hubspot", kind: "broadened" },
        ],
      },
    ]);
    expect(JSON.stringify(versions)).not.toContain("must-not-survive");
  });

  it("decides every request of a version, in order, and stops at the first refusal", async () => {
    const calls: string[] = [];
    const [version] = await loadPendingApprovals(async () => served);
    await decideVersion(async (path) => void calls.push(path), version!, "approved");
    expect(calls).toEqual(["/api/approvals/a1", "/api/approvals/a2"]);
    const failing = async (path: string) => {
      calls.push(path);
      throw refusal(409);
    };
    await expect(decideVersion(failing, version!, "rejected")).rejects.toThrow("409");
    expect(calls).toHaveLength(3);
  });
});

describe("PendingApprovals", () => {
  const versions = [
    {
      id: "v1",
      tool: "crm",
      version: "1.1.0",
      requests: [{ id: "a1", resource: "resources.network", kind: "added" as const }],
    },
  ];

  it("lists each pending version with what it asks for", () => {
    const out = renderToStaticMarkup(<PendingApprovals versions={versions} />);
    expect(out).toContain("crm");
    expect(out).toContain("1.1.0");
    expect(out).toContain("resources.network");
    expect(out).toContain("added");
    expect(out).not.toContain("Approve");
  });

  it("draws the buttons it can act on", () => {
    const out = renderToStaticMarkup(
      <PendingApprovals versions={versions} onApprove={() => {}} onReject={() => {}} />,
    );
    expect(out).toContain("Approve");
    expect(out).toContain("Reject");
  });

  it("says when nothing waits", () => {
    expect(renderToStaticMarkup(<PendingApprovals versions={[]} />)).toContain(
      "No version is waiting for approval.",
    );
  });
});

describe("ApprovalsPage", () => {
  it("confirms before approving, then decides and reloads", async () => {
    let waiting = true;
    const { api, sent } = fakeApi({
      "/api/approvals": () => (waiting ? served : { versions: [] }),
      "POST /api/approvals/a1": () => void 0,
      "POST /api/approvals/a2": () => void (waiting = false),
    });
    let decided = 0;
    const page = await mount(<ApprovalsPage api={api} onDecided={() => decided++} />);
    await click(button(page, "Approve"));
    const dialog = document.querySelector("[role=dialog]")!;
    expect(dialog.textContent).toContain("Approve crm 1.1.0?");
    expect(dialog.textContent).toContain("resources.network");
    expect(sent).toEqual([]);
    await click(button(dialog, "Approve"));
    expect(sent.map((s) => s.path)).toEqual(["/api/approvals/a1", "/api/approvals/a2"]);
    expect(sent[0]!.body).toEqual({ decision: "approved" });
    expect(decided).toBe(1);
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(page.textContent).toContain("Nothing is waiting");
  });

  it("keeps the dialog open with the reason when a decision is refused", async () => {
    const { api } = fakeApi({
      "/api/approvals": served,
      "POST /api/approvals/a1": () => {
        throw refusal(409, "The approval a1 is already approved.");
      },
    });
    const page = await mount(<ApprovalsPage api={api} />);
    await click(button(page, "Reject"));
    const dialog = document.querySelector("[role=dialog]")!;
    await click(button(dialog, "Reject"));
    expect(dialog.querySelector("[role=alert]")?.textContent).toContain("already approved");
  });

  it("says what happened when it cannot load", async () => {
    const { api } = fakeApi({
      "/api/approvals": () => {
        throw refusal(500);
      },
    });
    const page = await mount(<ApprovalsPage api={api} />);
    expect(page.querySelector("[role=alert]")?.textContent).toContain("could not be loaded");
  });
});
