// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { ApiError } from "../../../api";
import { cleanup, click, mount } from "../../../test-utils";
import { tabProps, toolsApi, versions } from "../test-helpers";
import VersionsTab from "./versions-tab";

afterEach(cleanup);
const open = (routes: Record<string, unknown>) =>
  mount(<VersionsTab {...tabProps(toolsApi(routes).api)} />);

describe("the releases (D-125)", () => {
  it("shows each version with where it is served, its changelog and what changed from the one before", async () => {
    const page = await open({ "/api/tools/crm/versions": versions });
    const items = [
      ...page.querySelectorAll("ul.ft-versions-list:not(.ft-environments) > li.ft-version"),
    ];
    expect(items).toHaveLength(2);
    expect(items[0]!.textContent).toContain("1.5.1");
    expect(items[0]!.textContent).toContain("Release");
    expect(items[0]!.textContent).toContain("Branch");
    expect(items[0]!.textContent).toContain("feat-export");
    expect(items[0]!.textContent).toContain("Compared with 1.4.0");
    expect(items[0]!.textContent).toContain("Minor change");
    expect(items[0]!.textContent).toContain("The export keeps the column order.");
    expect(items[0]!.textContent).toContain("What changed in the manifest (1)");
    expect(items[0]!.textContent).toContain("actions.contacts.export");
    expect(items[1]!.textContent).toContain("Production");
    expect(items[1]!.textContent).toContain("staging");
    expect(items[1]!.textContent).toContain("First version.");
    expect(items[1]!.textContent).toContain("No changelog entry.");
  });

  it("hides the builds that are not releases until asked", async () => {
    const withBuild = {
      versions: [
        { ...versions.versions[0]!, version: "1.5.2-preview.x", release: false },
        ...versions.versions,
      ],
    };
    const page = await open({ "/api/tools/crm/versions": withBuild });
    const listed = () =>
      [...page.querySelectorAll("ul.ft-versions-list:not(.ft-environments) > li.ft-version")].map(
        (li) => li.querySelector("h3")?.textContent,
      );
    expect(listed()).toEqual(["1.5.1", "1.4.0"]);
    await click(
      [...page.querySelectorAll("label")]
        .find((l) => l.textContent?.startsWith("Show the builds"))!
        .querySelector("input")!,
    );
    expect(listed()).toEqual(["1.5.2-preview.x", "1.5.1", "1.4.0"]);
  });

  it("shows the version each channel serves and what it contains, production first", async () => {
    const page = await open({ "/api/tools/crm/versions": versions });
    const env = [
      ...page.querySelectorAll('section[aria-label="Version of each channel"] > ul > li'),
    ];
    expect(env).toHaveLength(3);
    expect(env[0]!.textContent).toContain("Production");
    expect(env[0]!.textContent).toContain("1.4.0");
    expect(env[0]!.textContent).toContain("First version");
    expect(env[1]!.textContent).toContain("staging");
    expect(env[2]!.textContent).toContain("feat-export");
    expect(env[2]!.textContent).toContain("1.5.1");
    expect(env[2]!.textContent).toContain("since 1.4.0");
    expect(env[2]!.textContent).toContain("The export keeps the column order.");
  });

  it("explains an empty list and an error", async () => {
    expect((await open({ "/api/tools/crm/versions": { versions: [] } })).textContent).toContain(
      "No release yet",
    );
    await cleanup();
    const broken = await open({
      "/api/tools/crm/versions": () => {
        throw new ApiError("403", 403);
      },
    });
    expect(broken.textContent).toContain("The releases could not be loaded.");
    expect(broken.textContent).toContain("You are not allowed to do this.");
  });
});
