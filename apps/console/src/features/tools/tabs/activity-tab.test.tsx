// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, mount } from "../../../test-utils";
import { HOUR, NOW, tabProps, toolsApi } from "../test-helpers";
import ActivityTab from "./activity-tab";

afterEach(cleanup);
const at = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const open = (entries: unknown[]) =>
  mount(<ActivityTab {...tabProps(toolsApi({ "/api/tools/crm/activity": { entries } }).api)} />);

describe("the tool's activity", () => {
  it("lists who did what, through which interface, and how it ended", async () => {
    const page = await open([
      {
        id: "1",
        at: at(HOUR),
        actor: "ada@acme.test",
        interface: "web",
        kind: "promotion",
        subject: "production:1.4.0",
        result: "ok",
      },
      {
        id: "2",
        at: at(2 * HOUR),
        actor: "bob@acme.test",
        interface: "mcp",
        kind: "action",
        subject: "crm.contacts.delete",
        result: "denied",
      },
      {
        id: "3",
        at: at(3 * HOUR),
        actor: "ci",
        interface: "",
        kind: "deployment",
        subject: "preview:1.5.1",
        result: "error",
      },
    ]);
    const rows = [...page.querySelectorAll("tbody tr")].map((r) => r.textContent);
    expect(rows[0]).toContain("1 hour ago");
    expect(rows[0]).toContain("ada@acme.test");
    expect(rows[0]).toContain("promotionproduction:1.4.0");
    expect(rows[0]).toContain("Done");
    expect(rows[1]).toContain("Denied");
    expect(rows[2]).toContain("Failed");
    expect(rows[2]).toContain("—");
  });

  it("explains an empty log", async () => {
    expect((await open([])).textContent).toContain("Nothing has happened yet");
  });
});
