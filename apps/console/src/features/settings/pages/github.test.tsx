// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount, type } from "../../../test-utils";
import type { PageProps } from "../../../shell/page-props";
import GithubPage from "./github";

afterEach(cleanup);

const props = (api: PageProps["api"]) =>
  ({
    api,
    ws: {} as PageProps["ws"],
    now: () => new Date(),
    go: () => {},
    params: {},
  }) as PageProps;

describe("Settings, GitHub (D-123)", () => {
  it("sends an admin to create the app in the organisation they name", async () => {
    const { api } = fakeApi({ "/api/github": { available: true, app: null, installations: [] } });
    const page = await mount(<GithubPage {...props(api)} />);
    const create = button(page, "Create the GitHub App") as unknown as HTMLAnchorElement;
    expect(create.getAttribute("href")).toBe("/github/app/new");
    await type(page.querySelector("input")!, "acme-sh");
    expect(create.getAttribute("href")).toBe("/github/app/new?owner=acme-sh");
  });

  it("shows the app, its installations, and disconnects it", async () => {
    let connected = true;
    const app = {
      slug: "forgeron-acme",
      owner: "acme-sh",
      htmlUrl: "https://github.com/apps/forgeron-acme",
      installUrl: "https://github.com/apps/forgeron-acme/installations/new",
      createdAt: "2026-11-10T00:00:00.000Z",
    };
    const { api, sent } = fakeApi({
      "/api/github": () => ({
        available: true,
        app: connected ? app : null,
        installations: connected
          ? [{ id: 7, account: "acme-sh", accountType: "Organization" }]
          : [],
      }),
      "DELETE /api/github": () => {
        connected = false;
        return undefined;
      },
    });
    const page = await mount(<GithubPage {...props(api)} />);
    expect(page.textContent).toContain("forgeron-acme");
    expect(page.textContent).toContain("acme-sh");
    expect(
      (button(page, "Install on GitHub") as unknown as HTMLAnchorElement).getAttribute("href"),
    ).toBe(app.installUrl);
    await click(button(page, "Disconnect"));
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    await click(button(dialog, "Disconnect"));
    expect(sent).toEqual([{ method: "DELETE", path: "/api/github", body: undefined }]);
    expect(page.textContent).toContain("Create the GitHub App");
  });

  it("says when the install cannot keep the app's keys", async () => {
    const { api } = fakeApi({ "/api/github": { available: false, app: null, installations: [] } });
    const page = await mount(<GithubPage {...props(api)} />);
    expect(page.textContent).toContain("Not available on this install");
  });
});
