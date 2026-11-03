// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { firstRunSteps, Overview } from "./overview";
import { cleanup, click, button, fakeApi, mount } from "./test-utils";
import type { WorkspaceInfo } from "./workspace";

afterEach(cleanup);

const ws = (setup: Partial<WorkspaceInfo["setup"]> = {}, admin = true): WorkspaceInfo => ({
  workspace: "demo",
  endpoint: "https://demo.example.test",
  person: { id: "m1", email: "ada@acme.fr", name: "ada", roles: admin ? ["admin"] : [], admin },
  setup: { members: 1, invitations: 0, tools: 0, deployed: 0, called: false, ...setup },
});

describe("firstRunSteps", () => {
  it("is computed from the counts", () => {
    const done = (info: WorkspaceInfo) => firstRunSteps(info).map((s) => s.done);
    expect(done(ws())).toEqual([true, false, false, false]);
    expect(done(ws({ invitations: 1 }))).toEqual([true, true, false, false]);
    expect(done(ws({ members: 2, deployed: 1 }))).toEqual([true, true, true, false]);
    expect(done(ws({ members: 2, deployed: 1, called: true }))).toEqual([true, true, true, true]);
  });
});

describe("Overview", () => {
  it("shows the exact commands of the first tool and the endpoint on a fresh workspace", async () => {
    const { api } = fakeApi({});
    const page = await mount(<Overview ws={ws()} fetchJson={api.fetchJson} go={() => {}} />);
    expect(page.textContent).toContain("1 of 4 steps done");
    const commands = [...page.querySelectorAll(".fg-copy-text")].map((c) =>
      c.textContent?.replace(/^\$ /, ""),
    );
    expect(commands).toEqual([
      "forgeron init",
      "forgeron link --workspace demo",
      "forgeron login",
      "forgeron deploy --env preview --branch <name>",
      "forgeron <tool> --help",
      "https://demo.example.test",
    ]);
    expect(page.querySelector('[data-next="true"]')?.textContent).toContain("Invite your team");
  });

  it("names a deployed tool in the last command and routes to Members from the first step", async () => {
    const { api } = fakeApi({
      "/api/tools": {
        tools: [
          {
            name: "crm",
            production: null,
            previews: [{ branch: "main", version: "0.1.0" }],
          },
        ],
      },
    });
    const go = vi.fn<(href: string) => void>();
    const page = await mount(
      <Overview ws={ws({ members: 3, tools: 1, deployed: 1 })} fetchJson={api.fetchJson} go={go} />,
    );
    expect(page.textContent).toContain("forgeron crm --help");
    expect(page.textContent).not.toContain("forgeron init");
    expect(page.textContent).toContain("3 of 4 steps done");
  });

  it("sends an admin to Members, and asks a member to ask an admin", async () => {
    const { api } = fakeApi({});
    const go = vi.fn<(href: string) => void>();
    const admin = await mount(<Overview ws={ws()} fetchJson={api.fetchJson} go={go} />);
    await click(button(admin, "Invite people"));
    expect(go).toHaveBeenCalledWith("/members");
    await cleanup();
    const member = await mount(<Overview ws={ws({}, false)} fetchJson={api.fetchJson} go={go} />);
    expect(button(member, "Invite people")).toBeUndefined();
    expect(member.textContent).toContain("Ask an admin of this workspace to invite them.");
  });

  it("says when everything is done", async () => {
    const { api } = fakeApi({ "/api/tools": { tools: [] } });
    const page = await mount(
      <Overview
        ws={ws({ members: 2, tools: 1, deployed: 1, called: true })}
        fetchJson={api.fetchJson}
        go={() => {}}
      />,
    );
    expect(page.textContent).toContain("Your workspace is set up.");
    expect(page.textContent).toContain("4 of 4 steps done");
  });
});
