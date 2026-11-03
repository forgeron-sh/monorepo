// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { cleanup, click, mount } from "../../../test-utils";
import { branches, NOW, toolsApi, tools, versions } from "../test-helpers";
import ToolPage from "./tool-page";

afterEach(cleanup);
beforeEach(() => window.history.replaceState(null, "", "/tools/crm"));

const routes = {
  "/api/tools": tools,
  "/api/tools/crm/branches": branches,
  "/api/tools/crm/versions": versions,
  "/api/tools/crm/activity": { entries: [] },
  "/api/tools/crm/secrets-status": { secrets: [] },
};
const tabLabels = (c: HTMLElement) =>
  [...c.querySelectorAll('[role="tab"]')].map((t) => t.textContent);
/** The first open of a tab imports its code: waits until nothing says "Loading". */
const flushLazy = async () => {
  for (let i = 0; i < 100; i++) {
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    if (!document.body.textContent?.includes("Loading")) return;
  }
};

describe("the tool page", () => {
  it("draws the header and the registered tabs, and opens the first one", async () => {
    const page = await mount(
      <ToolPage name="crm" api={toolsApi(routes).api} admin now={() => NOW} />,
    );
    await flushLazy();
    expect(page.querySelector("h1")?.textContent).toBe("crm");
    expect(page.textContent).toContain("Companies, contacts and deals.");
    expect(tabLabels(page)).toEqual(["Branches", "Versions", "Access", "Secrets", "Activity"]);
    expect(page.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("Branches");
    expect(page.textContent).toContain("feat-export");
  });

  it("opens the tab the address names, and moves between tabs without leaving the page", async () => {
    window.history.replaceState(null, "", "/tools/crm?tab=versions");
    const page = await mount(
      <ToolPage name="crm" api={toolsApi(routes).api} admin now={() => NOW} />,
    );
    await flushLazy();
    expect(page.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("Versions");
    expect(page.textContent).toContain("Compared with");
    const activity = [...page.querySelectorAll('[role="tab"]')].find(
      (t) => t.textContent === "Activity",
    );
    await click(activity);
    await flushLazy();
    expect(window.location.search).toBe("?tab=activity");
    expect(page.textContent).toContain("Nothing has happened yet");
  });

  it("shows a member only the tabs that are not for admins", async () => {
    const page = await mount(
      <ToolPage name="crm" api={toolsApi(routes).api} admin={false} now={() => NOW} />,
    );
    await flushLazy();
    expect(tabLabels(page)).toEqual(["Secrets"]);
  });

  it("says when the tool does not exist, and when the list cannot be loaded", async () => {
    const missing = await mount(
      <ToolPage name="nope" api={toolsApi(routes).api} admin now={() => NOW} />,
    );
    expect(missing.textContent).toContain("There is no tool named nope.");
    await cleanup();
    const broken = await mount(
      <ToolPage name="crm" api={toolsApi({}).api} admin now={() => NOW} />,
    );
    expect(broken.textContent).toContain("The tool could not be loaded.");
  });
});
