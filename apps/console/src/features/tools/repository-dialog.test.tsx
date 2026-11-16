// @vitest-environment jsdom
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount, type } from "../../test-utils";
import { NewToolDialog, RepositoryDialog } from "./repository-dialog";

afterEach(cleanup);

/** Chooses an option of a React-controlled `<select>`. */
const choosing = (select: HTMLSelectElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

describe("adding a tool from GitHub (D-121)", () => {
  it("creates the tool and shows its token once, with the steps", async () => {
    let added = 0;
    const { api, sent } = fakeApi({
      "POST /api/tools/from-repository": {
        tool: "odoo",
        repo: "edicia-sh/odoo",
        productionBranch: "main",
        token: "test-token-not-real",
        expiresAt: "2027-11-10T00:00:00.000Z",
      },
    });
    await mount(<RepositoryDialog api={api} onClose={() => {}} onAdded={() => added++} />);
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
    const inputs = () => [...dialog().querySelectorAll<HTMLInputElement>("input")];
    expect(button(dialog(), "Add").disabled).toBe(true);
    await type(inputs()[0]!, "odoo");
    await type(inputs()[1]!, "not a repo");
    expect(button(dialog(), "Add").disabled).toBe(true);
    await type(inputs()[1]!, "edicia-sh/odoo");
    await click(button(dialog(), "Add"));
    expect(sent).toEqual([
      {
        method: "POST",
        path: "/api/tools/from-repository",
        body: { name: "odoo", repo: "edicia-sh/odoo", productionBranch: "main" },
      },
    ]);
    expect(added).toBe(1);
    expect(dialog().textContent).toContain("odoo is added");
    expect(dialog().textContent).toContain("test-token-not-real");
    expect(dialog().textContent).toContain("FORGERON_TOKEN");
    expect(dialog().textContent).toContain("The token is shown once.");
  });
});

const APP = {
  available: true,
  app: {
    slug: "forgeron-acme",
    owner: "acme-sh",
    htmlUrl: "https://github.com/apps/forgeron-acme",
    installUrl: "https://github.com/apps/forgeron-acme/installations/new",
    createdAt: "2026-11-10T00:00:00.000Z",
  },
  installations: [{ id: 7, account: "acme-sh", accountType: "Organization" }],
};
const repo = (name: string, over: object = {}) => ({
  repo: `acme-sh/${name}`,
  id: name.length,
  private: true,
  defaultBranch: "main",
  forgeron: true,
  workflow: false,
  tool: null,
  deployedOn: null,
  ...over,
});
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;

describe("adding a tool with the workspace's GitHub App (D-123)", () => {
  it("lists the repositories, links one in a click and adds its workflow, with no token", async () => {
    let added = 0;
    const { api, sent } = fakeApi({
      "/api/github": APP,
      "/api/github/repositories": {
        repositories: [repo("CRM-Tool"), repo("odoo", { tool: "odoo", workflow: true })],
      },
      "POST /api/github/repositories/link": {
        tool: "crm-tool",
        repo: "acme-sh/CRM-Tool",
        productionBranch: "main",
        workflow: "added",
        deployedOn: null,
        pullRequest: null,
        pullRequestError: null,
      },
    });
    await mount(<RepositoryDialog api={api} onClose={() => {}} onAdded={() => added++} />);
    expect(dialog().textContent).toContain("Linked to odoo");
    expect(button(dialog(), "Add").disabled).toBe(true);
    const option = [...dialog().querySelectorAll<HTMLButtonElement>('[role="option"]')];
    expect(option[1]!.disabled).toBe(true);
    await click(option[0]);
    await click(button(dialog(), "Add"));
    expect(sent).toEqual([
      {
        method: "POST",
        path: "/api/github/repositories/link",
        body: {
          repo: "acme-sh/CRM-Tool",
          name: "crm-tool",
          productionBranch: "main",
          addWorkflow: true,
        },
      },
    ]);
    expect(added).toBe(1);
    expect(dialog().textContent).toContain("crm-tool is added");
    expect(dialog().textContent).toContain("The workflow was added");
    expect(dialog().textContent).not.toContain("FORGERON_TOKEN");
  });

  it("makes the admin decide when the repository deploys to another platform, then says what is left", async () => {
    const { api, sent } = fakeApi({
      "/api/github": APP,
      "/api/github/repositories": {
        repositories: [repo("notes", { workflow: true, deployedOn: "https://old.forgeron.test" })],
      },
      "POST /api/github/repositories/link": {
        tool: "notes",
        repo: "acme-sh/notes",
        productionBranch: "main",
        workflow: "present",
        deployedOn: "https://old.forgeron.test",
        pullRequest: "https://github.com/acme-sh/notes/pull/1",
        pullRequestError: null,
      },
    });
    await mount(<RepositoryDialog api={api} onClose={() => {}} onAdded={() => {}} />);
    await click(dialog().querySelector<HTMLButtonElement>('[role="option"]')!);
    expect(dialog().textContent).toContain("deploys to another platform");
    expect(dialog().textContent).toContain("https://old.forgeron.test");
    // Nothing is preselected: Add waits for the choice.
    expect(button(dialog(), "Add").disabled).toBe(true);
    const select = dialog().querySelector<HTMLSelectElement>("select")!;
    await choosing(select, "pull-request");
    expect(button(dialog(), "Add").disabled).toBe(false);
    await click(button(dialog(), "Add"));
    expect(sent).toEqual([
      {
        method: "POST",
        path: "/api/github/repositories/link",
        body: {
          repo: "acme-sh/notes",
          name: "notes",
          productionBranch: "main",
          otherPlatform: "pull-request",
        },
      },
    ]);
    expect(dialog().textContent).toContain("still deploys to https://old.forgeron.test");
    expect(dialog().querySelector<HTMLAnchorElement>("a")!.href).toBe(
      "https://github.com/acme-sh/notes/pull/1",
    );
  });

  it("asks nothing more for a repository that does not deploy elsewhere", async () => {
    const { api } = fakeApi({
      "/api/github": APP,
      "/api/github/repositories": { repositories: [repo("crm", { workflow: true })] },
    });
    await mount(<RepositoryDialog api={api} onClose={() => {}} onAdded={() => {}} />);
    await click(dialog().querySelector<HTMLButtonElement>('[role="option"]')!);
    expect(dialog().textContent).not.toContain("another platform");
    expect(button(dialog(), "Add").disabled).toBe(false);
  });

  it("draws a skeleton of the list while the repositories are read, not a sentence", async () => {
    const { api } = fakeApi({
      "/api/github": APP,
      "/api/github/repositories": () => new Promise(() => {}),
    });
    await mount(<RepositoryDialog api={api} onClose={() => {}} onAdded={() => {}} />);
    expect(dialog().querySelectorAll(".fg-skeleton").length).toBeGreaterThan(0);
    expect(dialog().querySelector('[role="status"]')?.textContent).toBe("Loading the repositories");
    expect(dialog().textContent).not.toContain("Reading the repositories");
  });

  it("still offers the token, by hand", async () => {
    const { api } = fakeApi({
      "/api/github": APP,
      "/api/github/repositories": { repositories: [] },
    });
    await mount(<RepositoryDialog api={api} onClose={() => {}} onAdded={() => {}} />);
    await click(button(dialog(), "Use a token instead"));
    expect(dialog().textContent).toContain("A repository that holds one tool");
  });
});

describe("a new tool (D-123)", () => {
  it("has a repository made in an organisation the app is installed on", async () => {
    const { api, sent } = fakeApi({
      "/api/github": APP,
      "POST /api/github/tools": {
        tool: "tickets",
        repo: "acme-sh/tickets",
        url: "https://github.com/acme-sh/tickets",
      },
    });
    await mount(<NewToolDialog api={api} onClose={() => {}} onAdded={() => {}} />);
    await type(dialog().querySelector("input")!, "tickets");
    await click(button(dialog(), "Make"));
    expect(sent).toEqual([
      { method: "POST", path: "/api/github/tools", body: { name: "tickets", owner: "acme-sh" } },
    ]);
    expect(dialog().textContent).toContain("tickets is made");
  });

  it("draws a skeleton of the form while GitHub is read", async () => {
    const { api } = fakeApi({ "/api/github": () => new Promise(() => {}) });
    await mount(<NewToolDialog api={api} onClose={() => {}} onAdded={() => {}} />);
    expect(dialog().querySelectorAll(".fg-skeleton").length).toBeGreaterThan(0);
    expect(dialog().textContent).not.toContain("Reading GitHub…");
  });

  it("says to connect GitHub when no organisation has the app", async () => {
    const { api } = fakeApi({ "/api/github": { ...APP, app: null, installations: [] } });
    await mount(<NewToolDialog api={api} onClose={() => {}} onAdded={() => {}} />);
    expect(dialog().textContent).toContain("Connect GitHub first");
    expect(button(dialog(), "Make").disabled).toBe(true);
  });
});
