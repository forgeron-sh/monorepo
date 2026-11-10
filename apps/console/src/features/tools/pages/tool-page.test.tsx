// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { cleanup, click, mount } from "../../../test-utils";
import { branches, pageProps, toolsApi, tools, versions } from "../test-helpers";
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
    const page = await mount(<ToolPage name="crm" {...pageProps(toolsApi(routes).api)} />);
    await flushLazy();
    expect(page.querySelector("h1")?.textContent).toBe("crm");
    expect(page.textContent).toContain("Companies, contacts and deals.");
    expect(tabLabels(page)).toEqual([
      "Branches",
      "Versions",
      "Availability",
      "Access",
      "Secrets",
      "Activity",
    ]);
    expect(page.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("Branches");
    expect(page.textContent).toContain("feat-export");
  });

  it("opens the tab the address names, and moves between tabs without leaving the page", async () => {
    window.history.replaceState(null, "", "/tools/crm?tab=versions");
    const page = await mount(<ToolPage name="crm" {...pageProps(toolsApi(routes).api)} />);
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

  it("shows a member none of the admin tabs, the secrets included (D-118)", async () => {
    const page = await mount(
      <ToolPage name="crm" {...pageProps(toolsApi(routes).api, { admin: false })} />,
    );
    await flushLazy();
    expect(tabLabels(page)).toEqual([]);
  });

  it("shows production by default, and moves to a branch's address, keeping the tab (D-120)", async () => {
    window.history.replaceState(null, "", "/tools/crm?tab=versions");
    const went: string[] = [];
    const page = await mount(
      <ToolPage name="crm" {...pageProps(toolsApi(routes).api, { go: (h) => went.push(h) })} />,
    );
    await flushLazy();
    const pick = page.querySelector<HTMLSelectElement>(".ft-branch-pick select")!;
    expect([...pick.options].map((o) => o.textContent)).toEqual(["Production", "feat-export"]);
    expect(pick.value).toBe("");
    expect(page.querySelector(".ft-branch-band")).toBeNull();
    await act(async () => {
      pick.value = "feat-export";
      pick.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(went).toEqual(["/tools/crm/tree/feat-export?tab=versions"]);
  });

  it("on a branch, says so above every tab and marks the tabs that every branch shares", async () => {
    window.history.replaceState(null, "", "/tools/crm/tree/feat-export?tab=versions");
    const went: string[] = [];
    const page = await mount(
      <ToolPage
        name="crm"
        branch="feat-export"
        {...pageProps(toolsApi(routes).api, { go: (h) => went.push(h) })}
      />,
    );
    await flushLazy();
    expect(page.querySelector<HTMLSelectElement>(".ft-branch-pick select")!.value).toBe(
      "feat-export",
    );
    expect(page.querySelector(".ft-branch-band")?.textContent).toContain("feat-export");
    expect(page.textContent).toContain("The same for every branch.");
    await click(
      [...page.querySelectorAll("button")].find((b) => b.textContent === "Back to production"),
    );
    expect(went).toEqual(["/tools/crm?tab=versions"]);
  });

  it("shows production, with a word, for a branch that has no preview anymore", async () => {
    window.history.replaceState(null, "", "/tools/crm/tree/gone?tab=versions");
    const page = await mount(
      <ToolPage name="crm" branch="gone" {...pageProps(toolsApi(routes).api)} />,
    );
    await flushLazy();
    expect(page.textContent).toContain("The branch gone has no preview anymore.");
    expect(page.querySelector(".ft-branch-band")).toBeNull();
    expect(window.location.pathname).toBe("/tools/crm");
    expect(window.location.search).toBe("?tab=versions");
  });

  it("says when the tool does not exist, and when the list cannot be loaded", async () => {
    const missing = await mount(<ToolPage name="nope" {...pageProps(toolsApi(routes).api)} />);
    expect(missing.textContent).toContain("There is no tool named nope.");
    await cleanup();
    const broken = await mount(<ToolPage name="crm" {...pageProps(toolsApi({}).api)} />);
    expect(broken.textContent).toContain("The tool could not be loaded.");
  });
});
