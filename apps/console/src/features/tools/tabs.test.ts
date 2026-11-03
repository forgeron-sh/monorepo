import { describe, expect, it } from "vitest";
import { registerToolTab, toolTabs } from "./tabs";

const load = async () => ({ default: () => null });

describe("tool tabs", () => {
  it("lists tabs in order, and hides admin tabs from members", () => {
    registerToolTab({ id: "secrets", title: "Secrets", adminOnly: true, load });
    registerToolTab({ id: "overview", title: "Overview", adminOnly: false, order: 0, load });
    registerToolTab({ id: "access", title: "Access", adminOnly: true, order: 50, load });
    expect(toolTabs(true).map((t) => t.id)).toEqual(["overview", "access", "secrets"]);
    expect(toolTabs(false).map((t) => t.id)).toEqual(["overview"]);
  });
  it("replaces a tab registered twice", () => {
    registerToolTab({ id: "overview", title: "About", adminOnly: false, order: 0, load });
    expect(toolTabs(false).filter((t) => t.id === "overview")).toHaveLength(1);
    expect(toolTabs(false)[0]!.title).toBe("About");
  });
});
