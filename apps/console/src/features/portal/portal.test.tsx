// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount, NOW, refusal, type } from "../../test-utils";
import type { WorkspaceInfo } from "../../workspace";
import { PortalHome } from "./home";
import { MOCK_TOOLS, mockLibrary, mockToolCard } from "./mock";
import ToolOverview from "./tool-card";

afterEach(cleanup);

const ws = (
  admin: boolean,
  roles: string[] = admin ? ["admin"] : ["developer"],
): WorkspaceInfo => ({
  workspace: "demo",
  endpoint: "https://demo.example.test",
  person: { id: "m1", email: "ada@acme.example", name: "ada", roles, admin },
  setup: { members: 3, invitations: 1, tools: 4, deployed: 2, called: true },
});
const go = () => {};

describe("Home, the person's library (D-117)", () => {
  const library = (admin = false) => ({ tools: mockLibrary(admin) });

  it("lists the tools the person added and those they may add, with nothing technical", async () => {
    const { api } = fakeApi({ "/api/library": library() });
    const view = await mount(<PortalHome ws={ws(false)} api={api} go={go} />);
    const mine = view.querySelector("[aria-labelledby='my-tools']")!;
    expect(mine.textContent).toContain("CRM");
    expect(mine.textContent).toContain("Odoo gateway");
    expect(mine.textContent).toContain("Setup to finish");
    const available = view.querySelector("[aria-labelledby='available']")!;
    expect(available.textContent).toContain("Inventory");
    expect(view.textContent).not.toMatch(/v\d+\.\d+|MCP|API|CLI|role/i);
    expect(view.textContent).not.toContain("In this workspace");
  });

  it("sends to the tool's page to use it, or to finish its setup", async () => {
    const { api } = fakeApi({ "/api/library": library() });
    const view = await mount(<PortalHome ws={ws(false)} api={api} go={go} />);
    expect(button(view, "Use").getAttribute("href")).toBe("/library/crm");
    expect(button(view, "Finish setup").getAttribute("href")).toBe("/library/odoo");
  });

  it("adds a tool with a click and opens its page", async () => {
    const seen: string[] = [];
    const { api, sent } = fakeApi({
      "/api/library": library(),
      "POST /api/library/inventory": { installed: true, setupUrl: null },
    });
    const view = await mount(<PortalHome ws={ws(false)} api={api} go={(h) => seen.push(h)} />);
    await click(button(view, "Add"));
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual(["POST /api/library/inventory"]);
    expect(seen).toEqual(["/library/inventory"]);
  });

  it("filters by what the person types, and says when nothing matches", async () => {
    const { api } = fakeApi({ "/api/library": library() });
    const view = await mount(<PortalHome ws={ws(false)} api={api} go={go} />);
    const search = view.querySelector<HTMLInputElement>("input[type=search]")!;
    await type(search, "equipment");
    expect(view.querySelector("[aria-labelledby='my-tools']")!.textContent).toContain(
      "No tool of yours matches",
    );
    expect(view.querySelector("[aria-labelledby='available']")!.textContent).toContain("Inventory");
    await type(search, "zzz");
    expect(view.textContent).toContain("No available tool matches");
  });

  it("shows an empty state that says what to do, and an error with a retry", async () => {
    const empty = await mount(
      <PortalHome ws={ws(false)} api={fakeApi({ "/api/library": { tools: [] } }).api} go={go} />,
    );
    expect(empty.textContent).toContain("You have no tool yet");
    expect(empty.textContent).toContain("Ask an admin");
    await cleanup();
    const failed = await mount(
      <PortalHome
        ws={ws(false)}
        api={
          fakeApi({
            "/api/library": () => {
              throw refusal(500);
            },
          }).api
        }
        go={go}
      />,
    );
    expect(failed.textContent).toContain("could not be loaded");
    expect(button(failed, "Try again")).toBeTruthy();
  });
});

describe("Home for an admin", () => {
  it("adds the numbers of the workspace and the checklist while it is not done", async () => {
    const { api } = fakeApi({
      "/api/library": { tools: mockLibrary(true) },
      "/api/tools": { tools: [] },
    });
    const view = await mount(
      <PortalHome
        ws={{ ...ws(true), setup: { ...ws(true).setup, called: false } }}
        api={api}
        go={go}
      />,
    );
    expect(view.textContent).toContain("In this workspace");
    expect(view.textContent).toContain("Get started");
    expect(view.querySelector("[aria-labelledby='available']")!.textContent).toContain("Inventory");
  });
});

