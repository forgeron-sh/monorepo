// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { ApiError } from "../../../api";
import { cleanup, mount } from "../../../test-utils";
import { tabProps, toolsApi, versions } from "../test-helpers";
import VersionsTab from "./versions-tab";

afterEach(cleanup);
const open = (routes: Record<string, unknown>) =>
  mount(<VersionsTab {...tabProps(toolsApi(routes).api)} />);

describe("the versions", () => {
  it("shows each version with where it is served, its changelog and what changed from the one before", async () => {
    const page = await open({ "/api/tools/crm/versions": versions });
    const items = [...page.querySelectorAll("li.ft-version")];
    expect(items).toHaveLength(2);
    expect(items[0]!.textContent).toContain("1.5.1");
    expect(items[0]!.textContent).toContain("Preview");
    expect(items[0]!.textContent).toContain("feat-export");
    expect(items[0]!.textContent).toContain("Compared with 1.4.0");
    expect(items[0]!.textContent).toContain("Minor change");
    expect(items[0]!.textContent).toContain("The export keeps the column order.");
    expect(items[0]!.textContent).toContain("What changed in the manifest (1)");
    expect(items[0]!.textContent).toContain("actions.contacts.export");
    expect(items[1]!.textContent).toContain("Production");
    expect(items[1]!.textContent).toContain("First version.");
    expect(items[1]!.textContent).toContain("No changelog entry.");
  });

  it("explains an empty list and an error", async () => {
    expect((await open({ "/api/tools/crm/versions": { versions: [] } })).textContent).toContain(
      "No version yet",
    );
    await cleanup();
    const broken = await open({
      "/api/tools/crm/versions": () => {
        throw new ApiError("403", 403);
      },
    });
    expect(broken.textContent).toContain("The versions could not be loaded.");
    expect(broken.textContent).toContain("You are not allowed to do this.");
  });
});
