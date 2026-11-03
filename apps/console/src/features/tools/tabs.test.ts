import { describe, expect, it } from "vitest";
import { registerToolTab, toolTabs } from "./tabs";

const tab = (id: string, adminOnly = false) => ({
  id,
  title: id,
  adminOnly,
  load: async () => ({ default: () => null }),
});

describe("the tool tab registry", () => {
  it("lists tabs in the order of the design, the unknown ones last", () => {
    registerToolTab(tab("zz-extra"));
    registerToolTab(tab("activity"));
    registerToolTab(tab("branches", true));
    registerToolTab(tab("overview"));
    const ids = toolTabs(true).map((t) => t.id);
    expect(ids.indexOf("overview")).toBeLessThan(ids.indexOf("branches"));
    expect(ids.indexOf("branches")).toBeLessThan(ids.indexOf("activity"));
    expect(ids.at(-1)).toBe("zz-extra");
  });

  it("hides the admin-only tabs from anyone else, and replaces a tab registered twice", () => {
    registerToolTab(tab("secrets-test", true));
    expect(toolTabs(false).map((t) => t.id)).not.toContain("secrets-test");
    expect(toolTabs(true).map((t) => t.id)).toContain("secrets-test");
    registerToolTab({ ...tab("secrets-test"), title: "Second" });
    expect(toolTabs(false).filter((t) => t.id === "secrets-test")).toEqual([
      expect.objectContaining({ title: "Second" }),
    ]);
  });
});
