import { describe, expect, it } from "vitest";
import { registerToolTab, toolTabs } from "./tabs";

const load = async () => ({ default: () => null });

describe("tool tabs", () => {
  it("lists tabs in order, and hides admin tabs from members", () => {
    registerToolTab({ id: "secrets", title: "Secrets", scope: "tool", adminOnly: true, load });
    registerToolTab({
      id: "overview",
      title: "Overview",
      scope: "tool",
      adminOnly: false,
      order: 0,
      load,
    });
    registerToolTab({
      id: "access",
      title: "Access",
      scope: "tool",
      adminOnly: true,
      order: 50,
      load,
    });
    expect(toolTabs(true).map((t) => t.id)).toEqual(["overview", "access", "secrets"]);
    expect(toolTabs(false).map((t) => t.id)).toEqual(["overview"]);
  });
  it("replaces a tab registered twice", () => {
    registerToolTab({
      id: "overview",
      title: "About",
      scope: "tool",
      adminOnly: false,
      order: 0,
      load,
    });
    expect(toolTabs(false).filter((t) => t.id === "overview")).toHaveLength(1);
    expect(toolTabs(false)[0]!.title).toBe("About");
  });
});