describe("Tool card", () => {
  const card = (name: string, admin: boolean) =>
    fakeApi({ [`/api/catalog/${name}`]: mockToolCard(name, admin) }).api;

  it("renders the README with its images from the tool's bundle, and the details", async () => {
    const view = await mount(
      <ToolOverview tool="crm" ws={ws(false)} api={card("crm", false)} now={() => NOW} />,
    );
    expect(view.querySelector(".fp-card-head a, .fp-card-head button")!.textContent).toBe("Open");
    expect(view.querySelector("img")!.getAttribute("src")).toBe(
      "/console-api/api/catalog/crm/assets/img/contacts.svg?v=mock",
    );
    expect(view.querySelector("table")).toBeTruthy();
    expect(view.querySelector("[aria-label=Details]")!.textContent).toContain("1.4.0");
    expect(view.querySelector("[aria-label=Details]")!.textContent).toContain("Your HubSpot key");
    expect(view.querySelector("[aria-label=Details]")!.textContent).toContain("hubspot");
    expect(button(view, "Open").getAttribute("href")).toBe("/t/crm/");
  });

  it("keeps the hostile part of a README inert", async () => {
    const view = await mount(
      <ToolOverview tool="crm" ws={ws(false)} api={card("crm", false)} now={() => NOW} />,
    );
    expect(view.querySelector("script")).toBeNull();
    expect(document.body.dataset.pwned).toBeUndefined();
    expect(
      [...view.querySelectorAll("a")].some((a) =>
        /^(javascript|data):/i.test(a.getAttribute("href") ?? ""),
      ),
    ).toBe(false);
    expect(
      [...view.querySelectorAll("img")].every((i) =>
        i.getAttribute("src")!.startsWith("/console-api/api/catalog/crm/assets/"),
      ),
    ).toBe(true);
    for (const a of view.querySelectorAll<HTMLAnchorElement>("a[target=_blank]"))
      expect(a.rel).toBe("noopener noreferrer");
  });

  it("shows the connect instructions per interface in copy blocks", async () => {
    const view = await mount(
      <ToolOverview tool="crm" ws={ws(false)} api={card("crm", false)} now={() => NOW} />,
    );
    await click(button(view, "How to install"));
    expect(view.textContent).toContain("Claude (MCP)");
    expect(view.textContent).toContain("https://demo.fabriks.example/t/crm/mcp");
    expect(view.textContent).toContain("https://demo.fabriks.example/t/crm/api");
    expect(view.textContent).toContain("forgeron crm --help");
    expect(view.querySelector("a[href='/settings']")!.textContent).toContain("Settings, Security");
  });

  it("tells a person without access what to ask for, with no primary button", async () => {
    const view = await mount(
      <ToolOverview
        tool="inventory"
        ws={ws(false)}
        api={card("inventory", false)}
        now={() => NOW}
      />,
    );
    expect(view.textContent).toContain("You do not use this tool yet.");
    expect(view.textContent).toContain("Logistics");
    expect(view.querySelector(".fg-btn-primary")).toBeNull();
  });

  it("tells an admin without a role of the tool to give it to themselves, never to ask an admin (D-124)", async () => {
    const view = await mount(
      <ToolOverview
        tool="inventory"
        ws={ws(true)}
        api={card("inventory", false)}
        now={() => NOW}
      />,
    );
    expect(view.textContent).toContain("Your roles do not let you use this tool yet.");
    expect(view.textContent).toContain("Give yourself one of these roles: Logistics");
    expect(view.textContent).toContain("in Members");
    expect(view.textContent).not.toMatch(/ask an admin/i);
    expect(view.querySelector("a[href='/members']")).toBeTruthy();
    expect(view.querySelector("a[href='?tab=access']")).toBeTruthy();
  });

  it("shows an error with a retry when the card does not load", async () => {
    const view = await mount(
      <ToolOverview
        tool="crm"
        ws={ws(false)}
        api={
          fakeApi({
            "/api/catalog/crm": () => {
              throw refusal(404);
            },
          }).api
        }
      />,
    );
    expect(view.textContent).toContain("The tool card could not be loaded.");
    expect(button(view, "Try again")).toBeTruthy();
  });
});

describe("mock", () => {
  it("has a tool of each kind of access", () => {
    expect(new Set(MOCK_TOOLS.map((t) => t.access))).toEqual(new Set(["granted", "requestable"]));
  });
});
