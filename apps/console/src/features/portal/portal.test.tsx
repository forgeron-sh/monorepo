// @vitest-environment jsdom
import { PLATFORM_PERMISSIONS } from "@forgeron/permissions";
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount, NOW, refusal, type } from "../../test-utils";
import type { WorkspaceInfo } from "../../workspace";
import { PortalHome } from "./home";
import { DiscoverPage, MyToolsPage } from "./tool-lists";
import { MOCK_TOOLS, mockLibrary, mockToolCard } from "./mock";
import ToolOverview from "./tool-card";

afterEach(cleanup);

// `admin`: someone of the admin team, who holds every permission; otherwise a person of one team
// with no platform permission.
const ws = (admin: boolean): WorkspaceInfo => ({
  workspace: "demo",
  endpoint: "https://demo.example.test",
  person: {
    id: "m1",
    email: "ada@acme.example",
    name: "ada",
    teams: admin ? ["admin"] : ["developer"],
    permissions: admin ? [...PLATFORM_PERMISSIONS] : [],
  },
  setup: { members: 3, invitations: 1, tools: 4, deployed: 2, called: true },
});
const go = () => {};

describe("Home, My tools and Discover (D-117, D-128)", () => {
  const library = (admin = false) => ({ tools: mockLibrary(admin) });

  it("Home shows the person's tools and leads to Discover, with nothing technical", async () => {
    const { api } = fakeApi({ "/api/library": library() });
    const view = await mount(<PortalHome ws={ws(false)} api={api} go={go} />);
    const mine = view.querySelector("[aria-labelledby='my-tools']")!;
    expect(mine.textContent).toContain("CRM");
    expect(mine.textContent).toContain("Odoo gateway");
    expect(mine.textContent).toContain("Setup to finish");
    expect(mine.querySelector("a[href='/library']")?.textContent).toBe("All my tools");
    const available = view.querySelector("[aria-labelledby='available']")!;
    // Home only counts them: the list is Discover's.
    expect(available.textContent).not.toContain("Inventory");
    expect(available.querySelector("a[href='/discover']")?.textContent).toBe("Discover tools");
    expect(view.querySelector("input[type=search]")).toBeNull();
    expect(view.textContent).not.toMatch(/v\d+\.\d+|MCP|API|CLI|role/i);
    expect(view.textContent).not.toContain("In this workspace");
  });

  it("My tools sends to the tool's page to use it, or to finish its setup", async () => {
    const { api } = fakeApi({ "/api/library": library() });
    const view = await mount(<MyToolsPage ws={ws(false)} api={api} go={go} />);
    expect(view.querySelector("h1")?.textContent).toBe("My tools");
    expect(button(view, "Use").getAttribute("href")).toBe("/library/crm");
    expect(button(view, "Finish setup").getAttribute("href")).toBe("/library/odoo");
    expect(view.textContent).not.toContain("Inventory");
  });

  it("Discover adds a tool with a click and opens its page", async () => {
    const seen: string[] = [];
    const { api, sent } = fakeApi({
      "/api/library": library(),
      "POST /api/library/inventory": { installed: true, setupUrl: null },
    });
    const view = await mount(<DiscoverPage ws={ws(false)} api={api} go={(h) => seen.push(h)} />);
    expect(view.querySelector("h1")?.textContent).toBe("Discover");
    expect(view.textContent).not.toContain("CRM");
    await click(button(view, "Add"));
    expect(sent.map((s) => `${s.method} ${s.path}`)).toEqual(["POST /api/library/inventory"]);
    expect(seen).toEqual(["/library/inventory"]);
  });

  it("filters by what the person types, and says when nothing matches", async () => {
    const { api } = fakeApi({ "/api/library": library() });
    const mine = await mount(<MyToolsPage ws={ws(false)} api={api} go={go} />);
    await type(mine.querySelector<HTMLInputElement>("input[type=search]")!, "equipment");
    expect(mine.textContent).toContain("No tool of yours matches");
    await cleanup();
    const other = await mount(<DiscoverPage ws={ws(false)} api={api} go={go} />);
    const search = other.querySelector<HTMLInputElement>("input[type=search]")!;
    await type(search, "equipment");
    expect(other.textContent).toContain("Inventory");
    await type(search, "zzz");
    expect(other.textContent).toContain("No available tool matches");
  });

  it("shows empty states that say what to do, and an error with a retry", async () => {
    const none = fakeApi({ "/api/library": { tools: [] } }).api;
    const empty = await mount(<PortalHome ws={ws(false)} api={none} go={go} />);
    expect(empty.textContent).toContain("You have no tool yet");
    expect(empty.textContent).toContain("Ask someone who gives access");
    await cleanup();
    const nothing = await mount(<DiscoverPage ws={ws(false)} api={none} go={go} />);
    expect(nothing.textContent).toContain("Nothing new to add");
    expect(button(nothing, "Open my tools").getAttribute("href")).toBe("/library");
    await cleanup();
    const onlyNew = fakeApi({
      "/api/library": { tools: mockLibrary(false).filter((t) => !t.installed) },
    }).api;
    const start = await mount(<MyToolsPage ws={ws(false)} api={onlyNew} go={go} />);
    expect(button(start, "Discover tools").getAttribute("href")).toBe("/discover");
    await cleanup();
    const failed = await mount(
      <MyToolsPage
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
    expect(button(view, "Invite people").getAttribute("href")).toBe("/admin/members?invite");
    expect(view.querySelector("[aria-labelledby='available']")).toBeTruthy();
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

  it("names the teams that may use the tool, and marks the person's own", async () => {
    const view = await mount(
      <ToolOverview tool="crm" ws={ws(false)} api={card("crm", false)} now={() => NOW} />,
    );
    const details = view.querySelector("[aria-label=Details]")!;
    expect(details.textContent).toContain("Teams that may use it");
    expect(details.textContent).not.toContain("Roles that may use it");
    const chips = [...details.querySelectorAll(".fg-badge")].filter((b) =>
      /^(Developer|Sales):/.test(b.textContent ?? ""),
    );
    expect(chips.map((c) => c.textContent)).toEqual(["Developer: Manager", "Sales: User"]);
    // The person is in the developer team: that one is strong.
    expect(chips.map((c) => c.classList.contains("fg-badge-strong"))).toEqual([true, false]);
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
    expect(view.querySelector("a[href='/settings/security']")!.textContent).toContain(
      "Settings, Security",
    );
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
    expect(view.textContent).toContain("None of your teams uses this tool yet.");
    expect(view.textContent).toContain("Ask someone who gives access");
    expect(view.textContent).toContain("Logistics");
    expect(view.querySelector(".fg-btn-primary")).toBeNull();
  });

  it("sends a holder of access:write to the Access tab, never to ask someone (D-127, D-137)", async () => {
    const view = await mount(
      <ToolOverview
        tool="inventory"
        ws={ws(true)}
        api={card("inventory", false)}
        now={() => NOW}
      />,
    );
    expect(view.textContent).toContain("None of your teams uses this tool yet.");
    expect(view.textContent).toContain("give Everyone, or one of your teams, a profile there");
    expect(view.textContent).toContain("Logistics");
    expect(view.textContent).not.toMatch(/ask someone|give yourself/i);
    expect(view.querySelector("a[href='/members']")).toBeNull();
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
