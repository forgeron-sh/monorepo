// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { AuditPage, loadAudit } from "./audit-page";
import { cleanup, fakeApi, mount, NOW, refusal } from "./test-utils";

afterEach(cleanup);

const entries = [
  {
    id: "e1",
    at: "2026-11-03T11:55:00Z",
    tool: "crm",
    actor: "ada@acme.fr",
    interface: "cli",
    kind: "deployment",
    subject: "crm@1.5.1",
    result: "ok",
    detail: "dropped",
  },
  {
    id: "e2",
    at: "2026-11-01T11:55:00Z",
    tool: "crm",
    actor: "bob@acme.fr",
    interface: "mcp",
    kind: "action",
    subject: "crm.contacts.delete",
    result: "denied",
  },
];

describe("loadAudit", () => {
  it("keeps what the table shows", async () => {
    const rows = await loadAudit(async () => ({ entries }));
    expect(rows).toHaveLength(2);
    expect(JSON.stringify(rows)).not.toContain("dropped");
    expect(rows[1]!.result).toBe("denied");
  });
});

describe("AuditPage", () => {
  it("lists who did what, when, and how it ended", async () => {
    const { api } = fakeApi({ "/api/audit": { entries } });
    const page = await mount(<AuditPage api={api} admin now={() => NOW} />);
    expect(page.textContent).toContain("ada@acme.fr");
    expect(page.textContent).toContain("5 minutes ago");
    expect(page.textContent).toContain("crm.contacts.delete");
    expect(page.textContent).toContain("denied");
  });
  it("says there is nothing yet", async () => {
    const { api } = fakeApi({ "/api/audit": { entries: [] } });
    const page = await mount(<AuditPage api={api} admin now={() => NOW} />);
    expect(page.textContent).toContain("Nothing recorded yet");
  });
  it("tells a non-admin it is for admins without asking", async () => {
    const { api, reads } = fakeApi({});
    const page = await mount(<AuditPage api={api} admin={false} now={() => NOW} />);
    expect(page.textContent).toContain("The audit log is for admins.");
    expect(reads).toEqual([]);
  });
  it("says what happened when it fails", async () => {
    const { api } = fakeApi({
      "/api/audit": () => {
        throw refusal(500);
      },
    });
    const page = await mount(<AuditPage api={api} admin now={() => NOW} />);
    expect(page.querySelector("[role=alert]")?.textContent).toContain("could not be loaded");
  });
});
